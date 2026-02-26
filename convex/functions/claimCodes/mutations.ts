import { mutation } from '../../_generated/server'
import { v } from 'convex/values'

export const create = mutation({
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

export const markUsed = mutation({
  args: { id: v.id('claimCodes') },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { usedAt: Date.now() })
    return args.id
  },
})

export const remove = mutation({
  args: { id: v.id('claimCodes') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id)
  },
})
