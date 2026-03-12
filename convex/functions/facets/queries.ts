import { query } from '../../_generated/server'
import { v } from 'convex/values'

const facetKeyValidator = v.union(
  v.literal('companies'),
  v.literal('currentCompanies'),
  v.literal('majors'),
  v.literal('schools'),
  v.literal('currentRoles'),
  v.literal('pastRoles')
)

const DEFAULT_PAGE_SIZE = 200

export const getFacetPage = query({
  args: {
    organizationId: v.id('organizations'),
    facet: facetKeyValidator,
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? DEFAULT_PAGE_SIZE, 500)
    let q = ctx.db
      .query('organizationFacetValues')
      .withIndex('by_org_facet_display', (idx: any) => {
        let chain = idx
          .eq('organizationId', args.organizationId)
          .eq('facet', args.facet)
        if (args.cursor) {
          chain = chain.gt('displayValue', args.cursor)
        }
        return chain
      })
      .order('asc')

    const rows = await q.take(limit + 1)
    const hasMore = rows.length > limit
    const page = hasMore ? rows.slice(0, limit) : rows
    return {
      items: page.map((r: any) => r.displayValue as string),
      nextCursor: hasMore ? page[page.length - 1].displayValue : undefined,
    }
  },
})

export const searchFacet = query({
  args: {
    organizationId: v.id('organizations'),
    facet: facetKeyValidator,
    q: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 50, 200)
    if (!args.q.trim()) return []
    const results = await ctx.db
      .query('organizationFacetValues')
      .withSearchIndex('by_facet_search', (s: any) =>
        s
          .search('displayValue', args.q)
          .eq('organizationId', args.organizationId)
          .eq('facet', args.facet)
      )
      .take(limit)
    return results.map((r: any) => r.displayValue as string)
  },
})
