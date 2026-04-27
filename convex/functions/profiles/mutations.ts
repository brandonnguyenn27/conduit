import type { Id } from '../../_generated/dataModel'
import { internalMutation, mutation, type MutationCtx } from '../../_generated/server'
import { v } from 'convex/values'
import { getLinkedInRefreshCooldownMs } from '../../lib/linkedinRefreshConfig'
import { authComponent } from '../../auth'
import { deriveCurrentExperienceFromStored } from '../../lib/profiles/deriveCurrentExperience'
import {
  canonicalizeJobTitleTokens,
  canonicalizeMajorTokens,
} from '../../lib/linkedin/canonicalizeFacets'
import { educationEntry, experienceEntry } from '../../lib/validators'
import {
  profileInsertValidator,
  toCompaniesSearchSlugFromExperience,
  toCurrentCompanySlugFromExperience,
  toCurrentJobTitlesSearchSlugFromExperience,
  toEducationSearchSlug,
  toJobTitlesSearchSlug,
  toPastJobTitlesSearchSlugFromExperience,
  toSuggestSearchText,
} from './helpers'
import { extractFacetTokens } from '../facets/helpers'
import { applyProfileFacetChanges } from '../facets/apply'
import {
  deleteSavedProfilesForProfile,
  syncSavedProfilePreviewsForProfile,
  toSavedProfilePreview,
} from '../savedProfiles/helpers'

async function requireAdminAppUser(ctx: MutationCtx) {
  const user = await authComponent.safeGetAuthUser(ctx)
  if (!user) {
    throw new Error('Unauthorized')
  }

  const appUser = await ctx.db
    .query('appUsers')
    .withIndex('by_better_auth_user', (q) => q.eq('betterAuthUserId', user._id))
    .unique()
  if (!appUser || appUser.isAdmin !== true) {
    throw new Error('Forbidden')
  }

  return appUser
}

const EMPTY_TOKENS = {
  companies: [] as string[],
  currentCompanies: [] as string[],
  majors: [] as string[],
  schools: [] as string[],
  currentRoles: [] as string[],
  pastRoles: [] as string[],
  classes: [] as string[],
  families: [] as string[],
}

export const create = mutation({
  args: profileInsertValidator,
  handler: async (ctx, args) => {
    const doc = {
      ...args,
      suggestSearchText: toSuggestSearchText({
        name: args.name,
        headline: args.headline,
        summary: args.summary,
        skills: args.skills,
        majors: args.majors,
        schools: args.schools,
        companies: args.companies,
        jobTitles: args.jobTitles,
        class: args.class,
        family: args.family,
      }),
      companiesSearchSlug: toCompaniesSearchSlugFromExperience(args.experience),
      currentCompanySlug: toCurrentCompanySlugFromExperience(args.experience),
      educationSearchSlug: toEducationSearchSlug(args.schools, args.majors),
      jobTitlesSearchSlug: toJobTitlesSearchSlug(args.jobTitles),
      currentJobTitlesSearchSlug: toCurrentJobTitlesSearchSlugFromExperience(args.experience),
      pastJobTitlesSearchSlug: toPastJobTitlesSearchSlugFromExperience(args.experience),
    }
    const id = await ctx.db.insert('profiles', doc)
    await syncSavedProfilePreviewsForProfile(ctx, { profileId: id, preview: toSavedProfilePreview(doc) })
    const newTokens = extractFacetTokens(doc)
    await applyProfileFacetChanges(ctx, {
      organizationId: args.organizationId,
      oldTokens: EMPTY_TOKENS,
      newTokens,
    })
    return id
  },
})

