'use node'

import type { LinkedInProfileProvider } from './types'
import { createApifyProvider } from './apify'
import { fetchLinkdAPIFullProfile } from './linkdapi'
import { createMockProvider } from './mockProvider'

/**
 * Returns the active LinkedIn profile provider. Set LINKEDIN_PROVIDER (default: "linkdapi")
 * to "linkdapi" or "apify", and provide the corresponding API key in Convex env.
 * When PIPELINE_TEST_MODE=true, returns a mock provider (no API calls).
 */
export function getLinkedInProvider(): LinkedInProfileProvider {
  if (process.env.PIPELINE_TEST_MODE === 'true') {
    return createMockProvider()
  }
  const provider = process.env.LINKEDIN_PROVIDER ?? 'linkdapi'
  if (provider === 'apify') {
    const apiKey = process.env.APIFY_API_KEY
    if (!apiKey) throw new Error('APIFY_API_KEY is not set')
    const actorId = process.env.APIFY_LINKEDIN_ACTOR_ID
    const maxQueriesPerRunRaw = process.env.APIFY_MAX_QUERIES_PER_RUN
    const parsedMaxQueriesPerRun = maxQueriesPerRunRaw ? Number(maxQueriesPerRunRaw) : undefined
    const maxQueriesPerRun =
      parsedMaxQueriesPerRun && Number.isFinite(parsedMaxQueriesPerRun)
        ? Math.max(1, Math.floor(parsedMaxQueriesPerRun))
        : undefined
    return createApifyProvider({
      apiKey,
      ...(actorId ? { actorId } : {}),
      ...(maxQueriesPerRun ? { maxQueriesPerRun } : {}),
    })
  }
  if (provider === 'linkdapi') {
    const apiKey = process.env.LINKDAPI_API_KEY
    if (!apiKey) throw new Error('LINKDAPI_API_KEY is not set')
    return {
      fetchFullProfile: (username) => fetchLinkdAPIFullProfile(username, apiKey),
    }
  }
  throw new Error(
    `Unknown LINKEDIN_PROVIDER: ${provider}. Add an adapter in convex/lib/linkedin/ and branch here.`
  )
}
