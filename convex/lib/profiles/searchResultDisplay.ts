type DatePart = {
  year: number
  month?: number
  day?: number
}

type ExperienceEntry = {
  title: string
  companyName: string
  start?: DatePart
  end?: DatePart
}

type SearchResultDisplaySource = {
  headline: string
  currentCompany?: string
  experience: ExperienceEntry[]
  currentExperience?: { companyName: string; title: string }
  mostRecentTitle?: string
  mostRecentCompany?: string
}

function dateScore(datePart?: DatePart | null): number {
  if (!datePart) return -1
  return datePart.year * 10_000 + (datePart.month ?? 0) * 100 + (datePart.day ?? 0)
}

function getMostRecentExperience(experience: ExperienceEntry[]) {
  if (experience.length === 0) return undefined

  return [...experience].sort((a, b) => {
    const aIsCurrent = !a.end
    const bIsCurrent = !b.end
    if (aIsCurrent !== bIsCurrent) return aIsCurrent ? -1 : 1

    const endDelta = dateScore(b.end) - dateScore(a.end)
    if (endDelta !== 0) return endDelta

    return dateScore(b.start) - dateScore(a.start)
  })[0]
}

export function resolveSearchResultDisplayFields(profile: SearchResultDisplaySource) {
  const mostRecentExperience = getMostRecentExperience(profile.experience)
  const resolvedCurrentCompany =
    profile.currentExperience?.companyName?.trim() ||
    profile.currentCompany?.trim() ||
    profile.mostRecentCompany?.trim() ||
    mostRecentExperience?.companyName?.trim()

  const resolvedHeadline =
    profile.currentExperience?.title?.trim() ||
    profile.mostRecentTitle?.trim() ||
    mostRecentExperience?.title?.trim() ||
    resolvedCurrentCompany ||
    profile.headline

  return {
    headline: resolvedHeadline,
    currentCompany: resolvedCurrentCompany,
  }
}
