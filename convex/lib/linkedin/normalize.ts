import type { NormalizedSearchArrays, NormalizerInput } from './normalizeTypes'
import { normalizeWithClaude } from './normalizeClaude'

function mockNormalize(input: NormalizerInput): NormalizedSearchArrays {
  const majors = [...new Set(input.education.map((e) => e.fieldOfStudy).filter(Boolean))]
  const schools = [...new Set(input.education.map((e) => e.schoolName).filter(Boolean))]
  const companies = [...new Set(input.experience.map((e) => e.companyName).filter(Boolean))]
  const jobTitles = [...new Set(input.experience.map((e) => e.title).filter(Boolean))]
  return { majors, schools, companies, jobTitles }
}

/**
 * Returns normalized search arrays via Claude. Set ANTHROPIC_API_KEY in Convex env
 * to enable. If unset, returns null (caller uses raw arrays).
 * When PIPELINE_TEST_MODE=true, returns mock normalized arrays (no API call).
 */
export async function normalizeSearchArrays(
  input: NormalizerInput
): Promise<NormalizedSearchArrays | null> {
  if (process.env.PIPELINE_TEST_MODE === 'true') {
    return mockNormalize(input)
  }
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return null
  try {
    return await normalizeWithClaude(input, apiKey)
  } catch {
    return null
  }
}
