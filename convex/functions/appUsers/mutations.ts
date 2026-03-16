import { mutation } from '../../_generated/server'
import { v } from 'convex/values'
import { authComponent } from '../../auth'

export const create = mutation({
  args: {
    betterAuthUserId: v.string(),
    organizationId: v.id('organizations'),
    email: v.string(),
    name: v.string(),
    profileId: v.optional(v.id('profiles')),
    isAdmin: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('appUsers', {
      betterAuthUserId: args.betterAuthUserId,
      organizationId: args.organizationId,
      email: args.email,
      name: args.name,
      profileId: args.profileId,
      isAdmin: args.isAdmin ?? false,
      createdAt: Date.now(),
    })
  },
})

export const update = mutation({
  args: {
    id: v.id('appUsers'),
    profileId: v.optional(v.id('profiles')),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    isAdmin: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, val]) => val !== undefined)
    ) as Record<string, unknown>
    if (Object.keys(filtered).length === 0) return id
    await ctx.db.patch(id, filtered)
    return id
  },
})

export const remove = mutation({
  args: { id: v.id('appUsers') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id)
  },
})

export const completeOnboarding = mutation({
  args: {
    organizationId: v.id('organizations'),
    profileId: v.id('profiles'),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx)
    if (!user) {
      throw new Error('Unauthorized')
    }

    const defaultOrganization = await ctx.db
      .query('organizations')
      .withIndex('by_slug', (q) => q.eq('slug', 'default'))
      .unique()

    if (!defaultOrganization) {
      throw new Error('Default organization not configured')
    }

    const existingAppUser = await ctx.db
      .query('appUsers')
      .withIndex('by_better_auth_user', (q) => q.eq('betterAuthUserId', user._id))
      .unique()

    if (!user.email) {
      throw new Error('Authenticated user is missing email')
    }

    const appUserId =
      existingAppUser?._id ??
      (await ctx.db.insert('appUsers', {
        betterAuthUserId: user._id,
        organizationId: defaultOrganization._id,
        email: user.email,
        name: user.name ?? user.email,
        isAdmin: false,
        createdAt: Date.now(),
      }))

    const appUser = existingAppUser ?? (await ctx.db.get(appUserId))
    if (!appUser) {
      throw new Error('App user not found')
    }

    const profile = await ctx.db.get(args.profileId)
    if (!profile || profile.organizationId !== args.organizationId) {
      throw new Error('Profile not found for organization')
    }

    if (profile.claimedByUserId && profile.claimedByUserId !== user._id) {
      throw new Error('Profile already claimed')
    }

    const isAlreadyLinked =
      appUser.organizationId === args.organizationId && appUser.profileId === args.profileId
    if (isAlreadyLinked) {
      if (!profile.claimedByUserId) {
        await ctx.db.patch(profile._id, { claimedByUserId: user._id })
      }
      return appUser._id
    }

    const isUnfinishedUser =
      appUser.organizationId === defaultOrganization._id && appUser.profileId === undefined

    if (!isUnfinishedUser) {
      throw new Error('Onboarding already completed')
    }

    await ctx.db.patch(appUser._id, {
      organizationId: args.organizationId,
      profileId: args.profileId,
      email: profile.email ?? appUser.email,
      name: profile.name,
    })

    if (!profile.claimedByUserId) {
      await ctx.db.patch(profile._id, { claimedByUserId: user._id })
    }

    return appUser._id
  },
})
