import { query } from '../../_generated/server'
import { v } from 'convex/values'

export const getByBetterAuthUserId = query({
  args: { betterAuthUserId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('appUsers')
      .withIndex('by_better_auth_user', (q) =>
        q.eq('betterAuthUserId', args.betterAuthUserId)
      )
      .unique()
  },
})

export const listByOrganization = query({
  args: { organizationId: v.id('organizations') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('appUsers')
      .withIndex('by_organization', (q) =>
        q.eq('organizationId', args.organizationId)
      )
      .collect()
  },
})

export const get = query({
  args: { id: v.id('appUsers') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id)
  },
})
