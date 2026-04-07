'use node'

import type { Id } from './_generated/dataModel'
import { action } from './_generated/server'
import { api, internal } from './_generated/api'
import { v } from 'convex/values'
import { mapToProfile } from './lib/linkedin/mapToProfile'
import { getLinkedInProvider } from './lib/linkedin/provider'
import type { RawLinkedInProfile } from './lib/linkedin/types'
import { normalizeSearchArrays } from './lib/linkedin/normalize'
import {
  canonicalizeJobTitleTokens,
  canonicalizeMajorTokens,
} from './lib/linkedin/canonicalizeFacets'
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

function normalizeOptionalHeaderField(value?: string): string | undefined {
  const trimmed = value?.trim()
  return trimmed || undefined
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

    const markFailed = async (item: ClaimedItem, errorMessage: string): Promise<void> => {
      await ctx.runMutation(api.functions.importQueue.mutations.updateStatus, {
        id: item.id,
        status: 'failed',
        errorMessage,
      })
      failed++
    }

    const processImportedProfile = async (
      item: ClaimedItem,
      raw: RawLinkedInProfile
    ): Promise<void> => {
      try {
        const profile = mapToProfile(raw, item.organizationId)
        const email = normalizeEmail(item.email)
        const importClass = normalizeOptionalHeaderField(item.class)
        const importFamily = normalizeOptionalHeaderField(item.family)
        const profileForImport = {
          ...profile,
          ...(email ? { email } : {}),
          ...(importClass ? { class: importClass } : {}),
          ...(importFamily ? { family: importFamily } : {}),
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
        profileForImport.majors = canonicalizeMajorTokens(profileForImport.majors)
        profileForImport.jobTitles = canonicalizeJobTitleTokens(profileForImport.jobTitles)
        profileForImport.suggestSearchText = toSuggestSearchText({
          name: profileForImport.name,
          headline: profileForImport.headline,
          summary: profileForImport.summary,
          skills: profileForImport.skills,
          majors: profileForImport.majors,
          schools: profileForImport.schools,
          companies: profileForImport.companies,
          jobTitles: profileForImport.jobTitles,
          class: profileForImport.class,
          family: profileForImport.family,
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
        await markFailed(item, message)
      }
    }

    if (provider.fetchFullProfilesByUrls) {
      const validItems: Array<{ item: ClaimedItem; linkedInUrl: string }> = []
      for (const item of batch) {
        const linkedInUrl = item.linkedInUrl.trim()
        if (!usernameFromUrl(linkedInUrl)) {
          await markFailed(item, 'Invalid LinkedIn URL')
          continue
        }
        validItems.push({ item, linkedInUrl })
      }

      if (validItems.length > 0) {
        let rawByLinkedInUrl: Map<string, RawLinkedInProfile> | null = null
        try {
          rawByLinkedInUrl = await provider.fetchFullProfilesByUrls(
            validItems.map((entry) => entry.linkedInUrl)
          )
        } catch (e) {
          const message = e instanceof Error ? e.message : String(e)
          for (const entry of validItems) {
            await markFailed(entry.item, message)
          }
        }

        if (rawByLinkedInUrl) {
          for (const entry of validItems) {
            const raw = rawByLinkedInUrl.get(entry.linkedInUrl)
            if (!raw) {
              await markFailed(
                entry.item,
                `Profile not returned by provider for LinkedIn URL: ${entry.linkedInUrl}`
              )
              continue
            }
            await processImportedProfile(entry.item, raw)
          }
        }
      }
    } else {
      for (const item of batch) {
        const username = usernameFromUrl(item.linkedInUrl)
        if (!username) {
          await markFailed(item, 'Invalid LinkedIn URL')
          continue
        }
        try {
          const raw = await provider.fetchFullProfile(username)
          await processImportedProfile(item, raw)
        } catch (e) {
          const message = e instanceof Error ? e.message : String(e)
          await markFailed(item, message)
        }
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
