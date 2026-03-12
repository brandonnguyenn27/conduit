import { deriveCurrentExperienceFromStored } from '../../lib/profiles/deriveCurrentExperience'
import { splitJobTitlesByTenure } from '../profiles/helpers'

export type FacetKey =
  | 'companies'
  | 'currentCompanies'
  | 'majors'
  | 'schools'
  | 'currentRoles'
  | 'pastRoles'

export const ALL_FACET_KEYS: FacetKey[] = [
  'companies',
  'currentCompanies',
  'majors',
  'schools',
  'currentRoles',
  'pastRoles',
]

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

  return {
    companies: dedupeTokens(companies),
    currentCompanies: dedupeTokens(currentCompanies),
    majors: dedupeTokens(profile.majors),
    schools: dedupeTokens(profile.schools),
    currentRoles: dedupeTokens(roleTenure.current),
    pastRoles: dedupeTokens(roleTenure.past),
  }
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
