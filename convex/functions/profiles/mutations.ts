import type { Id } from '../../_generated/dataModel'
import { mutation } from '../../_generated/server'
import { internal } from '../../_generated/api'
import { v } from 'convex/values'
import { deriveCurrentExperienceFromStored } from '../../lib/profiles/deriveCurrentExperience'
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
    const newTokens = extractFacetTokens(doc)
    await ctx.scheduler.runAfter(0, internal.functions.facets.mutations.applyProfileFacetChanges, {
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
      const newTokens = extractFacetTokens(updated)
      await ctx.scheduler.runAfter(0, internal.functions.facets.mutations.applyProfileFacetChanges, {
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
      await ctx.scheduler.runAfter(0, internal.functions.facets.mutations.applyProfileFacetChanges, {
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
      const newTokens = extractFacetTokens(saved)
      await ctx.scheduler.runAfter(0, internal.functions.facets.mutations.applyProfileFacetChanges, {
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

