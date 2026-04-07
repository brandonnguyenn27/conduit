const BUSINESS_ADMIN_REGEX = /\b(business administration|business admin|b\.?b\.?a\.?)\b/i
const MAJOR_FOCUS_REGEXES = [
  /\b(?:concentration|focus|specialization|emphasis)\s+(?:in|on)?\s*([a-z0-9&/,\- ]+)$/i,
  /\bwith\s+(?:a\s+)?(?:concentration|focus|specialization|emphasis)\s+(?:in|on)\s+([a-z0-9&/,\- ]+)$/i,
  /\bbusiness (?:administration|admin)\s*(?:[:-]|with)\s*([a-z0-9&/,\- ]+)$/i,
]

const JOB_TITLE_LEVEL_SUFFIX = /\s+(?:i|ii|iii|iv|v|1|2|3|4|5)$/i

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function cleanForMatching(value: string): string {
  return collapseWhitespace(
    value
      .toLowerCase()
      .replace(/[()]/g, ' ')
      .replace(/[.:]/g, ' ')
      .replace(/\s+/g, ' ')
  )
}

function titleCase(value: string): string {
  return value
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

function dedupeCaseInsensitive(values: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const value of values) {
    const trimmed = collapseWhitespace(value)
    if (!trimmed) continue
    const key = trimmed.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(trimmed)
  }
  return out
}

function mapMajorBucket(value: string): string | null {
  const normalized = cleanForMatching(value)
  if (!normalized) return null
  if (/\b(finance|financial)\b/.test(normalized) && /\baccounting\b/.test(normalized)) {
    return 'Finance & Accounting'
  }
  if (/\b(mis|management information systems?|information systems?)\b/.test(normalized)) {
    return 'Management Information Systems'
  }
  if (/\baccounting\b/.test(normalized)) return 'Accounting'
  if (/\b(finance|financial)\b/.test(normalized)) return 'Finance'
  if (/\bmarketing\b/.test(normalized)) return 'Marketing'
  if (/\bhuman resources?\b/.test(normalized)) return 'Human Resources'
  if (/\b(supply chain|logistics)\b/.test(normalized)) return 'Supply Chain Management'
  if (/\bentrepreneur(ship)?\b/.test(normalized)) return 'Entrepreneurship'
  return null
}

function extractMajorFocus(value: string): string | null {
  for (const regex of MAJOR_FOCUS_REGEXES) {
    const match = value.match(regex)
    if (match?.[1]) return collapseWhitespace(match[1])
  }
  return null
}

export function canonicalizeMajorToken(value: string): string[] {
  const trimmed = collapseWhitespace(value)
  if (!trimmed) return []

  const mapped = mapMajorBucket(trimmed)
  const isBusinessAdmin = BUSINESS_ADMIN_REGEX.test(trimmed)
  if (!isBusinessAdmin) {
    return mapped ? [mapped] : [titleCase(trimmed)]
  }

  const focus = extractMajorFocus(trimmed)
  const focusBucket = focus ? mapMajorBucket(focus) : null
  if (!focusBucket) {
    return ['Business Administration']
  }
  if (focusBucket === 'Finance & Accounting') {
    return [focusBucket, 'Business Administration']
  }
  return [focusBucket, 'Business Administration']
}

export function canonicalizeMajorTokens(values: string[]): string[] {
  const out: string[] = []
  for (const value of values) {
    out.push(...canonicalizeMajorToken(value))
  }
  return dedupeCaseInsensitive(out)
}

function mapJobTitleBucket(value: string): string | null {
  const normalized = cleanForMatching(value)
  if (!normalized) return null
  if (/\bsoftware engineer\b/.test(normalized) || /\bswe\b/.test(normalized)) {
    return 'Software Engineer'
  }
  if (/\bfinancial analyst\b/.test(normalized)) return 'Financial Analyst'
  if (/\bproduct (manager|management)\b/.test(normalized)) return 'Product Manager'
  if (/\bbusiness analyst\b/.test(normalized)) return 'Business Analyst'
  if (/\bdata analyst\b/.test(normalized)) return 'Data Analyst'
  if (/\bproject manager\b/.test(normalized)) return 'Project Manager'
  if (/\bprogram manager\b/.test(normalized)) return 'Program Manager'
  return null
}

export function canonicalizeJobTitleToken(value: string): string {
  const trimmed = collapseWhitespace(value)
  if (!trimmed) return ''
  let simplified = trimmed
    .replace(/\([^)]*\)/g, ' ')
    .replace(JOB_TITLE_LEVEL_SUFFIX, '')
  simplified = collapseWhitespace(simplified)
  const mapped = mapJobTitleBucket(simplified)
  if (mapped) return mapped
  return titleCase(simplified)
}

export function canonicalizeJobTitleTokens(values: string[]): string[] {
  const out: string[] = []
  for (const value of values) {
    const canonical = canonicalizeJobTitleToken(value)
    if (canonical) out.push(canonical)
  }
  return dedupeCaseInsensitive(out)
}
