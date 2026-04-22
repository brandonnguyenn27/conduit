import type { Id } from '../../_generated/dataModel'
import type { MutationCtx } from '../../_generated/server'
import { ALL_FACET_KEYS, canonicalizeKey, computeFacetDelta, type FacetKey } from './helpers'

async function incrementFacetValue(
  ctx: MutationCtx,
  organizationId: Id<'organizations'>,
  facet: FacetKey,
  displayValue: string
) {
  const key = canonicalizeKey(displayValue)
  if (!key) return
  const existing = await ctx.db
    .query('organizationFacetValues')
    .withIndex('by_org_facet_valueKey', (q) =>
      q.eq('organizationId', organizationId).eq('facet', facet).eq('valueKey', key)
    )
    .unique()
  if (existing) {
    await ctx.db.patch(existing._id, {
      count: existing.count + 1,
      updatedAt: Date.now(),
    })
    return
  }
  await ctx.db.insert('organizationFacetValues', {
    organizationId,
    facet,
    valueKey: key,
    displayValue: displayValue.trim(),
    count: 1,
    updatedAt: Date.now(),
  })
}

async function decrementFacetValue(
  ctx: MutationCtx,
  organizationId: Id<'organizations'>,
  facet: FacetKey,
  displayValue: string
) {
  const key = canonicalizeKey(displayValue)
  if (!key) return
  const existing = await ctx.db
    .query('organizationFacetValues')
    .withIndex('by_org_facet_valueKey', (q) =>
      q.eq('organizationId', organizationId).eq('facet', facet).eq('valueKey', key)
    )
    .unique()
  if (!existing) return
  if (existing.count <= 1) {
    await ctx.db.delete(existing._id)
    return
  }
  await ctx.db.patch(existing._id, {
    count: existing.count - 1,
    updatedAt: Date.now(),
  })
}

export async function applyProfileFacetChanges(
  ctx: MutationCtx,
  args: {
    organizationId: Id<'organizations'>
    oldTokens: Record<FacetKey, string[]>
    newTokens: Record<FacetKey, string[]>
  }
) {
  for (const facet of ALL_FACET_KEYS) {
    const { added, removed } = computeFacetDelta(args.oldTokens[facet], args.newTokens[facet])
    for (const value of removed) {
      await decrementFacetValue(ctx, args.organizationId, facet, value)
    }
    for (const value of added) {
      await incrementFacetValue(ctx, args.organizationId, facet, value)
    }
  }
}