export const update = mutation({
  args: {
    id: v.id('profiles'),
    linkedInUsername: v.optional(v.string()),
    name: v.optional(v.string()),
    headline: v.optional(v.string()),
    summary: v.optional(v.string()),
    profileImageUrl: v.optional(v.string()),
    location: v.optional(v.string()),
    industry: v.optional(v.string()),
    education: v.optional(v.array(educationEntry)),
    experience: v.optional(v.array(experienceEntry)),
    skills: v.optional(v.array(v.string())),
    majors: v.optional(v.array(v.string())),
    schools: v.optional(v.array(v.string())),
    companies: v.optional(v.array(v.string())),
    jobTitles: v.optional(v.array(v.string())),
    currentCompany: v.optional(v.string()),
    class: v.optional(v.string()),
    family: v.optional(v.string()),
    claimedByUserId: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args
    const current = await ctx.db.get(id)
    if (!current) throw new Error('Profile not found')
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, val]) => val !== undefined)
    ) as Record<string, unknown>
    if (Object.keys(filtered).length === 0) return id
    const merged = {
      ...current,
      ...filtered,
    }
    const nextSuggestSearchText = toSuggestSearchText({
      name: merged.name,
      headline: merged.headline,
      summary: merged.summary,
      skills: merged.skills,
      majors: merged.majors,
      schools: merged.schools,
      companies: merged.companies,
      jobTitles: merged.jobTitles,
      class: merged.class,
      family: merged.family,
    })
    const patchDoc: Record<string, unknown> = {
      ...filtered,
      companiesSearchSlug: toCompaniesSearchSlugFromExperience(merged.experience),
      currentCompanySlug: toCurrentCompanySlugFromExperience(merged.experience),
      educationSearchSlug: toEducationSearchSlug(merged.schools, merged.majors),
      jobTitlesSearchSlug: toJobTitlesSearchSlug(merged.jobTitles),
      currentJobTitlesSearchSlug: toCurrentJobTitlesSearchSlugFromExperience(merged.experience),
      pastJobTitlesSearchSlug: toPastJobTitlesSearchSlugFromExperience(merged.experience),
    }
    if (current.suggestSearchText !== nextSuggestSearchText) {
      patchDoc.suggestSearchText = nextSuggestSearchText
    }
    const oldTokens = extractFacetTokens(current)
    await ctx.db.patch(id, patchDoc)
    const updated = await ctx.db.get(id)
    if (updated) {
      await syncSavedProfilePreviewsForProfile(ctx, {
        profileId: updated._id,
        preview: toSavedProfilePreview(updated),
      })
      const newTokens = extractFacetTokens(updated)
      await applyProfileFacetChanges(ctx, {
        organizationId: current.organizationId,
        oldTokens,
        newTokens,
      })
    }
    return id
  },
})

export const remove = mutation({
  args: { id: v.id('profiles') },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id)
    if (doc) {
      const oldTokens = extractFacetTokens(doc)
      await ctx.db.delete(args.id)
      await deleteSavedProfilesForProfile(ctx, args.id)
      await applyProfileFacetChanges(ctx, {
        organizationId: doc.organizationId,
        oldTokens,
        newTokens: EMPTY_TOKENS,
      })
    } else {
      await ctx.db.delete(args.id)
    }
  },
})

export const upsertFromImport = mutation({
  args: {
    organizationId: v.id('organizations'),
    linkedInUrl: v.string(),
    profile: profileInsertValidator,
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('profiles')
      .withIndex('by_organization_linkedin', (q) =>
        q.eq('organizationId', args.organizationId).eq('linkedInUrl', args.linkedInUrl)
      )
      .unique()
    const doc = {
      ...args.profile,
      organizationId: args.organizationId,
      linkedInUrl: args.linkedInUrl,
      suggestSearchText: toSuggestSearchText({
        name: args.profile.name,
        headline: args.profile.headline,
        summary: args.profile.summary,
        skills: args.profile.skills,
        majors: args.profile.majors,
        schools: args.profile.schools,
        companies: args.profile.companies,
        jobTitles: args.profile.jobTitles,
        class: args.profile.class,
        family: args.profile.family,
      }),
      companiesSearchSlug: toCompaniesSearchSlugFromExperience(args.profile.experience),
      currentCompanySlug: toCurrentCompanySlugFromExperience(args.profile.experience),
      educationSearchSlug: toEducationSearchSlug(args.profile.schools, args.profile.majors),
      jobTitlesSearchSlug: toJobTitlesSearchSlug(args.profile.jobTitles),
      currentJobTitlesSearchSlug: toCurrentJobTitlesSearchSlugFromExperience(
        args.profile.experience
      ),
      pastJobTitlesSearchSlug: toPastJobTitlesSearchSlugFromExperience(args.profile.experience),
    }
    const oldTokens = existing ? extractFacetTokens(existing) : EMPTY_TOKENS
    let profileId: Id<'profiles'>
    if (existing) {
      await ctx.db.patch(existing._id, doc)
      profileId = existing._id
    } else {
      profileId = await ctx.db.insert('profiles', doc)
    }
    const saved = await ctx.db.get(profileId)
    if (saved) {
      await syncSavedProfilePreviewsForProfile(ctx, {
        profileId: saved._id,
        preview: toSavedProfilePreview(saved),
      })
      const newTokens = extractFacetTokens(saved)
      await applyProfileFacetChanges(ctx, {
        organizationId: args.organizationId,
        oldTokens,
        newTokens,
      })
    }
    return profileId
  },
})

