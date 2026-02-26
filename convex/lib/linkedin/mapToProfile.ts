import type { Id } from '../../_generated/dataModel'
import type { RawLinkedInProfile } from './types'
import { buildProfileSearchText } from '../search/profileSearchText'

export interface ProfileInsertPayload {
  organizationId: Id<'organizations'>
  linkedInUrl: string
  linkedInUsername?: string
  name: string
  headline: string
  summary?: string
  profileImageUrl?: string
  location?: string
  industry?: string
  education: Array<{
    schoolName: string
    fieldOfStudy: string
    degree: string
    startYear?: number
    endYear?: number
  }>
  experience: Array<{
    companyName: string
    title: string
    start?: { year: number; month?: number; day?: number }
    end?: { year: number; month?: number; day?: number }
    location?: string
    employmentType?: string
    companyUrl?: string
    companyIndustry?: string
  }>
  skills?: string[]
  majors: string[]
  schools: string[]
  companies: string[]
  jobTitles: string[]
  currentCompany?: string
  searchText: string
}

const LINKEDIN_BASE = 'https://www.linkedin.com/in/'

function scoreDate(date?: { year: number; month?: number; day?: number }): number {
  if (!date?.year || date.year <= 0) return 0
  const month = date.month && date.month > 0 ? date.month : 1
  const day = date.day && date.day > 0 ? date.day : 1
  return date.year * 10000 + month * 100 + day
}

function isCurrentExperience(experience: RawLinkedInProfile['experience'][number]): boolean {
  if (!experience.end) return true
  return !experience.end.year || experience.end.year <= 0
}

export function deriveCurrentOrMostRecentCompany(
  experiences: RawLinkedInProfile['experience']
): string | undefined {
  const withCompany = experiences
    .map((experience) => ({
      ...experience,
      companyName: experience.companyName.trim(),
    }))
    .filter((experience) => experience.companyName.length > 0)

  if (withCompany.length === 0) return undefined

  const current = [...withCompany].filter(isCurrentExperience)
  if (current.length > 0) {
    current.sort((a, b) => scoreDate(b.start) - scoreDate(a.start))
    return current[0].companyName
  }

  const ended = [...withCompany]
  ended.sort((a, b) => {
    const endDelta = scoreDate(b.end) - scoreDate(a.end)
    if (endDelta !== 0) return endDelta
    return scoreDate(b.start) - scoreDate(a.start)
  })
  return ended[0].companyName
}

export function mapToProfile(
  raw: RawLinkedInProfile,
  organizationId: Id<'organizations'>
): ProfileInsertPayload {
  const linkedInUsername = raw.username
  const linkedInUrl = `${LINKEDIN_BASE}${linkedInUsername}`
  const majors = [...new Set(raw.educations.map((e) => e.fieldOfStudy).filter(Boolean))]
  const schools = [...new Set(raw.educations.map((e) => e.schoolName).filter(Boolean))]
  const companies = [...new Set(raw.experience.map((e) => e.companyName).filter(Boolean))]
  const jobTitles = [...new Set(raw.experience.map((e) => e.title).filter(Boolean))]
  const currentCompany = deriveCurrentOrMostRecentCompany(raw.experience)
  const name = `${raw.firstName} ${raw.lastName}`.trim()
  const headline = raw.headline
  const summary = raw.summary
  const location = raw.location
  const industry = raw.industry
  const skills = raw.skills.length ? raw.skills : undefined
  const searchText = buildProfileSearchText({
    name,
    headline,
    summary,
    location,
    industry,
    skills,
    majors,
    schools,
    companies,
    jobTitles,
  })
  return {
    organizationId,
    linkedInUrl,
    linkedInUsername,
    name,
    headline,
    summary,
    profileImageUrl: raw.profilePicture,
    location,
    industry,
    education: raw.educations.map((e) => ({
      schoolName: e.schoolName,
      fieldOfStudy: e.fieldOfStudy,
      degree: e.degree,
      startYear: e.startYear,
      endYear: e.endYear,
    })),
    experience: raw.experience.map((e) => ({
      companyName: e.companyName,
      title: e.title,
      start: e.start,
      end: e.end,
      location: e.location,
      employmentType: e.employmentType,
      companyUrl: e.companyUrl,
      companyIndustry: e.companyIndustry,
    })),
    skills,
    majors,
    schools,
    companies,
    jobTitles,
    currentCompany,
    searchText,
  }
}
