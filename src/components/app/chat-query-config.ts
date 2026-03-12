export type Slot1Value = 'alumni' | 'member'
export type Slot2Value =
  | 'works_at'
  | 'worked_at'
  | 'works_as'
  | 'worked_as'
  | 'studied'
  | 'studies'
export type Slot3Value = string
export type FacetKey =
  | 'companies'
  | 'currentCompanies'
  | 'majors'
  | 'schools'
  | 'currentRoles'
  | 'pastRoles'

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
      { value: 'worked_at', label: 'who worked at' },
      { value: 'works_as', label: 'who work as' },
      { value: 'worked_as', label: 'who worked as' },
      { value: 'studied', label: 'who studied' },
    ],
    member: [
      { value: 'works_at', label: 'who works at' },
      { value: 'worked_at', label: 'who worked at' },
      { value: 'works_as', label: 'who work as' },
      { value: 'worked_as', label: 'who worked as' },
      { value: 'studies', label: 'who studies' },
    ],
  },
  slot2ToFacet: {
    works_at: 'currentCompanies',
    worked_at: 'companies',
    works_as: 'currentRoles',
    worked_as: 'pastRoles',
    studied: 'majors',
    studies: 'majors',
  },
}

export function getSlot2Options(slot1: Slot1Value, config: ChatQueryMadLibConfig) {
  return config.slot2BySlot1[slot1] ?? []
}

export function getFacetKeyForSlot2(slot2: Slot2Value): FacetKey {
  return CHAT_QUERY_CONFIG.slot2ToFacet[slot2]
}

export function mapFacetValuesToOptions(values: string[] | null | undefined) {
  if (!values) return []
  return values.map((value) => ({ value, label: value }))
}