export const backfillSuggestSearchText = mutation({
  args: {
    limit: v.optional(v.number()),
    organizationId: v.optional(v.id('organizations')),
  },
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(args.limit ?? 100, 500))
    const scanLimit = Math.max(limit, Math.min(limit * 4, 2000))
    let docs
    if (args.organizationId) {
      docs = await ctx.db
        .query('profiles')
        .withIndex('by_organization_linkedin', (q) =>
          q.eq('organizationId', args.organizationId!)
        )
        .take(scanLimit)
    } else {
      docs = await ctx.db.query('profiles').take(scanLimit)
    }

    let updated = 0
    for (const profile of docs) {
      if (updated >= limit) break
      const next = toSuggestSearchText({
        name: profile.name,
        headline: profile.headline,
        summary: profile.summary,
        skills: profile.skills,
        majors: profile.majors,
        schools: profile.schools,
        companies: profile.companies,
        jobTitles: profile.jobTitles,
        class: profile.class,
        family: profile.family,
      })
      if (profile.suggestSearchText === next) continue
      await ctx.db.patch(profile._id, { suggestSearchText: next })
      updated++
    }
    return { scanned: docs.length, updated }
  },
})

export const backfillCompanySlugs = mutation({
  args: {
    limit: v.optional(v.number()),
    organizationId: v.optional(v.id('organizations')),
  },
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(args.limit ?? 100, 500))
    const scanLimit = Math.max(limit, Math.min(limit * 4, 2000))
    let docs
    if (args.organizationId) {
      docs = await ctx.db
        .query('profiles')
        .withIndex('by_organization_linkedin', (q) =>
          q.eq('organizationId', args.organizationId!)
        )
        .take(scanLimit)
    } else {
      docs = await ctx.db.query('profiles').take(scanLimit)
    }

    let updated = 0
    for (const profile of docs) {
      if (updated >= limit) break
      const nextCompaniesSearchSlug = toCompaniesSearchSlugFromExperience(profile.experience)
      const nextCurrentCompanySlug = toCurrentCompanySlugFromExperience(profile.experience)
      if (
        profile.companiesSearchSlug === nextCompaniesSearchSlug &&
        profile.currentCompanySlug === nextCurrentCompanySlug
      ) {
        continue
      }
      await ctx.db.patch(profile._id, {
        companiesSearchSlug: nextCompaniesSearchSlug,
        currentCompanySlug: nextCurrentCompanySlug,
      })
      updated++
    }
    return { scanned: docs.length, updated }
  },
})

export const backfillEducationSlugs = mutation({
  args: {
    limit: v.optional(v.number()),
    organizationId: v.optional(v.id('organizations')),
  },
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(args.limit ?? 100, 500))
    const scanLimit = Math.max(limit, Math.min(limit * 4, 2000))
    let docs
    if (args.organizationId) {
      docs = await ctx.db
        .query('profiles')
        .withIndex('by_organization_linkedin', (q) =>
          q.eq('organizationId', args.organizationId!)
        )
        .take(scanLimit)
    } else {
      docs = await ctx.db.query('profiles').take(scanLimit)
    }

    let updated = 0
    for (const profile of docs) {
      if (updated >= limit) break
      const nextEducationSearchSlug = toEducationSearchSlug(profile.schools, profile.majors)
      if (profile.educationSearchSlug === nextEducationSearchSlug) continue
      await ctx.db.patch(profile._id, { educationSearchSlug: nextEducationSearchSlug })
      updated++
    }
    return { scanned: docs.length, updated }
  },
})

