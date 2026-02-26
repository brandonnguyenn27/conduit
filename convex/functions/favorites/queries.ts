import { query } from '../../_generated/server'
import { v } from 'convex/values'

export const listByUserAndOrg = query({
  args: {
    userId: v.string(),
    organizationId: v.id('organizations'),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('favorites')
      .withIndex('by_user_org', (q) =>
        q.eq('userId', args.userId).eq('organizationId', args.organizationId)
      )
      .collect()
  },
})

export const isFavorited = query({
  args: {
    userId: v.string(),
    profileId: v.id('profiles'),
  },
  handler: async (ctx, args) => {
    const fav = await ctx.db
      .query('favorites')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .filter((q) => q.eq(q.field('userId'), args.userId))
      .first()
    return fav !== null
  },
})
