import { query } from '../../_generated/server'
import { v } from 'convex/values'
import { paginationOptsValidator, paginationResultValidator } from 'convex/server'
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


const savedProfileTableRowValidator = v.object({
  _id: v.id('profiles'),
  name: v.string(),
  headline: v.string(),
  currentCompany: v.optional(v.string()),
  linkedInUrl: v.string(),
  major: v.optional(v.string()),
})

export const listPopulatedByUserAndOrg = query({
  args: {
    organizationId: v.id('organizations'),
    paginationOpts: paginationOptsValidator,
  },
  returns: paginationResultValidator(savedProfileTableRowValidator),
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

    return {
      ...savedRecordsResult,
      page: await Promise.all(
        savedRecordsResult.page.map(async (saved) => {
          const major =
            saved.previewMajor !== undefined
              ? saved.previewMajor || undefined
              : (await ctx.db.get(saved.profileId))?.majors[0]
          return {
            _id: saved.profileId,
            name: saved.previewName,
            headline: saved.previewHeadline,
            currentCompany: saved.previewCurrentCompany,
            linkedInUrl: saved.previewLinkedInUrl,
            major,
          }
        })
      ),
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
      .take(5000)

    return savedProfiles.map((saved) => saved.profileId)
  },
})
