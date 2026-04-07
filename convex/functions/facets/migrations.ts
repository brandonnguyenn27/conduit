import { internal } from '../../_generated/api'
import { type Id } from '../../_generated/dataModel'
import { internalMutation, query } from '../../_generated/server'
import { v } from 'convex/values'
import { type FacetKey, ALL_FACET_KEYS, canonicalizeKey, extractFacetTokens } from './helpers'

const DEFAULT_BATCH_SIZE = 25
const MAX_BATCH_SIZE = 50

function clampBatchSize(value?: number): number {
  return Math.max(1, Math.min(Math.floor(value ?? DEFAULT_BATCH_SIZE), MAX_BATCH_SIZE))
}

async function createBackfillJob(
  ctx: {
    db: {
      insert: (...args: any[]) => Promise<Id<'facetBackfillJobs'>>
    }
    scheduler: { runAfter: (delayMs: number, funcRef: any, args: any) => Promise<unknown> }
  },
  args: { organizationId: Id<'organizations'>; clearExisting?: boolean; batchSize?: number }
) {
  const now = Date.now()
  const jobId = await ctx.db.insert('facetBackfillJobs', {
    organizationId: args.organizationId,
    clearExisting: !!args.clearExisting,
    phase: args.clearExisting ? 'clearing' : 'counting',
    batchSize: clampBatchSize(args.batchSize),
    processedProfiles: 0,
    deleted: 0,
    inserted: 0,
    updated: 0,
    done: false,
    createdAt: now,
    updatedAt: now,
  })
  await ctx.scheduler.runAfter(0, internal.functions.facets.migrations.continueFacetBackfill, {
    jobId,
  })
  return { jobId, status: 'scheduled' as const }
}

/**
 * Starts a batched facet backfill job.
 * Use `getFacetBackfillJob` to monitor progress.
 */
export const startFacetBackfill = internalMutation({
  args: {
    organizationId: v.id('organizations'),
    clearExisting: v.optional(v.boolean()),
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await createBackfillJob(ctx, args)
  },
})

/**
 * Backward-compatible entrypoint. Starts async job and returns job id.
 */
export const backfillFacetValues = internalMutation({
  args: {
    organizationId: v.id('organizations'),
    clearExisting: v.optional(v.boolean()),
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await createBackfillJob(ctx, args)
  },
})

export const continueFacetBackfill = internalMutation({
  args: {
    jobId: v.id('facetBackfillJobs'),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId)
    if (!job) {
      throw new Error('Facet backfill job not found')
    }
    if (job.done || job.phase === 'done') {
      return { done: true, phase: 'done' as const }
    }

    const batchSize = clampBatchSize(job.batchSize)
    const now = Date.now()

    if (job.phase === 'clearing') {
      const page = await ctx.db
        .query('organizationFacetValues')
        .withIndex('by_org_facet_display', (q: any) =>
          q.eq('organizationId', job.organizationId)
        )
        .paginate({ cursor: job.clearCursor ?? null, numItems: batchSize })

      for (const row of page.page) {
        await ctx.db.delete(row._id)
      }

      await ctx.db.patch(args.jobId, {
        deleted: job.deleted + page.page.length,
        clearCursor: page.isDone ? undefined : page.continueCursor,
        phase: page.isDone ? 'counting' : 'clearing',
        updatedAt: now,
      })
      await ctx.scheduler.runAfter(0, internal.functions.facets.migrations.continueFacetBackfill, {
        jobId: args.jobId,
      })
      return {
        done: false,
        phase: page.isDone ? 'counting' : 'clearing',
        deletedInBatch: page.page.length,
      }
    }

    const profilePage = await ctx.db
      .query('profiles')
      .withIndex('by_organization_linkedin', (q: any) =>
        q.eq('organizationId', job.organizationId)
      )
      .paginate({ cursor: job.profileCursor ?? null, numItems: batchSize })

    const counts = new Map<string, { facet: FacetKey; displayValue: string; count: number }>()
    for (const profile of profilePage.page) {
      const tokens = extractFacetTokens(profile)
      for (const facet of ALL_FACET_KEYS) {
        for (const value of tokens[facet]) {
          const compositeKey = `${facet}::${canonicalizeKey(value)}`
          const existing = counts.get(compositeKey)
          if (existing) {
            existing.count += 1
          } else {
            counts.set(compositeKey, {
              facet,
              displayValue: value.trim(),
              count: 1,
            })
          }
        }
      }
    }

    let inserted = 0
    let updated = 0
    for (const [, entry] of counts) {
      const valueKey = canonicalizeKey(entry.displayValue)
      if (!valueKey) continue
      const existing = await ctx.db
        .query('organizationFacetValues')
        .withIndex('by_org_facet_valueKey', (q: any) =>
          q
            .eq('organizationId', job.organizationId)
            .eq('facet', entry.facet)
            .eq('valueKey', valueKey)
        )
        .unique()
      if (existing) {
        await ctx.db.patch(existing._id, {
          count: existing.count + entry.count,
          updatedAt: now,
        })
        updated++
      } else {
        await ctx.db.insert('organizationFacetValues', {
          organizationId: job.organizationId,
          facet: entry.facet,
          valueKey,
          displayValue: entry.displayValue,
          count: entry.count,
          updatedAt: now,
        })
        inserted++
      }
    }

    const done = profilePage.isDone
    await ctx.db.patch(args.jobId, {
      profileCursor: done ? undefined : profilePage.continueCursor,
      processedProfiles: job.processedProfiles + profilePage.page.length,
      inserted: job.inserted + inserted,
      updated: job.updated + updated,
      phase: done ? 'done' : 'counting',
      done,
      updatedAt: now,
    })

    if (!done) {
      await ctx.scheduler.runAfter(0, internal.functions.facets.migrations.continueFacetBackfill, {
        jobId: args.jobId,
      })
    }

    return {
      done,
      phase: done ? 'done' : 'counting',
      profilesInBatch: profilePage.page.length,
      insertedInBatch: inserted,
      updatedInBatch: updated,
    }
  },
})

export const getFacetBackfillJob = query({
  args: {
    jobId: v.id('facetBackfillJobs'),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId)
    if (!job) return null
    return {
      _id: job._id,
      organizationId: job.organizationId,
      clearExisting: job.clearExisting,
      phase: job.phase,
      batchSize: job.batchSize,
      processedProfiles: job.processedProfiles,
      deleted: job.deleted,
      inserted: job.inserted,
      updated: job.updated,
      done: job.done,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      error: job.error,
    }
  },
})
