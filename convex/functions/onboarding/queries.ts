import { internalQuery, query } from '../../_generated/server'
import type { Doc } from '../../_generated/dataModel'
import { v } from 'convex/values'
import { authComponent } from '../../auth'

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export const getOrganizationJoinConfig = internalQuery({
  args: { organizationId: v.id('organizations') },
  handler: async (ctx, args) => {
    const organization = await ctx.db.get(args.organizationId)
    if (!organization) return null
    return {
      _id: organization._id,
      joinPasswordHash: organization.joinPasswordHash,
    }
  },
})

export const getOnboardingToken = internalQuery({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('onboardingTokens')
      .withIndex('by_token', (q) => q.eq('token', args.token))
      .unique()
  },
})

export const getProfileByEmailInOrganization = internalQuery({
  args: {
    organizationId: v.id('organizations'),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedEmail = normalizeEmail(args.email)
    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_organization_email', (q) =>
        q.eq('organizationId', args.organizationId).eq('email', normalizedEmail)
      )
      .unique()

    if (!profile) return null
    return {
      _id: profile._id,
      organizationId: profile.organizationId,
      email: profile.email,
      name: profile.name,
    }
  },
})

export const getProfileInOrganization = internalQuery({
  args: {
    profileId: v.id('profiles'),
    organizationId: v.id('organizations'),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId)
    if (!profile || profile.organizationId !== args.organizationId) {
      return null
    }

    return {
      _id: profile._id,
      organizationId: profile.organizationId,
      email: profile.email,
      name: profile.name,
    }
  },
})

type ProfilePreview = {
  _id: Doc<'profiles'>['_id']
  name: string
  education: Doc<'profiles'>['education']
  currentCompany?: string
  currentTitle?: string
}

export const getProfilePreview = query({
  args: {
    joinToken: v.string(),
    profileId: v.id('profiles'),
  },
  handler: async (ctx, args): Promise<ProfilePreview | null> => {
    const token = await ctx.db
      .query('onboardingTokens')
      .withIndex('by_token', (q) => q.eq('token', args.joinToken))
      .unique()

    if (!token || token.expiresAt <= Date.now()) {
      return null
    }

    const profile = await ctx.db.get(args.profileId)
    if (!profile || profile.organizationId !== token.organizationId) {
      return null
    }

    return {
      _id: profile._id,
      name: profile.name,
      education: profile.education,
      currentCompany: profile.currentCompany,
      currentTitle: profile.experience[0]?.title,
    }
  },
})

export const listPublicOrganizations = query({
  args: {},
  handler: async (ctx) => {
    const organizations = await ctx.db.query('organizations').collect()
    return organizations.map((organization) => ({
      _id: organization._id,
      name: organization.name,
      slug: organization.slug,
      logoUrl: organization.logoUrl,
    }))
  },
})

/** True when this user already owns / is fully linked to this org profile (skip claim steps). */
export const isReturningMemberForOnboardingProfile = query({
  args: {
    organizationId: v.id('organizations'),
    profileId: v.id('profiles'),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx)
    if (!user) {
      return false
    }

    const profile = await ctx.db.get(args.profileId)
    if (!profile || profile.organizationId !== args.organizationId) {
      return false
    }

    if (profile.claimedByUserId === user._id) {
      return true
    }

    const appUser = await ctx.db
      .query('appUsers')
      .withIndex('by_better_auth_user', (q) => q.eq('betterAuthUserId', user._id))
      .unique()

    if (!appUser) {
      return false
    }
    if (appUser.organizationId !== args.organizationId) {
      return false
    }
    if (appUser.profileId !== args.profileId) {
      return false
    }

    const defaultOrganization = await ctx.db
      .query('organizations')
      .withIndex('by_slug', (q) => q.eq('slug', 'default'))
      .unique()

    const hasProfile = !!appUser.profileId
    const isOnboarded = defaultOrganization
      ? hasProfile && appUser.organizationId !== defaultOrganization._id
      : hasProfile

    return isOnboarded
  },
})
