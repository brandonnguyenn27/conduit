import { query, type QueryCtx } from '../../_generated/server'
import { v } from 'convex/values'
import { paginationOptsValidator, paginationResultValidator } from 'convex/server'
import { authComponent } from '../../auth'
import { resolveSearchResultDisplayFields } from '../../lib/profiles/searchResultDisplay'
import { slugifySearchToken } from '../../lib/search/slug'
import type { Id } from '../../_generated/dataModel'

export const listByOrganization = query({
  args: { organizationId: v.id('organizations') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('profiles')
      .withIndex('by_organization_linkedin', (q) =>
        q.eq('organizationId', args.organizationId)
      )
      .collect()
  },
})

export const get = query({
  args: { id: v.id('profiles') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id)
  },
})

async function requireOrganizationMembership(
  ctx: QueryCtx,
  organizationId: Id<'organizations'>
) {
  const user = await authComponent.safeGetAuthUser(ctx)
  if (!user) {
    throw new Error('Unauthorized')
  }

  const appUser = await ctx.db
    .query('appUsers')
    .withIndex('by_better_auth_user', (q) => q.eq('betterAuthUserId', user._id))
    .unique()

  if (!appUser || appUser.organizationId !== organizationId) {
    throw new Error('Forbidden')
  }
}

export const getForViewer = query({
  args: {
    organizationId: v.id('organizations'),
    id: v.id('profiles'),
  },
  handler: async (ctx, args) => {
    await requireOrganizationMembership(ctx, args.organizationId)

    const profile = await ctx.db.get(args.id)
    if (!profile || profile.organizationId !== args.organizationId) {
      return null
    }

    return profile
  },
})

export const getByOrganizationAndLinkedIn = query({
  args: {
    organizationId: v.id('organizations'),
    linkedInUrl: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('profiles')
      .withIndex('by_organization_linkedin', (q) =>
        q.eq('organizationId', args.organizationId).eq('linkedInUrl', args.linkedInUrl)
      )
      .unique()
  },
})

export const getClaimedByUser = query({
  args: {
    organizationId: v.id('organizations'),
    claimedByUserId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('profiles')
      .withIndex('by_organization_claimed', (q) =>
        q.eq('organizationId', args.organizationId).eq('claimedByUserId', args.claimedByUserId)
      )
      .unique()
  },
})

export const searchByText = query({
  args: {
    organizationId: v.id('organizations'),
    searchText: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const q = args.searchText.trim()
    if (!q) return []
    const limit = Math.max(1, Math.min(args.limit ?? 25, 100))
    return await ctx.db
      .query('profiles')
      .withSearchIndex('by_search_text', (search) =>
        search.search('searchText', q).eq('organizationId', args.organizationId)
      )
      .take(limit)
  },
})

const slot2SearchValidator = v.union(
  v.literal('works_at'),
  v.literal('worked_at'),
  v.literal('studied'),
  v.literal('studies')
)

export const searchProfilesPaginated = query({
  args: {
    organizationId: v.id('organizations'),
    searchQuery: v.string(),
    slot2: slot2SearchValidator,
    paginationOpts: paginationOptsValidator,
    searchKey: v.optional(v.number()),
  },
  returns: paginationResultValidator(
    v.object({
      _id: v.id('profiles'),
      name: v.string(),
      headline: v.string(),
      currentCompany: v.optional(v.string()),
      linkedInUrl: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    await requireOrganizationMembership(ctx, args.organizationId)

    const queryText = args.searchQuery.trim()
    if (!queryText) {
      throw new Error('Search query is required')
    }

    const searchSlug = slugifySearchToken(queryText)
    const safeSearchSlug = searchSlug || '__no_match__'

    const isWorksAt = args.slot2 === 'works_at'
    const isWorkedAt = args.slot2 === 'worked_at'
    const searchIndex = isWorksAt
      ? 'by_current_company_slug_search'
      : isWorkedAt
        ? 'by_companies_slug_search'
        : 'by_education_slug_search'
    const searchField = isWorksAt
      ? 'currentCompanySlug'
      : isWorkedAt
        ? 'companiesSearchSlug'
        : 'educationSearchSlug'

    const result = await ctx.db
      .query('profiles')
      .withSearchIndex(searchIndex, (search) =>
        search.search(searchField, safeSearchSlug).eq('organizationId', args.organizationId)
      )
      .paginate(args.paginationOpts)

    return {
      ...result,
      page: result.page.map((profile) => {
        const { headline, currentCompany } = resolveSearchResultDisplayFields(profile)

        return {
          _id: profile._id,
          name: profile.name,
          headline,
          currentCompany,
          linkedInUrl: profile.linkedInUrl,
        }
      }),
    }
  },
})
