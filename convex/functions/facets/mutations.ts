import type { Id } from '../../_generated/dataModel'
import { internalMutation } from '../../_generated/server'
import { v } from 'convex/values'
import {
  type FacetKey,
  ALL_FACET_KEYS,
  canonicalizeKey,
  computeFacetDelta,
  extractFacetTokens,
} from './helpers'

const facetKeyValidator = v.union(
  v.literal('companies'),
  v.literal('currentCompanies'),
  v.literal('majors'),
  v.literal('schools'),
  v.literal('currentRoles'),
  v.literal('pastRoles'),
  v.literal('classes'),
  v.literal('families')
)

async function incrementFacetValue(
  ctx: { db: any },
  organizationId: Id<'organizations'>,
  facet: FacetKey,
  displayValue: string
) {
  const key = canonicalizeKey(displayValue)
  if (!key) return
  const existing = await ctx.db
    .query('organizationFacetValues')
    .withIndex('by_org_facet_valueKey', (q: any) =>
      q.eq('organizationId', organizationId).eq('facet', facet).eq('valueKey', key)
    )
    .unique()
  if (existing) {
    await ctx.db.patch(existing._id, {
      count: existing.count + 1,
      updatedAt: Date.now(),
    })
  } else {
    await ctx.db.insert('organizationFacetValues', {
      organizationId,
      facet,
      valueKey: key,
      displayValue: displayValue.trim(),
      count: 1,
      updatedAt: Date.now(),
    })
  }
}

async function decrementFacetValue(
  ctx: { db: any },
  organizationId: Id<'organizations'>,
  facet: FacetKey,
  displayValue: string
) {
  const key = canonicalizeKey(displayValue)
  if (!key) return
  const existing = await ctx.db
    .query('organizationFacetValues')
    .withIndex('by_org_facet_valueKey', (q: any) =>
      q.eq('organizationId', organizationId).eq('facet', facet).eq('valueKey', key)
    )
    .unique()
  if (!existing) return
  if (existing.count <= 1) {
    await ctx.db.delete(existing._id)
  } else {
    await ctx.db.patch(existing._id, {
      count: existing.count - 1,
      updatedAt: Date.now(),
    })
  }
}

/**
 * Apply facet changes for a single profile create/update/delete.
 * Pass empty arrays for oldTokens on create, empty for newTokens on delete.
 */
export const applyProfileFacetChanges = internalMutation({
  args: {
    organizationId: v.id('organizations'),
    oldTokens: v.object({
      companies: v.array(v.string()),
      currentCompanies: v.array(v.string()),
      majors: v.array(v.string()),
      schools: v.array(v.string()),
      currentRoles: v.array(v.string()),
      pastRoles: v.array(v.string()),
      classes: v.array(v.string()),
      families: v.array(v.string()),
    }),
    newTokens: v.object({
      companies: v.array(v.string()),
      currentCompanies: v.array(v.string()),
      majors: v.array(v.string()),
      schools: v.array(v.string()),
      currentRoles: v.array(v.string()),
      pastRoles: v.array(v.string()),
      classes: v.array(v.string()),
      families: v.array(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    for (const facet of ALL_FACET_KEYS) {
      const { added, removed } = computeFacetDelta(
        args.oldTokens[facet],
        args.newTokens[facet]
      )
      for (const value of removed) {
        await decrementFacetValue(ctx, args.organizationId, facet, value)
      }
      for (const value of added) {
        await incrementFacetValue(ctx, args.organizationId, facet, value)
      }
    }
  },
})
