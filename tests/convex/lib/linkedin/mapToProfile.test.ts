import type { Id } from '../../../../convex/_generated/dataModel'
import { describe, it, expect } from 'vitest'
import type { RawLinkedInProfile } from '../../../../convex/lib/linkedin/types'
import { mapToProfile } from '../../../../convex/lib/linkedin/mapToProfile'

const orgId = 'test_org_123' as Id<'organizations'>

function minimalRaw(overrides: Partial<RawLinkedInProfile> = {}): RawLinkedInProfile {
  return {
    username: 'johndoe',
    firstName: 'John',
    lastName: 'Doe',
    headline: 'Engineer at Acme',
    educations: [],
    experience: [],
    skills: [],
    ...overrides,
  }
}

describe('mapToProfile', () => {
  it('builds linkedInUrl from username', () => {
    const out = mapToProfile(minimalRaw(), orgId)
    expect(out.linkedInUrl).toBe('https://www.linkedin.com/in/johndoe')
    expect(out.linkedInUsername).toBe('johndoe')
  })

  it('combines firstName and lastName', () => {
    const out = mapToProfile(minimalRaw({ firstName: 'Jane', lastName: 'Smith' }), orgId)
    expect(out.name).toBe('Jane Smith')
  })

  it('derives search arrays from education and experience', () => {
    const raw = minimalRaw({
      educations: [
        { schoolName: 'MIT', fieldOfStudy: 'CS', degree: 'BS', startYear: 2015, endYear: 2019 },
        { schoolName: 'MIT', fieldOfStudy: 'CS', degree: 'MS', startYear: 2019, endYear: 2020 },
      ],
      experience: [
        { companyName: 'Google', title: 'SWE' },
        { companyName: 'Google', title: 'Senior SWE' },
      ],
    })
    const out = mapToProfile(raw, orgId)
    expect(out.majors).toEqual(['CS'])
    expect(out.schools).toEqual(['MIT'])
    expect(out.companies).toEqual(['Google'])
    expect(out.jobTitles).toEqual(['SWE', 'Senior SWE'])
  })

  it('preserves education and experience for display', () => {
    const raw = minimalRaw({
      educations: [{ schoolName: 'Stanford', fieldOfStudy: 'EE', degree: 'BS' }],
      experience: [{ companyName: 'Meta', title: 'PM', start: { year: 2020 }, end: { year: 2023 } }],
    })
    const out = mapToProfile(raw, orgId)
    expect(out.education).toHaveLength(1)
    expect(out.education[0]).toMatchObject({ schoolName: 'Stanford', fieldOfStudy: 'EE', degree: 'BS' })
    expect(out.experience).toHaveLength(1)
    expect(out.experience[0]).toMatchObject({ companyName: 'Meta', title: 'PM' })
    expect(out.experience[0].start).toEqual({ year: 2020 })
    expect(out.experience[0].end).toEqual({ year: 2023 })
  })
})
