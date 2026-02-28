export type Slot1Value = 'alumni' | 'member'
export type Slot2Value = 'works_at' | 'studied' | 'studies'
export type Slot3Value = string
export type FacetKey = 'companies' | 'majors' | 'schools'

export interface MadLibOption<T extends string = string> {
  value: T
  label: string
}

export interface ChatQueryMadLibConfig {
  slot1: MadLibOption<Slot1Value>[]
  slot2BySlot1: Record<Slot1Value, MadLibOption<Slot2Value>[]>
  slot2ToFacet: Record<Slot2Value, FacetKey>
}

export const CHAT_QUERY_CONFIG: ChatQueryMadLibConfig = {
  slot1: [
    { value: 'alumni', label: 'alumni' },
    { value: 'member', label: 'members' },
  ],
  slot2BySlot1: {
    alumni: [
      { value: 'works_at', label: 'who work at' },
      { value: 'studied', label: 'who studied' },
    ],
    member: [
      { value: 'studies', label: 'who studies' },
      { value: 'works_at', label: 'who works at' },
    ],
  },
  slot2ToFacet: {
    works_at: 'companies',
    studied: 'schools',
    studies: 'majors',
  },
}

export function getSlot2Options(slot1: Slot1Value, config: ChatQueryMadLibConfig) {
  return config.slot2BySlot1[slot1] ?? []
}

export function getSlot3OptionsFromFacets(
  slot2: Slot2Value,
  facets: { companies: string[]; majors: string[]; schools: string[] } | null
) {
  if (!facets) return []
  const key = CHAT_QUERY_CONFIG.slot2ToFacet[slot2]
  const values = facets[key] ?? []
  return values.map((v) => ({ value: v, label: v }))
}
