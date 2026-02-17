import type { NormalizerInput } from './normalizeTypes'

export const SYSTEM_PROMPT = `You normalize LinkedIn profile data for search filters. Given education and experience entries, return canonical strings only: merge equivalent items (e.g. "Sr. SWE" and "Senior Software Engineer" -> one form), fix obvious typos, drop empty or placeholder values. Reply with exactly one JSON object, no markdown or explanation, with keys: majors (array of strings), schools, companies, jobTitles.`

export function buildUserMessage(input: NormalizerInput): string {
  return `Education (schoolName, fieldOfStudy): ${JSON.stringify(input.education)}\nExperience (companyName, title): ${JSON.stringify(input.experience)}`
}

export function parseNormalizerResponse(text: string): { majors: string[]; schools: string[]; companies: string[]; jobTitles: string[] } {
  const trimmed = text.replace(/^```(?:json)?\s*|\s*```$/g, '').trim()
  const parsed = JSON.parse(trimmed) as Record<string, unknown>
  const arr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [])
  return {
    majors: arr(parsed.majors),
    schools: arr(parsed.schools),
    companies: arr(parsed.companies),
    jobTitles: arr(parsed.jobTitles),
  }
}
