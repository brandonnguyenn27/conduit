import { describe, expect, it } from 'vitest'

import {
  CHAT_QUERY_CONFIG,
  getSlot2Options,
  getSlot3OptionsFromFacets,
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

  it('maps role slot to roles facet values', () => {
    const facets = {
      companies: ['Acme'],
      currentCompanies: ['Acme'],
      majors: ['Computer Science'],
      schools: ['MIT'],
      currentRoles: ['Software Engineer', 'Product Manager'],
      pastRoles: ['Analyst'],
    }

    const options = getSlot3OptionsFromFacets('works_as', facets)
    expect(options).toEqual([
      { value: 'Software Engineer', label: 'Software Engineer' },
      { value: 'Product Manager', label: 'Product Manager' },
    ])

    const pastOptions = getSlot3OptionsFromFacets('worked_as', facets)
    expect(pastOptions).toEqual([{ value: 'Analyst', label: 'Analyst' }])
  })
})
