/**
 * Greek-alphabet order for fraternity class display names (e.g. Explore filter).
 * Singles (Charter, one Greek name) first in Greek order, then space-separated
 * names compared token by token in Greek order.
 */

const GREEK_LETTER_NAMES = [
  'Alpha',
  'Beta',
  'Gamma',
  'Delta',
  'Epsilon',
  'Zeta',
  'Eta',
  'Theta',
  'Iota',
  'Kappa',
  'Lambda',
  'Mu',
  'Nu',
  'Xi',
  'Omicron',
  'Pi',
  'Rho',
  'Sigma',
  'Tau',
  'Upsilon',
  'Phi',
  'Chi',
  'Psi',
  'Omega',
] as const

const GREEK_INDEX = new Map(GREEK_LETTER_NAMES.map((name, i) => [name, i]))
const GREEK_BY_NORMALIZED = new Map(
  GREEK_LETTER_NAMES.map((name) => [name.toLowerCase(), name] as const)
)

const RANK_CHARTER = -1
const RANK_UNKNOWN = 10_000

function tokenRank(token: string): number {
  const lower = token.toLowerCase()
  if (lower === 'charter') return RANK_CHARTER
  const canonical = GREEK_BY_NORMALIZED.get(lower)
  return canonical !== undefined ? GREEK_INDEX.get(canonical)! : RANK_UNKNOWN
}

function tokens(label: string): string[] {
  return label.trim().split(/\s+/).filter(Boolean)
}

export function compareFraternityClassGreek(a: string, b: string): number {
  const ta = tokens(a)
  const tb = tokens(b)
  if (!ta.length && !tb.length) return 0
  if (!ta.length) return 1
  if (!tb.length) return -1
  if ((ta.length === 1) !== (tb.length === 1)) return ta.length === 1 ? -1 : 1

  for (let i = 0; ; i++) {
    if (i === ta.length && i === tb.length) return 0
    if (i === ta.length) return -1
    if (i === tb.length) return 1
    const ra = tokenRank(ta[i])
    const rb = tokenRank(tb[i])
    if (ra !== rb) return ra - rb
    const tie = ta[i].localeCompare(tb[i], 'en', { sensitivity: 'base' })
    if (tie) return tie
  }
}

/**
 * Deduplicate and order class display strings: singles first (Charter, then Alpha…Omega, then
 * other one-word values), then compounds by Greek order on each word.
 */
export function sortFraternityClassesByGreek(labels: string[]): string[] {
  return [...new Set(labels)].sort(compareFraternityClassGreek)
}
