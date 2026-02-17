import { mutation, query } from './_generated/server'
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

export const add = mutation({
  args: {
    userId: v.string(),
    profileId: v.id('profiles'),
    organizationId: v.id('organizations'),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('favorites')
      .withIndex('by_user_org', (q) =>
        q.eq('userId', args.userId).eq('organizationId', args.organizationId)
      )
      .filter((q) => q.eq(q.field('profileId'), args.profileId))
      .first()
    if (existing) return existing._id
    return await ctx.db.insert('favorites', {
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
    const fav = await ctx.db
      .query('favorites')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .filter((q) => q.eq(q.field('userId'), args.userId))
      .first()
    if (fav) await ctx.db.delete(fav._id)
  },
})
