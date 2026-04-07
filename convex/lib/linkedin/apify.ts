'use node'

import type { LinkedInProfileProvider, RawLinkedInProfile } from './types'

const APIFY_BASE_URL = 'https://api.apify.com/v2'
const DEFAULT_ACTOR_ID = 'LpVuK3Zozwuipa5bp'
const DEFAULT_PROFILE_SCRAPER_MODE = 'Profile details no email ($4 per 1k)'
const DEFAULT_MAX_QUERIES_PER_RUN = 14
const DEFAULT_WAIT_FOR_FINISH_SECONDS = 300
const LINKEDIN_IN_REGEX = /linkedin\.com\/in\/([^/?]+)/i

interface CreateApifyProviderArgs {
  apiKey: string
  actorId?: string
  profileScraperMode?: string
  maxQueriesPerRun?: number
}

interface ApifyDate {
  year?: number
  month?: string | number
  monthNumber?: number
  text?: string
}

interface ApifySkill {
  name?: string
}

interface ApifyEducation {
  schoolName?: string
  fieldOfStudy?: string
  degree?: string
  startDate?: ApifyDate
  endDate?: ApifyDate
}

interface ApifyExperience {
  companyName?: string
  position?: string
  startDate?: ApifyDate
  endDate?: ApifyDate
  location?: string
  employmentType?: string
  companyLinkedinUrl?: string
}

interface ApifyProfilePicture {
  url?: string
}

interface ApifyLocation {
  linkedinText?: string
  parsed?: { text?: string }
}

interface ApifyProfileItem {
  publicIdentifier?: string
  linkedinUrl?: string
  firstName?: string
  lastName?: string
  headline?: string
  about?: string
  profilePicture?: ApifyProfilePicture
  photo?: string
  location?: ApifyLocation
  education?: ApifyEducation[]
  experience?: ApifyExperience[]
  skills?: ApifySkill[]
}

const MONTH_NUMBER_BY_NAME: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
}

function normalizeString(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed && trimmed.length > 0 ? trimmed : undefined
}

function usernameFromLinkedInUrl(linkedInUrl?: string): string | undefined {
  const normalizedUrl = normalizeString(linkedInUrl)
  if (!normalizedUrl) return undefined
  const m = normalizedUrl.match(LINKEDIN_IN_REGEX)
  return m?.[1]?.trim()
}

function linkedInUrlFromUsername(username: string): string {
  return `https://www.linkedin.com/in/${username}`
}

function toMonthNumber(month: string | number | undefined): number | undefined {
  if (typeof month === 'number') {
    return month >= 1 && month <= 12 ? month : undefined
  }
  const normalized = normalizeString(month?.toLowerCase())
  if (!normalized) return undefined
  const numeric = Number(normalized)
  if (Number.isInteger(numeric) && numeric >= 1 && numeric <= 12) {
    return numeric
  }
  return MONTH_NUMBER_BY_NAME[normalized]
}

function toDatePart(date: ApifyDate | undefined): { year: number; month?: number } | undefined {
  if (!date?.year || date.year <= 0) return undefined
  const month = toMonthNumber(date.monthNumber ?? date.month)
  return {
    year: date.year,
    ...(month ? { month } : {}),
  }
}

function isPresentDate(date: ApifyDate | undefined): boolean {
  const normalizedText = normalizeString(date?.text)?.toLowerCase()
  return normalizedText === 'present'
}

function clampChunkSize(size: number | undefined): number {
  if (!size) return DEFAULT_MAX_QUERIES_PER_RUN
  if (!Number.isFinite(size)) return DEFAULT_MAX_QUERIES_PER_RUN
  return Math.max(1, Math.floor(size))
}

function chunk<T>(items: T[], chunkSize: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += chunkSize) {
    out.push(items.slice(i, i + chunkSize))
  }
  return out
}

function mapEducation(e: ApifyEducation): RawLinkedInProfile['educations'][number] | null {
  const schoolName = normalizeString(e.schoolName)
  const fieldOfStudy = normalizeString(e.fieldOfStudy)
  const degree = normalizeString(e.degree)
  if (!schoolName && !fieldOfStudy && !degree) return null
  return {
    schoolName: schoolName ?? '',
    fieldOfStudy: fieldOfStudy ?? '',
    degree: degree ?? '',
    startYear: e.startDate?.year,
    endYear: e.endDate?.year,
  }
}

function mapExperience(e: ApifyExperience): RawLinkedInProfile['experience'][number] | null {
  const companyName = normalizeString(e.companyName)
  const title = normalizeString(e.position)
  if (!companyName && !title) return null
  const start = toDatePart(e.startDate)
  const end = isPresentDate(e.endDate) ? undefined : toDatePart(e.endDate)
  return {
    companyName: companyName ?? '',
    title: title ?? '',
    ...(start ? { start } : {}),
    ...(end ? { end } : {}),
    ...(normalizeString(e.location) ? { location: normalizeString(e.location) } : {}),
    ...(normalizeString(e.employmentType)
      ? { employmentType: normalizeString(e.employmentType) }
      : {}),
    ...(normalizeString(e.companyLinkedinUrl)
      ? { companyUrl: normalizeString(e.companyLinkedinUrl) }
      : {}),
  }
}

function normalizeSkills(skills: ApifySkill[] | undefined): string[] {
  if (!skills || skills.length === 0) return []
  return skills.map((s) => normalizeString(s.name)).filter((name): name is string => Boolean(name))
}

function normalizeProfileItem(item: unknown): ApifyProfileItem {
  return (item ?? {}) as ApifyProfileItem
}

interface ApifyRunData {
  status?: string
  defaultDatasetId?: string
}

