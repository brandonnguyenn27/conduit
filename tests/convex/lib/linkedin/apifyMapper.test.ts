import type { Id } from '../../../../convex/_generated/dataModel'
import { describe, expect, it } from 'vitest'
import { mapToProfile } from '../../../../convex/lib/linkedin/mapToProfile'
import { mapApifyItemToRawProfile } from '../../../../convex/lib/linkedin/apify'

const orgId = 'test_org_apify' as Id<'organizations'>

const apifyExample = {
  publicIdentifier: 'brandonnguyenn27',
  linkedinUrl: 'https://www.linkedin.com/in/brandonnguyenn27',
  firstName: 'Brandon',
  lastName: 'Nguyen',
  headline: 'Incoming SDE @ Amazon Leo | Computer Science @ SJSU',
  about: 'About profile text',
  location: {
    linkedinText: 'San Francisco Bay Area',
    parsed: { text: 'San Francisco, CA, United States' },
  },
  profilePicture: {
    url: 'https://example.com/photo.jpg',
  },
  experience: [
    {
      companyName: 'Alpha Kappa Psi',
      position: 'Brotherhood Director',
      companyLinkedinUrl: 'https://www.linkedin.com/company/sjsuakpsi/',
      startDate: {
        month: 'Feb',
        year: 2026,
        text: 'Feb 2026',
      },
      endDate: {
        text: 'Present',
      },
    },
  ],
  education: [
    {
      schoolName: 'San José State University',
      degree: 'Bachelor of Science - BS',
      fieldOfStudy: 'Computer Science',
      startDate: {
        month: 'Aug',
        year: 2022,
        text: 'Aug 2022',
      },
      endDate: {
        month: 'May',
        year: 2026,
        text: 'May 2026',
      },
    },
  ],
  skills: [{ name: 'TypeScript' }, { name: 'React.js' }],
}

describe('mapApifyItemToRawProfile', () => {
  it('maps Apify profile payload to RawLinkedInProfile', () => {
    const raw = mapApifyItemToRawProfile(apifyExample)
    expect(raw).toMatchObject({
      username: 'brandonnguyenn27',
      firstName: 'Brandon',
      lastName: 'Nguyen',
      headline: 'Incoming SDE @ Amazon Leo | Computer Science @ SJSU',
      summary: 'About profile text',
      profilePicture: 'https://example.com/photo.jpg',
      location: 'San Francisco Bay Area',
      skills: ['TypeScript', 'React.js'],
    })
    expect(raw.experience).toHaveLength(1)
    expect(raw.experience[0]).toMatchObject({
      companyName: 'Alpha Kappa Psi',
      title: 'Brotherhood Director',
      companyUrl: 'https://www.linkedin.com/company/sjsuakpsi/',
      start: { year: 2026, month: 2 },
    })
    expect(raw.experience[0].end).toBeUndefined()
    expect(raw.educations).toHaveLength(1)
    expect(raw.educations[0]).toMatchObject({
      schoolName: 'San José State University',
      fieldOfStudy: 'Computer Science',
      degree: 'Bachelor of Science - BS',
      startYear: 2022,
      endYear: 2026,
    })
  })

  it('maps through mapToProfile without schema shape changes', () => {
    const raw = mapApifyItemToRawProfile(apifyExample)
    const profile = mapToProfile(raw, orgId)
    expect(profile.linkedInUsername).toBe('brandonnguyenn27')
    expect(profile.linkedInUrl).toBe('https://www.linkedin.com/in/brandonnguyenn27')
    expect(profile.name).toBe('Brandon Nguyen')
    expect(profile.currentCompany).toBe('Alpha Kappa Psi')
    expect(profile.education).toHaveLength(1)
    expect(profile.experience).toHaveLength(1)
    expect(profile.companies).toEqual(['Alpha Kappa Psi'])
    expect(profile.jobTitles).toEqual(['Brotherhood Director'])
    expect(profile.schools).toEqual(['San José State University'])
    expect(profile.majors).toEqual(['Computer Science'])
  })
})
