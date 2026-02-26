import { query } from '../../_generated/server'
import { v } from 'convex/values'

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

export const searchByText = query({
  args: {
    organizationId: v.id('organizations'),
    searchText: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const q = args.searchText.trim()
    if (!q) return []
    const limit = Math.max(1, Math.min(args.limit ?? 25, 100))
    return await ctx.db
      .query('profiles')
      .withSearchIndex('by_search_text', (search) =>
        search.search('searchText', q).eq('organizationId', args.organizationId)
      )
      .take(limit)
  },
})
