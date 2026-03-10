import { v } from 'convex/values'
import { educationEntry, experienceEntry } from '../../lib/validators'
import { deriveCurrentExperienceFromStored } from '../../lib/profiles/deriveCurrentExperience'
import {
  buildCompaniesSearchText,
  buildProfileSearchText,
} from '../../lib/search/profileSearchText'
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
  searchText: v.optional(v.string()),
  companiesSearchText: v.optional(v.string()),
  companiesSearchSlug: v.optional(v.string()),
  currentCompanySlug: v.optional(v.string()),
  educationSearchSlug: v.optional(v.string()),
  currentCompany: v.optional(v.string()),
  currentExperience: v.optional(experienceEntry),
  currentExperienceSearchText: v.optional(v.string()),
  class: v.optional(v.string()),
  profileType: v.optional(v.union(v.literal('alumni'), v.literal('member'))),
  claimedByUserId: v.optional(v.string()),
  email: v.optional(v.string()),
})

export function toSearchText(input: {
  name: string
  headline: string
  summary?: string
  location?: string
  industry?: string
  skills?: string[]
  majors: string[]
  schools: string[]
  companies: string[]
  jobTitles: string[]
}): string {
  return buildProfileSearchText(input)
}

export function toCompaniesSearchText(companies: string[]): string {
  return buildCompaniesSearchText(companies)
}

export function toCompaniesSearchTextFromExperience(
  experience: Array<{ companyName: string }>
): string {
  const companies = [...new Set(experience.map((e) => e.companyName.trim()).filter(Boolean))]
  return buildCompaniesSearchText(companies)
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
