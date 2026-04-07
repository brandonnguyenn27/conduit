import { query } from '../../_generated/server'
import { v } from 'convex/values'
import { paginationOptsValidator } from 'convex/server'
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
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx)
    if (!user) {
      throw new Error('Unauthorized')
    }

    const savedRecordsResult = await ctx.db
      .query('savedProfiles')
      .withIndex('by_user_org', (q) =>
        q.eq('userId', user._id).eq('organizationId', args.organizationId)
      )
      .order('desc')
      .paginate(args.paginationOpts)

    const profiles = []
    for (const saved of savedRecordsResult.page) {
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

    return {
      ...savedRecordsResult,
      page: profiles,
    }
  },
})

export const isSaved = query({
  args: {
    profileId: v.id('profiles'),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx)
    if (!user) return false
    
    const saved = await ctx.db
      .query('savedProfiles')
      .withIndex('by_user_profile', (q) =>
        q.eq('userId', user._id).eq('profileId', args.profileId)
      )
      .first()
      
    return saved !== null
  },
})

export const listSavedProfileIdsByUserAndOrg = query({
  args: {
    organizationId: v.id('organizations'),
  },
  returns: v.array(v.id('profiles')),
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx)
    if (!user) {
      throw new Error('Unauthorized')
    }

    const savedProfiles = await ctx.db
      .query('savedProfiles')
      .withIndex('by_user_org', (q) =>
        q.eq('userId', user._id).eq('organizationId', args.organizationId)
      )
      .collect()

    return savedProfiles.map((saved) => saved.profileId)
  },
})
