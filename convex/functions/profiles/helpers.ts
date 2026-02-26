import { v } from 'convex/values'
import { educationEntry, experienceEntry } from '../../lib/validators'
import { buildProfileSearchText } from '../../lib/search/profileSearchText'

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
  currentCompany: v.optional(v.string()),
  class: v.optional(v.string()),
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
