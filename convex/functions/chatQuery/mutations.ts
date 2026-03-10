import type { Id } from '../../_generated/dataModel'
import { mutation } from '../../_generated/server'
import { v } from 'convex/values'
import { deriveCurrentExperienceFromStored } from '../../lib/profiles/deriveCurrentExperience'
import { splitJobTitlesByTenure } from '../profiles/helpers'

function dedupeSort(values: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const v of values) {
    const trimmed = v.trim()
    if (!trimmed) continue
    const key = trimmed.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(trimmed)
  }
  out.sort((a, b) => a.localeCompare(b))
  return out
}

export const rebuildOrganizationFacets = mutation({
  args: { organizationId: v.id('organizations') },
  handler: async (ctx, args) => {
    const profiles = await ctx.db
      .query('profiles')
      .withIndex('by_organization_linkedin', (q) =>
        q.eq('organizationId', args.organizationId)
      )
      .collect()

    const companiesRaw: string[] = []
    const currentCompaniesRaw: string[] = []
    const majorsRaw: string[] = []
    const schoolsRaw: string[] = []
    const currentRolesRaw: string[] = []
    const pastRolesRaw: string[] = []

    for (const p of profiles) {
      companiesRaw.push(...p.companies)
      if (p.currentCompany) companiesRaw.push(p.currentCompany)

      let currentCo =
        p.currentExperience?.companyName?.trim() || p.currentCompany?.trim()
      if (!currentCo) {
        const derived = deriveCurrentExperienceFromStored(p.experience)
        currentCo = derived?.currentExperience.companyName?.trim()
      }
      if (currentCo) currentCompaniesRaw.push(currentCo)

      majorsRaw.push(...p.majors)
      schoolsRaw.push(...p.schools)
      const roleTenure = splitJobTitlesByTenure(p.experience)
      currentRolesRaw.push(...roleTenure.current)
      pastRolesRaw.push(...roleTenure.past)
    }

    const companies = dedupeSort(companiesRaw)
    const currentCompanies = dedupeSort(currentCompaniesRaw)
    const majors = dedupeSort(majorsRaw)
    const schools = dedupeSort(schoolsRaw)
    const currentRoles = dedupeSort(currentRolesRaw)
    const pastRoles = dedupeSort(pastRolesRaw)

    const existing = await ctx.db
      .query('organizationFacets')
      .withIndex('by_organization', (q) =>
        q.eq('organizationId', args.organizationId)
      )
      .unique()

    const now = Date.now()
    const doc = {
      organizationId: args.organizationId,
      companies,
      currentCompanies,
      majors,
      schools,
      currentRoles,
      pastRoles,
      updatedAt: now,
    }

    if (existing) {
      await ctx.db.patch(existing._id, doc)
    } else {
      await ctx.db.insert('organizationFacets', doc)
    }
  },
})
