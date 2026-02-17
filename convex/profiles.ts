import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { educationEntry, experienceEntry } from './lib/validators'

const profileInsertValidator = v.object({
  organizationId: v.id('organizations'),
  linkedInUrl: v.string(),
  linkedInUsername: v.optional(v.string()),
  name: v.string(),
  headline: v.string(),
  summary: v.optional(v.string()),
  profileImageUrl: v.optional(v.string()),
  location: v.optional(v.string()),
  industry: v.optional(v.string()),
  education: v.array(educationEntry),
  experience: v.array(experienceEntry),
  skills: v.optional(v.array(v.string())),
  majors: v.array(v.string()),
  schools: v.array(v.string()),
  companies: v.array(v.string()),
  jobTitles: v.array(v.string()),
  claimedByUserId: v.optional(v.string()),
  email: v.optional(v.string()),
})

export const listByOrganization = query({
  args: { organizationId: v.id('organizations') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('profiles')
      .withIndex('by_organization_linkedin', (q) =>
        q.eq('organizationId', args.organizationId)
      )
      .collect()
  },
})

export const get = query({
  args: { id: v.id('profiles') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id)
  },
})

export const getByOrganizationAndLinkedIn = query({
  args: {
    organizationId: v.id('organizations'),
    linkedInUrl: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('profiles')
      .withIndex('by_organization_linkedin', (q) =>
        q.eq('organizationId', args.organizationId).eq('linkedInUrl', args.linkedInUrl)
      )
      .unique()
  },
})

export const getClaimedByUser = query({
  args: {
    organizationId: v.id('organizations'),
    claimedByUserId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('profiles')
      .withIndex('by_organization_claimed', (q) =>
        q.eq('organizationId', args.organizationId).eq('claimedByUserId', args.claimedByUserId)
      )
      .unique()
  },
})

export const create = mutation({
  args: profileInsertValidator,
  handler: async (ctx, args) => {
    return await ctx.db.insert('profiles', args)
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
    claimedByUserId: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, val]) => val !== undefined)
    ) as Record<string, unknown>
    if (Object.keys(filtered).length === 0) return id
    await ctx.db.patch(id, filtered)
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
    const doc = { ...args.profile, organizationId: args.organizationId, linkedInUrl: args.linkedInUrl }
    if (existing) {
      await ctx.db.patch(existing._id, doc)
      return existing._id
    }
    return await ctx.db.insert('profiles', doc)
  },
})
