import { mutation } from '../../_generated/server'
import { v } from 'convex/values'
import { educationEntry, experienceEntry } from '../../lib/validators'
import { profileInsertValidator, toSearchText } from './helpers'

export const create = mutation({
  args: profileInsertValidator,
  handler: async (ctx, args) => {
    const doc = {
      ...args,
      searchText: toSearchText({
        name: args.name,
        headline: args.headline,
        summary: args.summary,
        location: args.location,
        industry: args.industry,
        skills: args.skills,
        majors: args.majors,
        schools: args.schools,
        companies: args.companies,
        jobTitles: args.jobTitles,
      }),
    }
    return await ctx.db.insert('profiles', doc)
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
    await ctx.db.patch(id, {
      ...filtered,
      searchText: toSearchText({
        name: merged.name,
        headline: merged.headline,
        summary: merged.summary,
        location: merged.location,
        industry: merged.industry,
        skills: merged.skills,
        majors: merged.majors,
        schools: merged.schools,
        companies: merged.companies,
        jobTitles: merged.jobTitles,
      }),
    })
    return id
  },
})

export const remove = mutation({
  args: { id: v.id('profiles') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id)
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
      searchText: toSearchText({
        name: args.profile.name,
        headline: args.profile.headline,
        summary: args.profile.summary,
        location: args.profile.location,
        industry: args.profile.industry,
        skills: args.profile.skills,
        majors: args.profile.majors,
        schools: args.profile.schools,
        companies: args.profile.companies,
        jobTitles: args.profile.jobTitles,
      }),
    }
    if (existing) {
      await ctx.db.patch(existing._id, doc)
      return existing._id
    }
    return await ctx.db.insert('profiles', doc)
  },
})

export const backfillSearchText = mutation({
  args: {
    limit: v.optional(v.number()),
    organizationId: v.optional(v.id('organizations')),
  },
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(args.limit ?? 100, 500))
    const scanLimit = Math.max(limit, Math.min(limit * 4, 2000))
    let docs
    if (args.organizationId) {
      const organizationId = args.organizationId
      docs = await ctx.db
        .query('profiles')
        .withIndex('by_organization_linkedin', (q) => q.eq('organizationId', organizationId))
        .take(scanLimit)
    } else {
      docs = await ctx.db.query('profiles').take(scanLimit)
    }

    let updated = 0
    for (const profile of docs) {
      if (updated >= limit) break
      const nextSearchText = toSearchText({
        name: profile.name,
        headline: profile.headline,
        summary: profile.summary,
        location: profile.location,
        industry: profile.industry,
        skills: profile.skills,
        majors: profile.majors,
        schools: profile.schools,
        companies: profile.companies,
        jobTitles: profile.jobTitles,
      })
      if (profile.searchText === nextSearchText) continue
      await ctx.db.patch(profile._id, { searchText: nextSearchText })
      updated++
    }

    return { scanned: docs.length, updated }
  },
})
