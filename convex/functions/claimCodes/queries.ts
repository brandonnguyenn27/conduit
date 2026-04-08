import { query, type QueryCtx } from '../../_generated/server'
import { v } from 'convex/values'
import { authComponent } from '../../auth'

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

async function requireAdminAppUser(ctx: QueryCtx) {
  const user = await authComponent.safeGetAuthUser(ctx)
  if (!user) {
    throw new Error('Unauthorized')
  }

  const appUser = await ctx.db
    .query('appUsers')
    .withIndex('by_better_auth_user', (q) => q.eq('betterAuthUserId', user._id))
    .unique()

  if (!appUser || appUser.isAdmin !== true) {
    throw new Error('Forbidden')
  }

  return appUser
}

export const listActiveForAdmin = query({
  args: {
    now: v.number(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const appUser = await requireAdminAppUser(ctx)
    const limit = Math.max(1, Math.min(args.limit ?? 200, 500))

    const activeCodes = await ctx.db
      .query('claimCodes')
      .withIndex('by_organization_expiresAt', (q) =>
        q.eq('organizationId', appUser.organizationId).gt('expiresAt', args.now)
      )
      .take(limit)

    const unusedCodes = activeCodes.filter((claimCode) => !claimCode.usedAt)
    const rows = await Promise.all(
      unusedCodes.map(async (claimCode) => {
        const profile = await ctx.db.get(claimCode.profileId)
        return {
          _id: claimCode._id,
          profileId: claimCode.profileId,
          code: claimCode.code,
          requesterName: profile?.name ?? 'Unknown',
          expiresAt: claimCode.expiresAt,
        }
      })
    )

    return rows
  },
})
