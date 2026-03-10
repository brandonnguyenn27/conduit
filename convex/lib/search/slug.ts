const MAX_SEARCH_TERM_LENGTH = 32

function normalizeToSlug(value: string): string {
  const lower = value.trim().toLowerCase()
  if (!lower) return ''
  return lower.replace(/[^a-z0-9]+/g, '')
}

export function slugifySearchToken(value: string): string {
  const slug = normalizeToSlug(value)
  if (!slug) return ''
  return slug.slice(0, MAX_SEARCH_TERM_LENGTH)
}

export function buildSlugBlob(values: string[]): string {
  const seen = new Set<string>()
  const slugs: string[] = []
  for (const value of values) {
    const slug = slugifySearchToken(value)
    if (!slug || seen.has(slug)) continue
    seen.add(slug)
    slugs.push(slug)
  }
  return slugs.join(' ')
}
