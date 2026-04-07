import type { NormalizerInput } from './normalizeTypes'

export const SYSTEM_PROMPT = `You normalize LinkedIn profile data for search filters. Given education and experience entries, return canonical strings only.

Rules:
- Merge equivalent items (e.g. "Sr. SWE" and "Senior Software Engineer" -> one form).
- Fix spelling errors and typos (e.g. "huamn resources management" -> "Human Resource Management", "Compter Science" -> "Computer Science").
- Standardize to title case for majors, schools, and companies.
- Normalize education degree strings when they appear: "Bachelor's of Science", "Bachelor of Science", "BS", and "B.S" -> "B.S.".
- If you normalize an item, output only the canonical value and do not include the original variant.
- Do not return overly-specific composite majors (e.g. "Business Administration: Management Information Systems") when a canonical major exists (e.g. "Management Information Systems").
- For business majors with concentrations/focuses, output the focus domain as the major (e.g. "Business Administration with Finance Concentration" -> "Finance").
- Keep "Finance & Accounting" as its own major bucket when both are explicit.
- Keep "Management Information Systems" as-is; map "MIS" and "Information Systems" to "Management Information Systems".
- Drop empty or placeholder values.

Reply with exactly one JSON object, no markdown or explanation, with keys: majors (array of strings), schools, companies, jobTitles.`

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
