import type { Id } from '../../_generated/dataModel'
import type { RawLinkedInProfile } from './types'

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
}

const LINKEDIN_BASE = 'https://www.linkedin.com/in/'

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
  return {
    organizationId,
    linkedInUrl,
    linkedInUsername,
    name: `${raw.firstName} ${raw.lastName}`.trim(),
    headline: raw.headline,
    summary: raw.summary,
    profileImageUrl: raw.profilePicture,
    location: raw.location,
    industry: raw.industry,
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
    skills: raw.skills.length ? raw.skills : undefined,
    majors,
    schools,
    companies,
    jobTitles,
  }
}
