import type { Id } from '../../_generated/dataModel'
import { mutation } from '../../_generated/server'
import { v } from 'convex/values'

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
    const majorsRaw: string[] = []
    const schoolsRaw: string[] = []

    for (const p of profiles) {
      companiesRaw.push(...p.companies)
      if (p.currentCompany) companiesRaw.push(p.currentCompany)
      majorsRaw.push(...p.majors)
      schoolsRaw.push(...p.schools)
    }

    const companies = dedupeSort(companiesRaw)
    const majors = dedupeSort(majorsRaw)
    const schools = dedupeSort(schoolsRaw)

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
      majors,
      schools,
      updatedAt: now,
    }

    if (existing) {
      await ctx.db.patch(existing._id, doc)
    } else {
      await ctx.db.insert('organizationFacets', doc)
    }
  },
})
