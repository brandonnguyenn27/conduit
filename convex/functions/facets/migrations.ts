import { internalMutation } from '../../_generated/server'
import { v } from 'convex/values'
import { type FacetKey, ALL_FACET_KEYS, canonicalizeKey, extractFacetTokens } from './helpers'

/**
 * Backfill `organizationFacetValues` from existing profiles.
 * Run per-org. Safe to re-run (uses upsert-by-valueKey logic).
 *
 * Usage from dashboard or CLI:
 *   npx convex run functions/facets/migrations:backfillFacetValues '{"organizationId":"<id>"}'
 */
export const backfillFacetValues = internalMutation({
  args: {
    organizationId: v.id('organizations'),
    clearExisting: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    if (args.clearExisting) {
      const existing = await ctx.db
        .query('organizationFacetValues')
        .withIndex('by_org_facet_display', (q: any) =>
          q.eq('organizationId', args.organizationId)
        )
        .collect()
      for (const row of existing) {
        await ctx.db.delete(row._id)
      }
    }

    const profiles = await ctx.db
      .query('profiles')
      .withIndex('by_organization_linkedin', (q: any) =>
        q.eq('organizationId', args.organizationId)
      )
      .collect()

    const counts = new Map<string, { facet: FacetKey; displayValue: string; count: number }>()

    for (const profile of profiles) {
      const tokens = extractFacetTokens(profile)
      for (const facet of ALL_FACET_KEYS) {
        for (const value of tokens[facet]) {
          const key = `${facet}::${canonicalizeKey(value)}`
          const entry = counts.get(key)
          if (entry) {
            entry.count++
          } else {
            counts.set(key, { facet, displayValue: value.trim(), count: 1 })
          }
        }
      }
    }

    const now = Date.now()
    let inserted = 0
    let updated = 0

    for (const [compositeKey, { facet, displayValue, count }] of counts) {
      const valueKey = canonicalizeKey(displayValue)
      const existing = await ctx.db
        .query('organizationFacetValues')
        .withIndex('by_org_facet_valueKey', (q: any) =>
          q
            .eq('organizationId', args.organizationId)
            .eq('facet', facet)
            .eq('valueKey', valueKey)
        )
        .unique()

      if (existing) {
        if (existing.count !== count) {
          await ctx.db.patch(existing._id, { count, updatedAt: now })
          updated++
        }
      } else {
        await ctx.db.insert('organizationFacetValues', {
          organizationId: args.organizationId,
          facet,
          valueKey,
          displayValue,
          count,
          updatedAt: now,
        })
        inserted++
      }
    }

    return { profiles: profiles.length, inserted, updated }
  },
})
