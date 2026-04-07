import { deriveCurrentExperienceFromStored } from '../../lib/profiles/deriveCurrentExperience'
import {
  canonicalizeJobTitleTokens,
  canonicalizeMajorTokens,
} from '../../lib/linkedin/canonicalizeFacets'
import { splitJobTitlesByTenure } from '../profiles/helpers'

export type FacetKey =
  | 'companies'
  | 'currentCompanies'
  | 'majors'
  | 'schools'
  | 'currentRoles'
  | 'pastRoles'
  | 'classes'
  | 'families'

export const ALL_FACET_KEYS: FacetKey[] = [
  'companies',
  'currentCompanies',
  'majors',
  'schools',
  'currentRoles',
  'pastRoles',
  'classes',
  'families',
]

const MAX_GENERIC_FACET_TOKEN_LENGTH = 120
const MAX_MAJOR_TOKEN_LENGTH = 80

export function canonicalizeKey(value: string): string {
  return value.trim().toLowerCase()
}

type ProfileLike = {
  companies: string[]
  currentCompany?: string
  currentExperience?: { companyName: string; title: string; start?: unknown; end?: unknown }
  experience: Array<{
    companyName: string
    title: string
    start?: { year: number; month?: number; day?: number }
    end?: { year: number; month?: number; day?: number }
  }>
  majors: string[]
  schools: string[]
  /**
   * Fraternity class (e.g. Alpha … Alpha Pi). Many members share the same class; facet `classes` aggregates counts.
   */
  class?: string
  /**
   * One of a small fixed set of families (e.g. five). Many members share the same family; facet `families` aggregates counts.
   */
  family?: string
}

/**
 * Extract raw facet tokens from a profile document.
 * Matches the same logic used in the old `rebuildOrganizationFacets`.
 */
export function extractFacetTokens(profile: ProfileLike): Record<FacetKey, string[]> {
  const companies = [...profile.companies]
  if (profile.currentCompany) companies.push(profile.currentCompany)

  let currentCo =
    profile.currentExperience?.companyName?.trim() || profile.currentCompany?.trim()
  if (!currentCo) {
    const derived = deriveCurrentExperienceFromStored(profile.experience)
    currentCo = derived?.currentExperience.companyName?.trim()
  }
  const currentCompanies = currentCo ? [currentCo] : []

  const roleTenure = splitJobTitlesByTenure(profile.experience)

  const classes = profile.class?.trim() ? dedupeTokens([profile.class]) : []
  const families = profile.family?.trim() ? dedupeTokens([profile.family]) : []

  return {
    companies: sanitizeFacetTokens('companies', companies),
    currentCompanies: sanitizeFacetTokens('currentCompanies', currentCompanies),
    majors: sanitizeFacetTokens('majors', canonicalizeMajorTokens(profile.majors)),
    schools: sanitizeFacetTokens('schools', profile.schools),
    currentRoles: sanitizeFacetTokens('currentRoles', canonicalizeJobTitleTokens(roleTenure.current)),
    pastRoles: sanitizeFacetTokens('pastRoles', canonicalizeJobTitleTokens(roleTenure.past)),
    classes,
    families,
  }
}

function sanitizeFacetTokens(facet: FacetKey, values: string[]): string[] {
  const filtered: string[] = []
  for (const value of values) {
    const trimmed = value.trim()
    if (!trimmed) continue
    if (trimmed.length > MAX_GENERIC_FACET_TOKEN_LENGTH) continue
    if (facet === 'majors' && shouldDropMajorToken(trimmed)) continue
    filtered.push(trimmed)
  }
  return dedupeTokens(filtered)
}

function shouldDropMajorToken(value: string): boolean {
  if (value.length > MAX_MAJOR_TOKEN_LENGTH) return true
  if (value.includes(':') || value.includes('|')) return true
  const commas = value.match(/,/g)?.length ?? 0
  return commas > 2
}

function dedupeTokens(values: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const v of values) {
    const trimmed = v.trim()
    if (!trimmed) continue
    const key = canonicalizeKey(trimmed)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(trimmed)
  }
  return out
}

export function computeFacetDelta(
  oldTokens: string[],
  newTokens: string[]
): { added: string[]; removed: string[] } {
  const oldKeys = new Map<string, string>()
  for (const t of oldTokens) {
    const key = canonicalizeKey(t)
    if (key) oldKeys.set(key, t)
  }
  const newKeys = new Map<string, string>()
  for (const t of newTokens) {
    const key = canonicalizeKey(t)
    if (key) newKeys.set(key, t)
  }

  const added: string[] = []
  const removed: string[] = []

  for (const [key, display] of newKeys) {
    if (!oldKeys.has(key)) added.push(display)
  }
  for (const [key, display] of oldKeys) {
    if (!newKeys.has(key)) removed.push(display)
  }

  return { added, removed }
}
