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

