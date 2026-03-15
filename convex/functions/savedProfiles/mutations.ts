import { mutation } from '../../_generated/server'
import { v } from 'convex/values'
import { authComponent } from '../../auth'

export const add = mutation({
  args: {
    profileId: v.id('profiles'),
    organizationId: v.id('organizations'),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx)
    if (!user) {
      throw new Error('Unauthorized')
    }

    const existing = await ctx.db
      .query('savedProfiles')
      .withIndex('by_user_org', (q) =>
        q.eq('userId', user._id).eq('organizationId', args.organizationId)
      )
      .filter((q) => q.eq(q.field('profileId'), args.profileId))
      .first()
      
    if (existing) return existing._id
    
    return await ctx.db.insert('savedProfiles', {
      userId: user._id,
      profileId: args.profileId,
      organizationId: args.organizationId,
      createdAt: Date.now(),
    })
  },
})

export const remove = mutation({
  args: {
    profileId: v.id('profiles'),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx)
    if (!user) {
      throw new Error('Unauthorized')
    }

    const saved = await ctx.db
      .query('savedProfiles')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .filter((q) => q.eq(q.field('userId'), user._id))
      .first()
      
    if (saved) await ctx.db.delete(saved._id)
  },
})
