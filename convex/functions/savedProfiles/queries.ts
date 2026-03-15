import { query } from '../../_generated/server'
import { v } from 'convex/values'
import { authComponent } from '../../auth'

export const listByUserAndOrg = query({
  args: {
    organizationId: v.id('organizations'),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx)
    if (!user) {
      throw new Error('Unauthorized')
    }

    return await ctx.db
      .query('savedProfiles')
      .withIndex('by_user_org', (q) =>
        q.eq('userId', user._id).eq('organizationId', args.organizationId)
      )
      .collect()
  },
})

export const listPopulatedByUserAndOrg = query({
  args: {
    organizationId: v.id('organizations'),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx)
    if (!user) {
      throw new Error('Unauthorized')
    }

    const savedRecords = await ctx.db
      .query('savedProfiles')
      .withIndex('by_user_org', (q) =>
        q.eq('userId', user._id).eq('organizationId', args.organizationId)
      )
      .order('desc')
      .collect()

    const profiles = []
    for (const saved of savedRecords) {
      const profileInfo = await ctx.db.get(saved.profileId)
      if (profileInfo) {
        profiles.push({
          _id: profileInfo._id,
          name: profileInfo.name,
          headline: profileInfo.currentExperience?.title || '',
          currentCompany: profileInfo.currentExperience?.companyName || profileInfo.currentCompany,
          linkedInUrl: profileInfo.linkedInUrl,
        })
      }
    }

    return profiles
  },
})

export const isSaved = query({
  args: {
    profileId: v.id('profiles'),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx)
    if (!user) return false
    
    const saved = await ctx.db
      .query('savedProfiles')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .filter((q) => q.eq(q.field('userId'), user._id))
      .first()
      
    return saved !== null
  },
})
