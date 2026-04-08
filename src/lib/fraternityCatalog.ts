/**
 * Fraternity class and family labels are repeated across many profiles (facet counts aggregate).
 * Edit `FRATERNITY_FAMILY_LABELS` to match your chapter’s five families.
 */

const GREEK_TO_PI = [
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
] as const

/**
 * Class line: Charter (before Alpha), then single Greek names (Alpha … Pi), then compounds Alpha Alpha … Alpha Pi.
 */
export const FRATERNITY_CLASS_LABELS: readonly string[] = [
  'Charter',
  ...GREEK_TO_PI,
  ...GREEK_TO_PI.map((second) => `Alpha ${second}`),
]

export const FRATERNITY_FAMILY_LABELS: readonly [string, string, string, string, string] = [
  'Brotherhood',
  'Unity',
  'Service',
  'Integrity',
  'Knowledge',
]