export const backfillCurrentExperience = mutation({
  args: {
    limit: v.optional(v.number()),
    organizationId: v.optional(v.id('organizations')),
  },
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(args.limit ?? 100, 500))
    const scanLimit = Math.max(limit, Math.min(limit * 4, 2000))
    let docs
    if (args.organizationId) {
      docs = await ctx.db
        .query('profiles')
        .withIndex('by_organization_linkedin', (q) =>
          q.eq('organizationId', args.organizationId!)
        )
        .take(scanLimit)
    } else {
      docs = await ctx.db.query('profiles').take(scanLimit)
    }

    let updated = 0
    for (const profile of docs) {
      if (updated >= limit) break
      const derived = deriveCurrentExperienceFromStored(profile.experience)
      if (!derived) continue
      const nextCurrentExperience = derived.currentExperience
      const currentCurrentExperience = profile.currentExperience
      if (
        currentCurrentExperience &&
        JSON.stringify(currentCurrentExperience) === JSON.stringify(nextCurrentExperience)
      ) {
        continue
      }
      await ctx.db.patch(profile._id, {
        currentExperience: nextCurrentExperience,
      })
      updated++
    }
    return { scanned: docs.length, updated }
  },
})

export const backfillJobTitleSlugs = mutation({
  args: {
    limit: v.optional(v.number()),
    organizationId: v.optional(v.id('organizations')),
  },
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(args.limit ?? 100, 500))
    const scanLimit = Math.max(limit, Math.min(limit * 4, 2000))
    let docs
    if (args.organizationId) {
      docs = await ctx.db
        .query('profiles')
        .withIndex('by_organization_linkedin', (q) =>
          q.eq('organizationId', args.organizationId!)
        )
        .take(scanLimit)
    } else {
      docs = await ctx.db.query('profiles').take(scanLimit)
    }

    let updated = 0
    for (const profile of docs) {
      if (updated >= limit) break
      const nextJobTitlesSearchSlug = toJobTitlesSearchSlug(profile.jobTitles)
      const nextCurrentJobTitlesSearchSlug =
        toCurrentJobTitlesSearchSlugFromExperience(profile.experience)
      const nextPastJobTitlesSearchSlug = toPastJobTitlesSearchSlugFromExperience(
        profile.experience
      )
      if (
        profile.jobTitlesSearchSlug === nextJobTitlesSearchSlug &&
        profile.currentJobTitlesSearchSlug === nextCurrentJobTitlesSearchSlug &&
        profile.pastJobTitlesSearchSlug === nextPastJobTitlesSearchSlug
      ) {
        continue
      }
      await ctx.db.patch(profile._id, {
        jobTitlesSearchSlug: nextJobTitlesSearchSlug,
        currentJobTitlesSearchSlug: nextCurrentJobTitlesSearchSlug,
        pastJobTitlesSearchSlug: nextPastJobTitlesSearchSlug,
      })
      updated++
    }
    return { scanned: docs.length, updated }
  },
})

function dedupeTrimmed(values: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const value of values) {
    const trimmed = value.trim()
    if (!trimmed) continue
    const key = trimmed.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(trimmed)
  }
  return out
}

