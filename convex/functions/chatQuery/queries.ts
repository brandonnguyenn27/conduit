import { query } from '../../_generated/server'
import { v } from 'convex/values'

export const getChatQueryOptions = query({
  args: { organizationId: v.id('organizations') },
  handler: async (ctx, args) => {
    const doc = await ctx.db
      .query('organizationFacets')
      .withIndex('by_organization', (q) =>
        q.eq('organizationId', args.organizationId)
      )
      .unique()
    if (!doc) return null
    return {
      companies: doc.companies,
      majors: doc.majors,
      schools: doc.schools,
    }
  },
})
