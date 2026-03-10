'use node'

import type { Id } from './_generated/dataModel'
import { action } from './_generated/server'
import { api, internal } from './_generated/api'
import { v } from 'convex/values'
import { getLinkedInProvider, mapToProfile } from './lib/linkedin'
import { normalizeSearchArrays } from './lib/linkedin/normalize'
import { buildProfileSearchText } from './lib/search/profileSearchText'
import {
  toCompaniesSearchSlugFromExperience,
  toCompaniesSearchTextFromExperience,
  toCurrentCompanySlugFromExperience,
  toEducationSearchSlug,
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
    const orgIdsTouched = new Set<Id<'organizations'>>()
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
        profileForImport.searchText = buildProfileSearchText({
          name: profileForImport.name,
          headline: profileForImport.headline,
          summary: profileForImport.summary,
          location: profileForImport.location,
          industry: profileForImport.industry,
          skills: profileForImport.skills,
          majors: profileForImport.majors,
          schools: profileForImport.schools,
          companies: profileForImport.companies,
          jobTitles: profileForImport.jobTitles,
        })
        profileForImport.companiesSearchText =
          toCompaniesSearchTextFromExperience(profileForImport.experience)
        profileForImport.companiesSearchSlug =
          toCompaniesSearchSlugFromExperience(profileForImport.experience)
        profileForImport.currentCompanySlug =
          toCurrentCompanySlugFromExperience(profileForImport.experience)
        profileForImport.educationSearchSlug = toEducationSearchSlug(
          profileForImport.schools,
          profileForImport.majors
        )
        await ctx.runMutation(api.functions.profiles.mutations.upsertFromImport, {
          organizationId: item.organizationId,
          linkedInUrl: item.linkedInUrl,
          profile: profileForImport,
        })
        await ctx.runMutation(api.functions.importQueue.mutations.updateStatus, {
          id: item.id,
          status: 'done',
        })
        orgIdsTouched.add(item.organizationId)
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
    // TODO: figure out how to handle this in a more efficient way. Batches are a max size of 7 
    for (const orgId of orgIdsTouched) {
      await ctx.runMutation(api.functions.chatQuery.mutations.rebuildOrganizationFacets, {
        organizationId: orgId,
      })
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
