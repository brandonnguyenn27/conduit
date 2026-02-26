import { query } from '../../_generated/server'
import { v } from 'convex/values'

export const listPending = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50
    return await ctx.db
      .query('importQueue')
      .withIndex('by_status', (q) => q.eq('status', 'pending'))
      .take(limit)
  },
})

export const listByOrganization = query({
  args: { organizationId: v.id('organizations') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('importQueue')
      .withIndex('by_organization', (q) => q.eq('organizationId', args.organizationId))
      .collect()
  },
})

export const get = query({
  args: { id: v.id('importQueue') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id)
  },
})
