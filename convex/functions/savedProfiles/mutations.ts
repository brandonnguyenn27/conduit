import { mutation } from '../../_generated/server'
import { v } from 'convex/values'

export const add = mutation({
  args: {
    userId: v.string(),
    profileId: v.id('profiles'),
    organizationId: v.id('organizations'),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('savedProfiles')
      .withIndex('by_user_org', (q) =>
        q.eq('userId', args.userId).eq('organizationId', args.organizationId)
      )
      .filter((q) => q.eq(q.field('profileId'), args.profileId))
      .first()
    if (existing) return existing._id
    return await ctx.db.insert('savedProfiles', {
      userId: args.userId,
      profileId: args.profileId,
      organizationId: args.organizationId,
      createdAt: Date.now(),
    })
  },
})

export const remove = mutation({
  args: {
    userId: v.string(),
    profileId: v.id('profiles'),
  },
  handler: async (ctx, args) => {
    const saved = await ctx.db
      .query('savedProfiles')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .filter((q) => q.eq(q.field('userId'), args.userId))
      .first()
    if (saved) await ctx.db.delete(saved._id)
  },
})
