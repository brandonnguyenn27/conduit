/**
 * Minimal shape from LinkedIn profile APIs (e.g. LinkdAPI full profile).
 * Implementations map their response to this so the rest of the pipeline is provider-agnostic.
 */
export interface DatePart {
  year: number
  month?: number
  day?: number
}

export interface RawEducation {
  schoolName: string
  fieldOfStudy: string
  degree: string
  startYear?: number
  endYear?: number
}

export interface RawExperience {
  companyName: string
  title: string
  start?: DatePart
  end?: DatePart
  location?: string
  employmentType?: string
  companyUrl?: string
  companyIndustry?: string
}

export interface RawLinkedInProfile {
  username: string
  firstName: string
  lastName: string
  headline: string
  summary?: string
  profilePicture?: string
  location?: string
  industry?: string
  educations: RawEducation[]
  experience: RawExperience[]
  skills: string[]
}

export interface LinkedInProfileProvider {
  fetchFullProfile(usernameOrUrn: string): Promise<RawLinkedInProfile>
}
