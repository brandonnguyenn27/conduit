import { v } from 'convex/values'
import { educationEntry, experienceEntry } from '../../lib/validators'
import { deriveCurrentExperienceFromStored } from '../../lib/profiles/deriveCurrentExperience'
import { buildSlugBlob, slugifySearchToken } from '../../lib/search/slug'

export const profileInsertValidator = v.object({
  organizationId: v.id('organizations'),
  linkedInUrl: v.string(),
  linkedInUsername: v.optional(v.string()),
  name: v.string(),
  headline: v.string(),
  summary: v.optional(v.string()),
  profileImageUrl: v.optional(v.string()),
  location: v.optional(v.string()),
  industry: v.optional(v.string()),
  education: v.array(educationEntry),
  experience: v.array(experienceEntry),
  skills: v.optional(v.array(v.string())),
  majors: v.array(v.string()),
  schools: v.array(v.string()),
  companies: v.array(v.string()),
  jobTitles: v.array(v.string()),
  suggestSearchText: v.optional(v.string()),
  companiesSearchSlug: v.optional(v.string()),
  currentCompanySlug: v.optional(v.string()),
  educationSearchSlug: v.optional(v.string()),
  jobTitlesSearchSlug: v.optional(v.string()),
  currentJobTitlesSearchSlug: v.optional(v.string()),
  pastJobTitlesSearchSlug: v.optional(v.string()),
  currentCompany: v.optional(v.string()),
  currentExperience: v.optional(experienceEntry),
  class: v.optional(v.string()),
  profileType: v.optional(v.union(v.literal('alumni'), v.literal('member'))),
  claimedByUserId: v.optional(v.string()),
  email: v.optional(v.string()),
})

type SuggestSearchInput = {
  name: string
  headline: string
  summary?: string
  skills?: string[]
  majors: string[]
  schools: string[]
  companies: string[]
  jobTitles: string[]
}

export function toSuggestSearchText(input: SuggestSearchInput): string {
  const terms = [
    input.name,
    input.headline,
    input.summary,
    ...(input.skills ?? []),
    ...input.majors,
    ...input.schools,
    ...input.companies,
    ...input.jobTitles,
  ].filter((term): term is string => typeof term === 'string')
  const seen = new Set<string>()
  const normalized: string[] = []
  for (const term of terms) {
    const token = term.trim().toLowerCase()
    if (!token || seen.has(token)) continue
    seen.add(token)
    normalized.push(token)
  }
  return normalized.join(' ')
}

export function toCompaniesSearchSlugFromExperience(
  experience: Array<{ companyName: string }>
): string {
  return buildSlugBlob(experience.map((e) => e.companyName))
}

export function toCurrentCompanySlugFromExperience(
  experience: Array<{
    companyName: string
    title: string
    start?: { year: number; month?: number; day?: number }
    end?: { year: number; month?: number; day?: number }
  }>
): string | undefined {
  const derived = deriveCurrentExperienceFromStored(experience)
  const slug = slugifySearchToken(derived?.currentExperience.companyName ?? '')
  return slug || undefined
}

export function toEducationSearchSlug(schools: string[], majors: string[]): string {
  return buildSlugBlob([...schools, ...majors])
}

export function normalizeRoleExact(value: string): string {
  const words = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
  if (words.length === 0) return ''
  return words.join(' ')
}

function buildRoleSearchBlob(values: string[]): string {
  const seen = new Set<string>()
  const tokens: string[] = []
  for (const value of values) {
    const normalized = normalizeRoleExact(value)
    if (!normalized) continue
    for (const token of normalized.split(' ')) {
      if (seen.has(token)) continue
      seen.add(token)
      tokens.push(token)
    }
  }
  return tokens.join(' ')
}

export function toRoleSearchQuery(value: string): string {
  return normalizeRoleExact(value)
}

function isExplicitCurrentRoleExperience(experience: {
  end?: { year: number; month?: number; day?: number }
}): boolean {
  if (!experience.end) return true
  return !experience.end.year || experience.end.year <= 0
}

function dedupeKeepFirst(values: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const value of values) {
    const trimmed = value.trim()
    if (!trimmed) continue
    const key = trimmed.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(trimmed)
  }
  return out
}

export function splitJobTitlesByTenure(
  experience: Array<{
    title: string
    start?: { year: number; month?: number; day?: number }
    end?: { year: number; month?: number; day?: number }
  }>
) {
  let current = dedupeKeepFirst(
    experience.filter(isExplicitCurrentRoleExperience).map((item) => item.title)
  )
  if (current.length === 0) {
    const derived = deriveCurrentExperienceFromStored(
      experience.map((item) => ({
        companyName: '__role__',
        title: item.title,
        start: item.start,
        end: item.end,
      }))
    )
    current = dedupeKeepFirst(derived?.currentExperience?.title ? [derived.currentExperience.title] : [])
  }
  const currentKeys = new Set(current.map((title) => title.trim().toLowerCase()))
  const past = dedupeKeepFirst(
    experience
      .map((item) => item.title)
      .filter((title) => !currentKeys.has(title.trim().toLowerCase()))
  )
  return { current, past }
}

export function toJobTitlesSearchSlug(jobTitles: string[]): string {
  return buildRoleSearchBlob(jobTitles)
}

export function toCurrentJobTitlesSearchSlugFromExperience(
  experience: Array<{
    title: string
    end?: { year: number; month?: number; day?: number }
  }>
): string {
  const { current } = splitJobTitlesByTenure(experience)
  return buildRoleSearchBlob(current)
}

export function toPastJobTitlesSearchSlugFromExperience(
  experience: Array<{
    title: string
    end?: { year: number; month?: number; day?: number }
  }>
): string {
  const { past } = splitJobTitlesByTenure(experience)
  return buildRoleSearchBlob(past)
}
