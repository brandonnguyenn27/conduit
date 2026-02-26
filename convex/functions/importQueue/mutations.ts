import { api } from '../../_generated/api'
import { internalMutation, mutation } from '../../_generated/server'
import { v } from 'convex/values'
import {
  PIPELINE_BATCH_SIZE,
  PIPELINE_INITIAL_RUN_AFTER_MS,
  PIPELINE_NEXT_RUN_AFTER_MS,
} from '../../lib/importPipelineConfig'
import { MAX_CREATE_MANY, statusValidator, TEST_URL_PREFIX } from './helpers'

/** Schedules the next pipeline run (used by the action when a full batch was processed so more may be pending). */
export const scheduleNextPipelineRun = mutation({
  args: {
    limit: v.number(),
    delayMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const delayMs = args.delayMs ?? PIPELINE_NEXT_RUN_AFTER_MS
    await ctx.scheduler.runAfter(delayMs, api.importPipeline.processImportQueue, {
      limit: args.limit,
    })
  },
})

export const create = mutation({
  args: {
    organizationId: v.id('organizations'),
    linkedInUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert('importQueue', {
      organizationId: args.organizationId,
      linkedInUrl: args.linkedInUrl,
      status: 'pending',
      createdAt: Date.now(),
    })
    await ctx.scheduler.runAfter(PIPELINE_INITIAL_RUN_AFTER_MS, api.importPipeline.processImportQueue, {
      limit: PIPELINE_BATCH_SIZE,
    })
    return id
  },
})

export const createMany = mutation({
  args: {
    organizationId: v.id('organizations'),
    linkedInUrls: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.linkedInUrls.length > MAX_CREATE_MANY) {
      throw new Error(
        `linkedInUrls length ${args.linkedInUrls.length} exceeds max ${MAX_CREATE_MANY}. Call createMany in chunks.`
      )
    }
    const now = Date.now()
    const ids = await Promise.all(
      args.linkedInUrls.map((linkedInUrl) =>
        ctx.db.insert('importQueue', {
          organizationId: args.organizationId,
          linkedInUrl,
          status: 'pending',
          createdAt: now,
        })
      )
    )
    await ctx.scheduler.runAfter(PIPELINE_INITIAL_RUN_AFTER_MS, api.importPipeline.processImportQueue, {
      limit: PIPELINE_BATCH_SIZE,
    })
    return ids
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

/** Delete finished (done/failed) rows older than retentionDays. Only finished records are removed; pending/processing are kept. Call from cron or manually. */
export const pruneFinishedOlderThan = mutation({
  args: { retentionDays: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const days = args.retentionDays ?? 7
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
    const done = await ctx.db
      .query('importQueue')
      .withIndex('by_status', (q) => q.eq('status', 'done'))
      .collect()
    const failed = await ctx.db
      .query('importQueue')
      .withIndex('by_status', (q) => q.eq('status', 'failed'))
      .collect()
    let deleted = 0
    for (const row of [...done, ...failed]) {
      if (row.createdAt < cutoff) {
        await ctx.db.delete(row._id)
        deleted++
      }
    }
    return deleted
  },
})

/** Reset rows stuck in "processing" (e.g. after action crashed) back to "pending" so they can be retried. */
export const resetStuckProcessing = mutation({
  args: { organizationId: v.optional(v.id('organizations')) },
  handler: async (ctx, args) => {
    const all = await ctx.db.query('importQueue').collect()
    const stuck = args.organizationId
      ? all.filter((r) => r.status === 'processing' && r.organizationId === args.organizationId)
      : all.filter((r) => r.status === 'processing')
    for (const row of stuck) {
      await ctx.db.patch(row._id, { status: 'pending', errorMessage: undefined })
    }
    return stuck.length
  },
})

/** Inserts test queue rows for e2e when PIPELINE_TEST_MODE=true. No API keys needed. */
export const seedTestQueue = mutation({
  args: {
    organizationId: v.id('organizations'),
    count: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const count = Math.min(args.count ?? 3, 10)
    const now = Date.now()
    const ids = []
    for (let i = 1; i <= count; i++) {
      const id = await ctx.db.insert('importQueue', {
        organizationId: args.organizationId,
        linkedInUrl: `${TEST_URL_PREFIX}${i}`,
        status: 'pending',
        createdAt: now,
      })
      ids.push(id)
    }
    await ctx.scheduler.runAfter(PIPELINE_INITIAL_RUN_AFTER_MS, api.importPipeline.processImportQueue, {
      limit: PIPELINE_BATCH_SIZE,
    })
    return ids
  },
})

export const claimNextBatch = internalMutation({
  args: { limit: v.number() },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query('importQueue')
      .withIndex('by_status', (q) => q.eq('status', 'pending'))
      .take(args.limit)
    const out: { id: typeof items[0]['_id']; organizationId: typeof items[0]['organizationId']; linkedInUrl: string }[] = []
    for (const item of items) {
      await ctx.db.patch(item._id, { status: 'processing' })
      out.push({ id: item._id, organizationId: item.organizationId, linkedInUrl: item.linkedInUrl })
    }
    return out
  },
})
