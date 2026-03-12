import { describe, expect, it } from 'vitest'

import {
  CHAT_QUERY_CONFIG,
  getFacetKeyForSlot2,
  getSlot2Options,
  mapFacetValuesToOptions,
} from '../../../../src/components/app/chat-query-config'

describe('chat-query-config roles support', () => {
  it('includes role-based second slot options', () => {
    const alumniOptions = getSlot2Options('alumni', CHAT_QUERY_CONFIG).map((option) => option.value)
    const memberOptions = getSlot2Options('member', CHAT_QUERY_CONFIG).map((option) => option.value)

    expect(alumniOptions).toContain('works_as')
    expect(alumniOptions).toContain('worked_as')
    expect(memberOptions).toContain('works_as')
    expect(memberOptions).toContain('worked_as')
  })

  it('maps role slot to facet key and options', () => {
    const key = getFacetKeyForSlot2('works_as')
    expect(key).toBe('currentRoles')

    const options = mapFacetValuesToOptions(['Software Engineer', 'Product Manager'])
    expect(options).toEqual([
      { value: 'Software Engineer', label: 'Software Engineer' },
      { value: 'Product Manager', label: 'Product Manager' },
    ])

    const pastKey = getFacetKeyForSlot2('worked_as')
    expect(pastKey).toBe('pastRoles')

    const pastOptions = mapFacetValuesToOptions(['Analyst'])
    expect(pastOptions).toEqual([{ value: 'Analyst', label: 'Analyst' }])
  })
})
