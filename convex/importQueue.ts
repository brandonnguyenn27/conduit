import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

const statusValidator = v.union(
  v.literal('pending'),
  v.literal('processing'),
  v.literal('done'),
  v.literal('failed')
)

export const listPending = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50
    return await ctx.db
      .query('importQueue')
      .withIndex('by_status', (q) => q.eq('status', 'pending'))
      .take(limit)
  },
})

export const listByOrganization = query({
  args: { organizationId: v.id('organizations') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('importQueue')
      .withIndex('by_organization', (q) => q.eq('organizationId', args.organizationId))
      .collect()
  },
})

export const get = query({
  args: { id: v.id('importQueue') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id)
  },
})

export const create = mutation({
  args: {
    organizationId: v.id('organizations'),
    linkedInUrl: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('importQueue', {
      organizationId: args.organizationId,
      linkedInUrl: args.linkedInUrl,
      status: 'pending',
      createdAt: Date.now(),
    })
  },
})

export const createMany = mutation({
  args: {
    organizationId: v.id('organizations'),
    linkedInUrls: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    return await Promise.all(
      args.linkedInUrls.map((linkedInUrl) =>
        ctx.db.insert('importQueue', {
          organizationId: args.organizationId,
          linkedInUrl,
          status: 'pending',
          createdAt: now,
        })
      )
    )
  },
})

export const updateStatus = mutation({
  args: {
    id: v.id('importQueue'),
    status: statusValidator,
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, status, errorMessage } = args
    const patch: Record<string, unknown> = { status }
    if (errorMessage !== undefined) patch.errorMessage = errorMessage
    await ctx.db.patch(id, patch)
    return id
  },
})

export const remove = mutation({
  args: { id: v.id('importQueue') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id)
  },
})
