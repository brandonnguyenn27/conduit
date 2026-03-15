export type DatePart = {
  year: number
  month?: number
}

export type ExperienceEntry = {
  companyName: string
  title: string
  start?: DatePart
  end?: DatePart
  location?: string
  employmentType?: string
}

export type GroupedExperience = {
  companyName: string
  roles: ExperienceEntry[]
}

export function groupExperiencesByCompany(
  experiences: ExperienceEntry[]
): GroupedExperience[] {
  if (!experiences || experiences.length === 0) return []

  const grouped: GroupedExperience[] = []
  let currentGroup: GroupedExperience | null = null

  for (const exp of experiences) {
    if (currentGroup && currentGroup.companyName === exp.companyName) {
      currentGroup.roles.push(exp)
    } else {
      currentGroup = {
        companyName: exp.companyName,
        roles: [exp],
      }
      grouped.push(currentGroup)
    }
  }

  return grouped
}
