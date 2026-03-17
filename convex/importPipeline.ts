'use node'

import type { Id } from './_generated/dataModel'
import { action } from './_generated/server'
import { api, internal } from './_generated/api'
import { v } from 'convex/values'
import { getLinkedInProvider, mapToProfile } from './lib/linkedin'
import { normalizeSearchArrays } from './lib/linkedin/normalize'
import {
  toCompaniesSearchSlugFromExperience,
  toCurrentCompanySlugFromExperience,
  toCurrentJobTitlesSearchSlugFromExperience,
  toEducationSearchSlug,
  toJobTitlesSearchSlug,
  toPastJobTitlesSearchSlugFromExperience,
  toSuggestSearchText,
} from './functions/profiles/helpers'
import { PIPELINE_BATCH_SIZE, PIPELINE_NEXT_RUN_AFTER_MS } from './lib/importPipelineConfig'

const LINKEDIN_IN_REGEX = /linkedin\.com\/in\/([^/?]+)/i

function usernameFromUrl(linkedInUrl: string): string | null {
  const m = linkedInUrl.match(LINKEDIN_IN_REGEX)
  return m ? m[1].trim() : null
}

function normalizeEmail(email?: string): string | undefined {
  const trimmed = email?.trim()
  if (!trimmed) return undefined
  return trimmed.toLowerCase()
}

type ClaimedItem = {
  id: Id<'importQueue'>
  organizationId: Id<'organizations'>
  linkedInUrl: string
  email?: string
  class?: string
  family?: string
  profileType?: 'alumni' | 'member'
}

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
        const email = normalizeEmail(item.email)
        const profileForImport = {
          ...profile,
          ...(email ? { email } : {}),
          ...(item.class ? { class: item.class } : {}),
          ...(item.family ? { family: item.family } : {}),
          ...(item.profileType ? { profileType: item.profileType } : {}),
        }
        const normalized = await normalizeSearchArrays({
          education: profileForImport.education,
          experience: profileForImport.experience,
        })
        if (normalized) {
          profileForImport.majors = normalized.majors
          profileForImport.schools = normalized.schools
          profileForImport.companies = normalized.companies
          profileForImport.jobTitles = normalized.jobTitles
        }
        profileForImport.suggestSearchText = toSuggestSearchText({
          name: profileForImport.name,
          headline: profileForImport.headline,
          summary: profileForImport.summary,
          skills: profileForImport.skills,
          majors: profileForImport.majors,
          schools: profileForImport.schools,
          companies: profileForImport.companies,
          jobTitles: profileForImport.jobTitles,
        })
        profileForImport.companiesSearchSlug =
          toCompaniesSearchSlugFromExperience(profileForImport.experience)
        profileForImport.currentCompanySlug =
          toCurrentCompanySlugFromExperience(profileForImport.experience)
        profileForImport.educationSearchSlug = toEducationSearchSlug(
          profileForImport.schools,
          profileForImport.majors
        )
        profileForImport.jobTitlesSearchSlug = toJobTitlesSearchSlug(
          profileForImport.jobTitles
        )
        profileForImport.currentJobTitlesSearchSlug =
          toCurrentJobTitlesSearchSlugFromExperience(profileForImport.experience)
        profileForImport.pastJobTitlesSearchSlug =
          toPastJobTitlesSearchSlugFromExperience(profileForImport.experience)
        await ctx.runMutation(api.functions.profiles.mutations.upsertFromImport, {
          organizationId: item.organizationId,
          linkedInUrl: item.linkedInUrl,
          profile: profileForImport,
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
