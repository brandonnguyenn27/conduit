import { mutation } from '../../_generated/server'
import { v } from 'convex/values'

export const create = mutation({
  args: {
    betterAuthUserId: v.string(),
    organizationId: v.id('organizations'),
    email: v.string(),
    name: v.string(),
    profileId: v.optional(v.id('profiles')),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('appUsers', {
      betterAuthUserId: args.betterAuthUserId,
      organizationId: args.organizationId,
      email: args.email,
      name: args.name,
      profileId: args.profileId,
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
