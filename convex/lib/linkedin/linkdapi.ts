import type { RawLinkedInProfile } from './types'

const LINKDAPI_BASE = 'https://linkdapi.com'
const FULL_PROFILE_PATH = '/api/v1/profile/full'
const LINKDAPI_HEADER = 'X-linkdapi-apikey'

interface LinkdAPIResponse {
  success: boolean
  data?: LinkdAPIData
  message?: string
}

interface LinkdAPIData {
  username: string
  firstName: string
  lastName: string
  headline: string
  summary?: string
  profilePicture?: string
  geo?: { full?: string; city?: string }
  educations?: LinkdAPIEducation[]
  position?: LinkdAPIPosition[]
  fullPositions?: LinkdAPIPosition[]
  skills?: { name: string }[]
}

interface LinkdAPIEducation {
  schoolName: string
  fieldOfStudy: string
  degree: string
  start?: { year: number; month?: number; day?: number }
  end?: { year: number; month?: number; day?: number }
}

interface LinkdAPIPosition {
  companyName: string
  title: string
  start?: { year: number; month?: number; day?: number }
  end?: { year: number; month?: number; day?: number }
  location?: string
  employmentType?: string
  companyURL?: string
  companyIndustry?: string
}

function toDatePart(
  o?: { year: number; month?: number; day?: number }
): RawLinkedInProfile['experience'][0]['start'] {
  if (!o?.year) return undefined
  return { year: o.year, month: o.month, day: o.day }
}

export async function fetchLinkdAPIFullProfile(
  username: string,
  apiKey: string
): Promise<RawLinkedInProfile> {
  const url = `${LINKDAPI_BASE}${FULL_PROFILE_PATH}?username=${encodeURIComponent(username)}`
  const res = await fetch(url, {
    headers: { [LINKDAPI_HEADER]: apiKey },
  })
  const json = (await res.json()) as LinkdAPIResponse
  if (!json.success || !json.data) {
    const msg = json.message ?? `HTTP ${res.status}`
    throw new Error(`LinkdAPI error: ${msg}`)
  }
  const d = json.data
  const positions = d.fullPositions ?? d.position ?? []
  return {
    username: d.username,
    firstName: d.firstName,
    lastName: d.lastName,
    headline: d.headline,
    summary: d.summary,
    profilePicture: d.profilePicture,
    location: d.geo?.full ?? d.geo?.city,
    educations: (d.educations ?? []).map((e) => ({
      schoolName: e.schoolName,
      fieldOfStudy: e.fieldOfStudy,
      degree: e.degree,
      startYear: e.start?.year,
      endYear: e.end?.year,
    })),
    experience: positions.map((p) => ({
      companyName: p.companyName,
      title: p.title,
      start: toDatePart(p.start),
      end: toDatePart(p.end),
      location: p.location,
      employmentType: p.employmentType,
      companyUrl: p.companyURL,
      companyIndustry: p.companyIndustry,
    })),
    skills: (d.skills ?? []).map((s) => s.name),
  }
}
