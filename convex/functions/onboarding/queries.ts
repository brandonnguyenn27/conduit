import { internalQuery, query } from '../../_generated/server'
import type { Doc } from '../../_generated/dataModel'
import { v } from 'convex/values'

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
