import { query } from '../../_generated/server'
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
