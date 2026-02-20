import type { RawLinkedInProfile } from './types'

const MOCK_EDUCATION = [
  { schoolName: 'Test University', fieldOfStudy: 'Computer Science', degree: 'BS', startYear: 2015, endYear: 2019 },
]
const MOCK_EXPERIENCE = [
  { companyName: 'Test Corp', title: 'Software Engineer', start: { year: 2019 }, end: { year: 2023 } },
]

export function createMockProvider(): { fetchFullProfile: (username: string) => Promise<RawLinkedInProfile> } {
  return {
    fetchFullProfile: async (username: string): Promise<RawLinkedInProfile> => ({
      username,
      firstName: 'Test',
      lastName: `User ${username}`,
      headline: 'Engineer at Test Corp',
      summary: 'Mock profile for pipeline test',
      educations: MOCK_EDUCATION,
      experience: MOCK_EXPERIENCE,
      skills: ['Testing'],
    }),
  }
}
