import { internalMutation } from '../../_generated/server'
import { v } from 'convex/values'

export const createToken = internalMutation({
  args: {
    token: v.string(),
    organizationId: v.id('organizations'),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('onboardingTokens', {
      token: args.token,
      organizationId: args.organizationId,
      expiresAt: args.expiresAt,
      createdAt: Date.now(),
    })
  },
})

export const createVerificationCode = internalMutation({
  args: {
    profileId: v.id('profiles'),
    code: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('claimCodes', {
      profileId: args.profileId,
      code: args.code,
      expiresAt: args.expiresAt,
    })
  },
})

export const markUnusedVerificationCodesUsed = internalMutation({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    const codes = await ctx.db
      .query('claimCodes')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect()

    const now = Date.now()
    await Promise.all(
      codes
        .filter((code) => !code.usedAt && code.expiresAt > now)
        .map((code) => ctx.db.patch(code._id, { usedAt: now }))
    )
  },
})

export const markVerificationCodeUsed = internalMutation({
  args: { id: v.id('claimCodes') },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { usedAt: Date.now() })
  },
})

