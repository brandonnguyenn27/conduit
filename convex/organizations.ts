import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('organizations').collect()
  },
})

export const get = query({
  args: { id: v.id('organizations') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id)
  },
})

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('organizations')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .unique()
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    logoUrl: v.optional(v.string()),
    adminEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('organizations', {
      name: args.name,
      slug: args.slug,
      logoUrl: args.logoUrl,
      adminEmail: args.adminEmail,
      createdAt: Date.now(),
    })
  },
})

export const update = mutation({
  args: {
    id: v.id('organizations'),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    adminEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    ) as Record<string, unknown>
    if (Object.keys(filtered).length === 0) return id
    await ctx.db.patch(id, filtered)
    return id
  },
})

export const remove = mutation({
  args: { id: v.id('organizations') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id)
  },
})
