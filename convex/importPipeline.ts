'use node'

import type { Id } from './_generated/dataModel'
import { action } from './_generated/server'
import { api, internal } from './_generated/api'
import { v } from 'convex/values'
import { getLinkedInProvider, mapToProfile } from './lib/linkedin'
import { normalizeSearchArrays } from './lib/linkedin/normalize'
import { buildProfileSearchText } from './lib/search/profileSearchText'
import { PIPELINE_BATCH_SIZE, PIPELINE_NEXT_RUN_AFTER_MS } from './lib/importPipelineConfig'

const LINKEDIN_IN_REGEX = /linkedin\.com\/in\/([^/?]+)/i

function usernameFromUrl(linkedInUrl: string): string | null {
  const m = linkedInUrl.match(LINKEDIN_IN_REGEX)
  return m ? m[1].trim() : null
}

type ClaimedItem = { id: Id<'importQueue'>; organizationId: Id<'organizations'>; linkedInUrl: string }

export const processImportQueue = action({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args): Promise<{ processed: number; done?: number; failed?: number }> => {
    const requestedLimit = Math.floor(args.limit ?? PIPELINE_BATCH_SIZE)
    const limit = Math.max(1, Math.min(requestedLimit, PIPELINE_BATCH_SIZE))
    const batch = await ctx.runMutation(internal.functions.importQueue.mutations.claimNextBatch, {
      limit,
    }) as ClaimedItem[]
    if (batch.length === 0) return { processed: 0 }
    const provider = getLinkedInProvider()
    let done = 0
    let failed = 0
    for (const item of batch) {
      const username = usernameFromUrl(item.linkedInUrl)
      if (!username) {
        await ctx.runMutation(api.functions.importQueue.mutations.updateStatus, {
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
        profile.searchText = buildProfileSearchText({
          name: profile.name,
          headline: profile.headline,
          summary: profile.summary,
          location: profile.location,
          industry: profile.industry,
          skills: profile.skills,
          majors: profile.majors,
          schools: profile.schools,
          companies: profile.companies,
          jobTitles: profile.jobTitles,
        })
        await ctx.runMutation(api.functions.profiles.mutations.upsertFromImport, {
          organizationId: item.organizationId,
          linkedInUrl: item.linkedInUrl,
          profile,
        })
        await ctx.runMutation(api.functions.importQueue.mutations.updateStatus, {
          id: item.id,
          status: 'done',
        })
        done++
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e)
        await ctx.runMutation(api.functions.importQueue.mutations.updateStatus, {
          id: item.id,
          status: 'failed',
          errorMessage: message,
        })
        failed++
      }
    }
    if (batch.length === limit) {
      await ctx.runMutation(api.functions.importQueue.mutations.scheduleNextPipelineRun, {
        limit,
        delayMs: PIPELINE_NEXT_RUN_AFTER_MS,
      })
    }
    return { processed: batch.length, done, failed }
  },
})