interface ApifyRunResponse {
  data?: ApifyRunData
  error?: { message?: string }
  message?: string
}

function buildApifyUrl(
  path: string,
  apiKey: string,
  params?: Record<string, string | undefined>
): string {
  const url = new URL(`${APIFY_BASE_URL}${path}`)
  url.searchParams.set('token', apiKey)
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        url.searchParams.set(key, value)
      }
    }
  }
  return url.toString()
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const json = (await response.json()) as ApifyRunResponse
    return json.error?.message ?? json.message ?? `HTTP ${response.status}`
  } catch {
    return `HTTP ${response.status}`
  }
}

export function mapApifyItemToRawProfile(item: unknown): RawLinkedInProfile {
  const profile = normalizeProfileItem(item)
  const username =
    normalizeString(profile.publicIdentifier) ?? usernameFromLinkedInUrl(profile.linkedinUrl)
  if (!username) {
    throw new Error('Apify profile missing publicIdentifier/linkedinUrl username')
  }

  const educations = (profile.education ?? [])
    .map(mapEducation)
    .filter((entry): entry is RawLinkedInProfile['educations'][number] => entry !== null)

  const experience = (profile.experience ?? [])
    .map(mapExperience)
    .filter((entry): entry is RawLinkedInProfile['experience'][number] => entry !== null)

  const location =
    normalizeString(profile.location?.linkedinText) ?? normalizeString(profile.location?.parsed?.text)
  const profilePicture = normalizeString(profile.profilePicture?.url) ?? normalizeString(profile.photo)

  return {
    username,
    firstName: normalizeString(profile.firstName) ?? '',
    lastName: normalizeString(profile.lastName) ?? '',
    headline: normalizeString(profile.headline) ?? '',
    ...(normalizeString(profile.about) ? { summary: normalizeString(profile.about) } : {}),
    ...(profilePicture ? { profilePicture } : {}),
    ...(location ? { location } : {}),
    educations,
    experience,
    skills: normalizeSkills(profile.skills),
  }
}

async function runActorAndCollect(
  apiKey: string,
  actorId: string,
  profileScraperMode: string,
  queries: string[]
): Promise<RawLinkedInProfile[]> {
  if (queries.length === 0) return []
  const runUrl = buildApifyUrl(`/acts/${actorId}/runs`, apiKey, {
    waitForFinish: String(DEFAULT_WAIT_FOR_FINISH_SECONDS),
  })
  const runResponse = await fetch(runUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      profileScraperMode,
      queries,
    }),
  })
  if (!runResponse.ok) {
    const errorMessage = await readErrorMessage(runResponse)
    throw new Error(`Apify run failed: ${errorMessage}`)
  }

  const runJson = (await runResponse.json()) as ApifyRunResponse
  const run = runJson.data
  if (!run?.defaultDatasetId) {
    throw new Error('Apify run finished without defaultDatasetId')
  }
  if (run.status && run.status !== 'SUCCEEDED') {
    throw new Error(`Apify run did not succeed: ${run.status}`)
  }

  const datasetUrl = buildApifyUrl(`/datasets/${run.defaultDatasetId}/items`, apiKey, {
    format: 'json',
    clean: 'true',
  })
  const datasetResponse = await fetch(datasetUrl)
  if (!datasetResponse.ok) {
    const errorMessage = await readErrorMessage(datasetResponse)
    throw new Error(`Apify dataset fetch failed: ${errorMessage}`)
  }
  const items = (await datasetResponse.json()) as unknown
  if (!Array.isArray(items)) {
    throw new Error('Apify dataset response was not an array')
  }
  return items.map((item) => mapApifyItemToRawProfile(item))
}

export function createApifyProvider({
  apiKey,
  actorId = DEFAULT_ACTOR_ID,
  profileScraperMode = DEFAULT_PROFILE_SCRAPER_MODE,
  maxQueriesPerRun = DEFAULT_MAX_QUERIES_PER_RUN,
}: CreateApifyProviderArgs): LinkedInProfileProvider {
  const safeChunkSize = clampChunkSize(maxQueriesPerRun)

  return {
    fetchFullProfile: async (username: string): Promise<RawLinkedInProfile> => {
      const linkedInUrl = linkedInUrlFromUsername(username)
      const out = await runActorAndCollect(apiKey, actorId, profileScraperMode, [linkedInUrl])
      const lowerUsername = username.toLowerCase()
      const match = out.find((profile) => profile.username.toLowerCase() === lowerUsername)
      if (!match) {
        throw new Error(`Apify did not return requested profile: ${username}`)
      }
      return match
    },
    fetchFullProfilesByUrls: async (linkedInUrls: string[]): Promise<Map<string, RawLinkedInProfile>> => {
      const normalizedUrls = linkedInUrls.map((url) => url.trim()).filter((url) => url.length > 0)
      if (normalizedUrls.length === 0) return new Map()
      const urlBatches = chunk(normalizedUrls, safeChunkSize)

      const profilesByUsername = new Map<string, RawLinkedInProfile>()
      for (const urls of urlBatches) {
        const profiles = await runActorAndCollect(apiKey, actorId, profileScraperMode, urls)
        for (const profile of profiles) {
          profilesByUsername.set(profile.username.toLowerCase(), profile)
        }
      }

      const profilesByInputUrl = new Map<string, RawLinkedInProfile>()
      for (const linkedInUrl of normalizedUrls) {
        const username = usernameFromLinkedInUrl(linkedInUrl)
        if (!username) continue
        const profile = profilesByUsername.get(username.toLowerCase())
        if (!profile) continue
        profilesByInputUrl.set(linkedInUrl, profile)
      }
      return profilesByInputUrl
    },
  }
}
