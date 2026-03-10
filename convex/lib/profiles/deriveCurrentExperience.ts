type DatePart = { year: number; month?: number; day?: number }
type StoredExperience = {
  companyName: string
  title: string
  start?: DatePart
  end?: DatePart
}

function dateScore(datePart?: DatePart | null): number {
  if (!datePart) return -1
  return datePart.year * 10_000 + (datePart.month ?? 0) * 100 + (datePart.day ?? 0)
}

function isCurrent(exp: StoredExperience): boolean {
  return !exp.end
}

export function deriveCurrentExperienceFromStored(
  experience: StoredExperience[]
): { currentExperience: StoredExperience } | null {
  const withCompany = experience
    .map((e) => ({ ...e, companyName: e.companyName.trim() }))
    .filter((e) => e.companyName.length > 0)
  if (withCompany.length === 0) return null

  const current = [...withCompany].filter(isCurrent)
  const sorted = current.length > 0 ? current : withCompany
  sorted.sort((a, b) => {
    if (current.length > 0) {
      return dateScore(b.start) - dateScore(a.start)
    }
    const endDelta = dateScore(b.end) - dateScore(a.end)
    if (endDelta !== 0) return endDelta
    return dateScore(b.start) - dateScore(a.start)
  })

  const exp = sorted[0]
  return { currentExperience: exp }
}
