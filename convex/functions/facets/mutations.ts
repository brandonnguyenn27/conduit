import type { Id } from '../../_generated/dataModel'
import { internalMutation } from '../../_generated/server'
import { v } from 'convex/values'
import {
  type FacetKey,
  ALL_FACET_KEYS,
  extractFacetTokens,
} from './helpers'
import { applyProfileFacetChanges as applyProfileFacetChangesImpl } from './apply'

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
    await applyProfileFacetChangesImpl(ctx, {
      organizationId: args.organizationId,
      oldTokens: args.oldTokens,
      newTokens: args.newTokens,
    })
  },
})
