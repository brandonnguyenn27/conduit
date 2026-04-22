import { api } from '../../_generated/api'
import { internalMutation, mutation, type MutationCtx } from '../../_generated/server'
import { v } from 'convex/values'
import {
  PIPELINE_BATCH_SIZE,
  PIPELINE_INITIAL_RUN_AFTER_MS,
  PIPELINE_NEXT_RUN_AFTER_MS,
} from '../../lib/importPipelineConfig'
import { MAX_CREATE_MANY, statusValidator, TEST_URL_PREFIX } from './helpers'
import { authComponent } from '../../auth'

function normalizeOptionalEmail(email?: string): string | undefined {
  const trimmed = email?.trim()
  if (!trimmed) return undefined
  return trimmed.toLowerCase()
}

const LINKEDIN_PROFILE_URL_PATTERN = /^https?:\/\/(www\.)?linkedin\.com\/in\/[^/?#]+\/?$/i

function normalizeLinkedInProfileUrl(url: string): string | null {
  const trimmed = url.trim()
  if (!trimmed || !LINKEDIN_PROFILE_URL_PATTERN.test(trimmed)) {
    return null
  }

  const parsed = new URL(trimmed)
  const [, slug] = parsed.pathname.split('/').filter(Boolean)
  if (!slug) {
    return null
  }

  return `https://www.linkedin.com/in/${slug}`
}

async function requireAdminAppUser(ctx: MutationCtx) {
  const user = await authComponent.safeGetAuthUser(ctx)
  if (!user) {
    throw new Error('Unauthorized')
  }

  const appUser = await ctx.db
    .query('appUsers')
    .withIndex('by_better_auth_user', (q) => q.eq('betterAuthUserId', user._id))
    .unique()
  if (!appUser || appUser.isAdmin !== true) {
    throw new Error('Forbidden')
  }

  return appUser
}

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

const profileTypeValidator = v.optional(v.union(v.literal('alumni'), v.literal('member')))

export const create = mutation({
  args: {
    organizationId: v.id('organizations'),
    linkedInUrl: v.string(),
    email: v.optional(v.string()),
    class: v.optional(v.string()),
    family: v.optional(v.string()),
    profileType: profileTypeValidator,
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert('importQueue', {
      organizationId: args.organizationId,
      linkedInUrl: args.linkedInUrl,
      email: normalizeOptionalEmail(args.email),
      class: args.class,
      family: args.family,
      profileType: args.profileType,
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
    linkedInUrls: v.optional(v.array(v.string())),
    rows: v.optional(
      v.array(
        v.object({
          linkedInUrl: v.string(),
          email: v.optional(v.string()),
          class: v.optional(v.string()),
          family: v.optional(v.string()),
          profileType: profileTypeValidator,
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const rows =
      args.rows ??
      (args.linkedInUrls?.map((linkedInUrl) => ({
        linkedInUrl,
        email: undefined,
        class: undefined,
        family: undefined,
        profileType: undefined,
      })) ??
        [])

    if (rows.length === 0) {
      throw new Error('Provide either linkedInUrls or rows with at least one item.')
    }

    if (rows.length > MAX_CREATE_MANY) {
      throw new Error(
        `rows length ${rows.length} exceeds max ${MAX_CREATE_MANY}. Call createMany in chunks.`
      )
    }
    const now = Date.now()
    const ids = await Promise.all(
      rows.map((row) =>
        ctx.db.insert('importQueue', {
          organizationId: args.organizationId,
          linkedInUrl: row.linkedInUrl,
          email: normalizeOptionalEmail(row.email),
          class: row.class,
          family: row.family,
          profileType: row.profileType,
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

export const createManyForCurrentOrg = mutation({
  args: {
    linkedInUrls: v.optional(v.array(v.string())),
    rows: v.optional(
      v.array(
        v.object({
          linkedInUrl: v.string(),
          email: v.optional(v.string()),
          class: v.optional(v.string()),
          family: v.optional(v.string()),
          profileType: profileTypeValidator,
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const appUser = await requireAdminAppUser(ctx)

    const rows =
      args.rows ??
      args.linkedInUrls?.map((linkedInUrl) => ({
        linkedInUrl,
        email: undefined,
        class: undefined,
        family: undefined,
        profileType: undefined,
      })) ??
      []

    if (rows.length === 0) {
      throw new Error('Provide rows or linkedInUrls with at least one item.')
    }

    if (rows.length > MAX_CREATE_MANY) {
      throw new Error(
        `rows length ${rows.length} exceeds max ${MAX_CREATE_MANY}. Submit in chunks.`
      )
    }

    const seen = new Set<string>()
    type NormalizedRow = {
      linkedInUrl: string
      email?: string
      class?: string
      family?: string
      profileType?: 'alumni' | 'member'
    }
    const normalizedRows: NormalizedRow[] = []
    const invalidUrls: string[] = []
    let skippedDuplicates = 0

    for (const row of rows) {
      const normalized = normalizeLinkedInProfileUrl(row.linkedInUrl)
      if (!normalized) {
        invalidUrls.push(row.linkedInUrl)
        continue
      }

      const dedupeKey = normalized.toLowerCase()
      if (seen.has(dedupeKey)) {
        skippedDuplicates += 1
        continue
      }
      seen.add(dedupeKey)
      normalizedRows.push({
        linkedInUrl: normalized,
        email: row.email,
        class: row.class,
        family: row.family,
        profileType: row.profileType,
      })
    }

    const now = Date.now()
    const ids = await Promise.all(
      normalizedRows.map((r) =>
        ctx.db.insert('importQueue', {
          organizationId: appUser.organizationId,
          linkedInUrl: r.linkedInUrl,
          email: normalizeOptionalEmail(r.email),
          class: r.class,
          family: r.family,
          profileType: r.profileType,
          status: 'pending',
          createdAt: now,
        })
      )
    )

    if (ids.length > 0) {
      await ctx.scheduler.runAfter(PIPELINE_INITIAL_RUN_AFTER_MS, api.importPipeline.processImportQueue, {
        limit: PIPELINE_BATCH_SIZE,
      })
    }

    return {
      createdCount: ids.length,
      skippedInvalid: invalidUrls.length,
      skippedDuplicates,
      invalidUrls: invalidUrls.slice(0, 25),
    }
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
    const BATCH = 200
    let deleted = 0

    async function pruneStatus(status: 'done' | 'failed') {
      while (true) {
        const batch = await ctx.db
          .query('importQueue')
          .withIndex('by_status_createdAt', (q) =>
            q.eq('status', status).lt('createdAt', cutoff)
          )
          .take(BATCH)
        if (batch.length === 0) return
        for (const row of batch) {
          await ctx.db.delete(row._id)
          deleted += 1
        }
      }
    }

    await pruneStatus('done')
    await pruneStatus('failed')
    return deleted
  },
})

/** Reset rows stuck in "processing" (e.g. after action crashed) back to "pending" so they can be retried. */
export const resetStuckProcessing = mutation({
  args: { organizationId: v.optional(v.id('organizations')) },
  handler: async (ctx, args) => {
    const BATCH = 200
    let updated = 0

    while (true) {
      const batch = args.organizationId
        ? await ctx.db
            .query('importQueue')
            .withIndex('by_status_organizationId', (q) =>
              q
                .eq('status', 'processing')
                .eq('organizationId', args.organizationId!)
            )
            .take(BATCH)
        : await ctx.db
            .query('importQueue')
            .withIndex('by_status', (q) => q.eq('status', 'processing'))
            .take(BATCH)

      if (batch.length === 0) break
      for (const row of batch) {
        await ctx.db.patch(row._id, { status: 'pending', errorMessage: undefined })
        updated += 1
      }
    }

    return updated
  },
})

/** Retry failed rows by resetting status to "pending" and scheduling the import pipeline. */
export const retryFailed = mutation({
  args: { organizationId: v.optional(v.id('organizations')) },
  handler: async (ctx, args) => {
    const BATCH = 200
    let updated = 0

    while (true) {
      const batch = args.organizationId
        ? await ctx.db
            .query('importQueue')
            .withIndex('by_status_organizationId', (q) =>
              q.eq('status', 'failed').eq('organizationId', args.organizationId!)
            )
            .take(BATCH)
        : await ctx.db
            .query('importQueue')
            .withIndex('by_status', (q) => q.eq('status', 'failed'))
            .take(BATCH)

      if (batch.length === 0) break
      for (const row of batch) {
        await ctx.db.patch(row._id, { status: 'pending', errorMessage: undefined })
        updated += 1
      }
    }

    if (updated > 0) {
      await ctx.scheduler.runAfter(PIPELINE_INITIAL_RUN_AFTER_MS, api.importPipeline.processImportQueue, {
        limit: PIPELINE_BATCH_SIZE,
      })
    }

    return updated
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
    const out: {
      id: (typeof items)[0]['_id']
      organizationId: (typeof items)[0]['organizationId']
      linkedInUrl: string
      email?: string
      class?: string
      family?: string
      profileType?: 'alumni' | 'member'
    }[] = []
    for (const item of items) {
      await ctx.db.patch(item._id, { status: 'processing' })
      out.push({
        id: item._id,
        organizationId: item.organizationId,
        linkedInUrl: item.linkedInUrl,
        email: item.email,
        class: item.class,
        family: item.family,
        profileType: item.profileType,
      })
    }
    return out
  },
})
