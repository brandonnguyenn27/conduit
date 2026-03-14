import type { Slot2Value } from '@/components/app/chat-query-config'

export function normalizeSearchValue(slot2: Slot2Value, value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (slot2 !== 'works_as' && slot2 !== 'worked_as') return trimmed
  return trimmed.replace(/\s+/g, ' ')
}
