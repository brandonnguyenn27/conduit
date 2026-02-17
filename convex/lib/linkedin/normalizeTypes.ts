export interface NormalizedSearchArrays {
  majors: string[]
  schools: string[]
  companies: string[]
  jobTitles: string[]
}

export interface NormalizerInput {
  education: Array<{ schoolName: string; fieldOfStudy: string }>
  experience: Array<{ companyName: string; title: string }>
}

export type Normalizer = (
  input: NormalizerInput
) => Promise<NormalizedSearchArrays>
