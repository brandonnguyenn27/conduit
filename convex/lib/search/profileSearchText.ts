type SearchTextInput = {
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
}

function toDedupedTokens(values: Array<string | undefined>): string[] {
  const seen = new Set<string>()
  const tokens: string[] = []
  for (const value of values) {
    if (!value) continue
    const normalized = value.trim()
    if (!normalized) continue
    const key = normalized.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    tokens.push(normalized)
  }
  return tokens
}

export function buildProfileSearchText(input: SearchTextInput): string {
  const tokens = toDedupedTokens([
    input.name,
    input.headline,
    input.summary,
    input.location,
    input.industry,
    ...(input.skills ?? []),
    ...input.majors,
    ...input.schools,
    ...input.companies,
    ...input.jobTitles,
  ])
  return tokens.join(' ')
}
