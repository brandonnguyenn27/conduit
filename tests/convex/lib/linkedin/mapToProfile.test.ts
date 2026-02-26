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
    expect(out.searchText).toContain('John Doe')
    expect(out.searchText).toContain('Engineer at Acme')
    expect(out.searchText).toContain('MIT')
    expect(out.searchText).toContain('Google')
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

  it('derives current company from open-ended experiences', () => {
    const raw = minimalRaw({
      experience: [
        {
          companyName: 'Company A',
          title: 'Engineer',
          start: { year: 2020, month: 1 },
          end: { year: 2022, month: 12 },
        },
        {
          companyName: 'Company B',
          title: 'Senior Engineer',
          start: { year: 2023, month: 1 },
          end: { year: 0, month: 0, day: 0 },
        },
      ],
    })
    const out = mapToProfile(raw, orgId)
    expect(out.currentCompany).toBe('Company B')
  })

  it('falls back to most recent ended role when none are current', () => {
    const raw = minimalRaw({
      experience: [
        {
          companyName: 'Older Co',
          title: 'Analyst',
          start: { year: 2018, month: 1 },
          end: { year: 2020, month: 12 },
        },
        {
          companyName: 'Recent Co',
          title: 'Manager',
          start: { year: 2021, month: 1 },
          end: { year: 2024, month: 1 },
        },
      ],
    })
    const out = mapToProfile(raw, orgId)
    expect(out.currentCompany).toBe('Recent Co')
  })
})
