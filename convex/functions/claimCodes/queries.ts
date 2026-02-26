import { query } from '../../_generated/server'
import { v } from 'convex/values'

export const getByCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('claimCodes')
      .withIndex('by_code', (q) => q.eq('code', args.code))
      .unique()
  },
})

export const listByProfile = query({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('claimCodes')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect()
  },
})

export const get = query({
  args: { id: v.id('claimCodes') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id)
  },
})
