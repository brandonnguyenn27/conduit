export type Slot1Value = 'alumni' | 'member'
export type Slot2Value = 'works_at' | 'studied' | 'studies'
export type Slot3Value = string

export interface MadLibOption<T extends string = string> {
  value: T
  label: string
}

export interface ChatQueryMadLibConfig {
  slot1: MadLibOption<Slot1Value>[]
  slot2BySlot1: Record<Slot1Value, MadLibOption<Slot2Value>[]>
  slot3BySlot2: Record<Slot2Value, MadLibOption<Slot3Value>[]>
}

export const CHAT_QUERY_CONFIG: ChatQueryMadLibConfig = {
  slot1: [
    { value: 'alumni', label: 'alumni' },
    { value: 'member', label: 'members' },
  ],
  slot2BySlot1: {
    alumni: [
      { value: 'works_at', label: 'who works at' },
      { value: 'studied', label: 'who studied' },
    ],
    member: [
      { value: 'studies', label: 'who studies' },
      { value: 'works_at', label: 'who works at' },
    ],
  },
  slot3BySlot2: {
    works_at: [
      { value: 'google', label: 'Google' },
      { value: 'meta', label: 'Meta' },
      { value: 'apple', label: 'Apple' },
      { value: 'microsoft', label: 'Microsoft' },
      { value: 'custom_company', label: 'Enter company...' },
    ],
    studied: [
      { value: 'accounting', label: 'Accounting' },
      { value: 'engineering', label: 'Engineering' },
      { value: 'business', label: 'Business' },
      { value: 'computer_science', label: 'Computer Science' },
      { value: 'custom_major', label: 'Enter major...' },
    ],
    studies: [
      { value: 'accounting', label: 'Accounting' },
      { value: 'engineering', label: 'Engineering' },
      { value: 'business', label: 'Business' },
      { value: 'computer_science', label: 'Computer Science' },
      { value: 'custom_major', label: 'Enter major...' },
    ],
  },
}

export function getSlot2Options(slot1: Slot1Value, config: ChatQueryMadLibConfig) {
  return config.slot2BySlot1[slot1] ?? []
}

export function getSlot3Options(slot2: Slot2Value, config: ChatQueryMadLibConfig) {
  return config.slot3BySlot2[slot2] ?? []
}
