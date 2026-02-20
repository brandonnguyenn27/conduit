'use node'

import type { Id } from './_generated/dataModel'
import { action } from './_generated/server'
import { api, internal } from './_generated/api'
import { v } from 'convex/values'
import { getLinkedInProvider, mapToProfile } from './lib/linkedin'
import { normalizeSearchArrays } from './lib/linkedin/normalize'

const LINKEDIN_IN_REGEX = /linkedin\.com\/in\/([^/?]+)/i

function usernameFromUrl(linkedInUrl: string): string | null {
  const m = linkedInUrl.match(LINKEDIN_IN_REGEX)
  return m ? m[1].trim() : null
}

type ClaimedItem = { id: Id<'importQueue'>; organizationId: Id<'organizations'>; linkedInUrl: string }

const DEFAULT_BATCH_SIZE = 10

export const processImportQueue = action({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args): Promise<{ processed: number; done?: number; failed?: number }> => {
    const limit = args.limit ?? DEFAULT_BATCH_SIZE
    const batch = await ctx.runMutation(internal.importQueue.claimNextBatch, {
      limit,
    }) as ClaimedItem[]
    if (batch.length === 0) return { processed: 0 }
    const provider = getLinkedInProvider()
    let done = 0
    let failed = 0
    for (const item of batch) {
      const username = usernameFromUrl(item.linkedInUrl)
      if (!username) {
        await ctx.runMutation(api.importQueue.updateStatus, {
          id: item.id,
          status: 'failed',
          errorMessage: 'Invalid LinkedIn URL',
        })
        failed++
        continue
      }
      try {
        const raw = await provider.fetchFullProfile(username)
        const profile = mapToProfile(raw, item.organizationId)
        const normalized = await normalizeSearchArrays({
          education: profile.education,
          experience: profile.experience,
        })
        if (normalized) {
          profile.majors = normalized.majors
          profile.schools = normalized.schools
          profile.companies = normalized.companies
          profile.jobTitles = normalized.jobTitles
        }
        await ctx.runMutation(api.profiles.upsertFromImport, {
          organizationId: item.organizationId,
          linkedInUrl: item.linkedInUrl,
          profile,
        })
        await ctx.runMutation(api.importQueue.updateStatus, {
          id: item.id,
          status: 'done',
        })
        done++
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e)
        await ctx.runMutation(api.importQueue.updateStatus, {
          id: item.id,
          status: 'failed',
          errorMessage: message,
        })
        failed++
      }
    }
    if (batch.length === limit) {
      await ctx.runMutation(api.importQueue.scheduleNextPipelineRun, { limit })
    }
    return { processed: batch.length, done, failed }
  },
})