export const backfillNormalizedFacetArrays = internalMutation({
  args: {
    organizationId: v.id('organizations'),
    batchSize: v.optional(v.number()),
    cursor: v.optional(v.string()),
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const batchSize = Math.max(1, Math.min(args.batchSize ?? 50, 200))
    const result = await ctx.db
      .query('profiles')
      .withIndex('by_organization_linkedin', (q) =>
        q.eq('organizationId', args.organizationId)
      )
      .paginate({ cursor: args.cursor ?? null, numItems: batchSize })
    let updated = 0
    for (const profile of result.page) {
      const nextMajors = canonicalizeMajorTokens(profile.majors)
      const nextJobTitles = canonicalizeJobTitleTokens(profile.jobTitles)
      const nextSchools = dedupeTrimmed(profile.schools)
      const nextCompanies = dedupeTrimmed(profile.companies)

      const changed =
        JSON.stringify(nextMajors) !== JSON.stringify(profile.majors) ||
        JSON.stringify(nextJobTitles) !== JSON.stringify(profile.jobTitles) ||
        JSON.stringify(nextSchools) !== JSON.stringify(profile.schools) ||
        JSON.stringify(nextCompanies) !== JSON.stringify(profile.companies)

      if (!changed) continue

      if (!args.dryRun) {
        await ctx.db.patch(profile._id, {
          majors: nextMajors,
          jobTitles: nextJobTitles,
          schools: nextSchools,
          companies: nextCompanies,
          suggestSearchText: toSuggestSearchText({
            name: profile.name,
            headline: profile.headline,
            summary: profile.summary,
            skills: profile.skills,
            majors: nextMajors,
            schools: nextSchools,
            companies: nextCompanies,
            jobTitles: nextJobTitles,
            class: profile.class,
            family: profile.family,
          }),
          educationSearchSlug: toEducationSearchSlug(nextSchools, nextMajors),
          jobTitlesSearchSlug: toJobTitlesSearchSlug(nextJobTitles),
        })
      }
      updated++
    }

    return {
      scanned: result.page.length,
      updated,
      dryRun: !!args.dryRun,
      isDone: result.isDone,
      nextCursor: result.isDone ? null : result.continueCursor,
    }
  },
})

export const completeLinkedInRefresh = internalMutation({
  args: {
    profileId: v.id('profiles'),
    organizationId: v.id('organizations'),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId)
    if (!profile || profile.organizationId !== args.organizationId) {
      return
    }
    const now = Date.now()
    await ctx.db.patch(args.profileId, {
      linkedinRefreshPendingSince: undefined,
      linkedinRefreshLastCompletedAt: now,
    })
  },
})

export const requestLinkedInRefresh = mutation({
  args: {
    organizationId: v.id('organizations'),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx)
    if (!user) {
      throw new Error('Unauthorized')
    }

    const appUser = await ctx.db
      .query('appUsers')
      .withIndex('by_better_auth_user', (q) => q.eq('betterAuthUserId', user._id))
      .unique()

    if (!appUser || appUser.organizationId !== args.organizationId) {
      throw new Error('Forbidden')
    }

    if (!appUser.profileId) {
      throw new Error('No profile linked to your account.')
    }

    const profile = await ctx.db.get(appUser.profileId)
    if (!profile || profile.organizationId !== args.organizationId) {
      throw new Error('No profile linked to your account.')
    }

    if (profile.linkedinRefreshPendingSince !== undefined) {
      throw new Error('You already have a pending LinkedIn update request.')
    }

    const cooldownMs = getLinkedInRefreshCooldownMs()
    const now = Date.now()
    const last = profile.linkedinRefreshLastCompletedAt
    if (last !== undefined && now < last + cooldownMs) {
      throw new Error('You can request another update after the cooldown period.')
    }

    await ctx.db.patch(profile._id, { linkedinRefreshPendingSince: now })
    return null
  },
})

export const removeLinkedInRefreshPending = mutation({
  args: {
    profileId: v.id('profiles'),
  },
  handler: async (ctx, args) => {
    const appUser = await requireAdminAppUser(ctx)
    const profile = await ctx.db.get(args.profileId)
    if (!profile || profile.organizationId !== appUser.organizationId) {
      throw new Error('Profile not found.')
    }
    await ctx.db.patch(args.profileId, { linkedinRefreshPendingSince: undefined })
    return null
  },
})

export const addLinkedInRefreshPending = mutation({
  args: {
    profileId: v.id('profiles'),
  },
  handler: async (ctx, args) => {
    const appUser = await requireAdminAppUser(ctx)
    const profile = await ctx.db.get(args.profileId)
    if (!profile || profile.organizationId !== appUser.organizationId) {
      throw new Error('Profile not found.')
    }
    if (profile.linkedinRefreshPendingSince !== undefined) {
      return null
    }
    await ctx.db.patch(args.profileId, { linkedinRefreshPendingSince: Date.now() })
    return null
  },
})

