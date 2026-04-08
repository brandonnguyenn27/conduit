import { query, type QueryCtx } from '../../_generated/server'
import { v } from 'convex/values'
import { paginationOptsValidator, paginationResultValidator } from 'convex/server'
import { authComponent } from '../../auth'
import { slugifySearchToken } from '../../lib/search/slug'
import { normalizeRoleExact, splitJobTitlesByTenure, toRoleSearchQuery } from './helpers'
import type { Id } from '../../_generated/dataModel'

const ROLE_EXACT_RESULTS_THRESHOLD = 10
const ROLE_SUGGESTED_RESULTS_CAP = 5

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

export const suggestProfiles = query({
  args: {
    organizationId: v.id('organizations'),
    searchText: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireOrganizationMembership(ctx, args.organizationId)

    const q = args.searchText.trim().toLowerCase()
    if (!q) return []
    const limit = Math.max(1, Math.min(args.limit ?? 10, 50))

    const results = await ctx.db
      .query('profiles')
      .withSearchIndex('by_suggest_search', (search) =>
        search.search('suggestSearchText', q).eq('organizationId', args.organizationId)
      )
      .take(limit)

    return results.map((profile) => ({
      _id: profile._id,
      name: profile.name,
      headline: profile.headline,
      currentCompany: profile.currentCompany,
      linkedInUrl: profile.linkedInUrl,
      profileImageUrl: profile.profileImageUrl,
    }))
  },
})

const slot2SearchValidator = v.union(
  v.literal('works_at'),
  v.literal('worked_at'),
  v.literal('works_as'),
  v.literal('worked_as'),
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
    profileType: v.optional(v.union(v.literal('alumni'), v.literal('member'))),
  },
  returns: paginationResultValidator(
    v.object({
      _id: v.id('profiles'),
      name: v.string(),
      headline: v.string(),
      currentCompany: v.optional(v.string()),
      linkedInUrl: v.string(),
      matchType: v.union(v.literal('exact'), v.literal('suggested')),
    })
  ),
  handler: async (ctx, args) => {
    await requireOrganizationMembership(ctx, args.organizationId)

    const queryText = args.searchQuery.trim()
    if (!queryText) {
      throw new Error('Search query is required')
    }

    const roleQuery =
      args.slot2 === 'works_as' || args.slot2 === 'worked_as'
        ? toRoleSearchQuery(queryText)
        : ''
    const searchSlug =
      args.slot2 === 'works_as' || args.slot2 === 'worked_as'
        ? roleQuery
        : slugifySearchToken(queryText)
    const safeSearchSlug = searchSlug || '__no_match__'

    const isWorksAt = args.slot2 === 'works_at'
    const isWorkedAt = args.slot2 === 'worked_at'
    const isWorksAs = args.slot2 === 'works_as'
    const isWorkedAs = args.slot2 === 'worked_as'
    const searchIndex = isWorksAt
      ? 'by_current_company_slug_search'
      : isWorkedAt
        ? 'by_companies_slug_search'
        : isWorksAs
          ? 'by_current_job_titles_slug_search'
          : isWorkedAs
            ? 'by_past_job_titles_slug_search'
        : 'by_education_slug_search'
    const searchField = isWorksAt
      ? 'currentCompanySlug'
      : isWorkedAt
        ? 'companiesSearchSlug'
        : isWorksAs
          ? 'currentJobTitlesSearchSlug'
          : isWorkedAs
            ? 'pastJobTitlesSearchSlug'
        : 'educationSearchSlug'

    const result = await ctx.db
      .query('profiles')
      .withSearchIndex(searchIndex, (search) => {
        let chain = search
          .search(searchField, safeSearchSlug)
          .eq('organizationId', args.organizationId)
        if (args.profileType) {
          chain = chain.eq('profileType', args.profileType)
        }
        return chain
      })
      .paginate(args.paginationOpts)

    const roleExactQuery = normalizeRoleExact(queryText)
    const finalPage = (isWorksAs || isWorkedAs)
      ? (() => {
          const exact: (typeof result.page)[number][] = []
          const suggested: (typeof result.page)[number][] = []
          for (const profile of result.page) {
            const roleTenure = splitJobTitlesByTenure(profile.experience)
            const titles = isWorksAs ? roleTenure.current : roleTenure.past
            const isExact = titles.some((title) => normalizeRoleExact(title) === roleExactQuery)
            if (isExact) {
              exact.push(profile)
            } else {
              suggested.push(profile)
            }
          }
          const shouldIncludeSuggested = exact.length < ROLE_EXACT_RESULTS_THRESHOLD
          const suggestedLimited = shouldIncludeSuggested
            ? suggested.slice(0, ROLE_SUGGESTED_RESULTS_CAP)
            : []
          return { exact, suggested: suggestedLimited, ordered: [...exact, ...suggestedLimited] }
        })()
      : { exact: result.page, suggested: [] as (typeof result.page)[number][], ordered: result.page }

    const suggestedIds = new Set(finalPage.suggested.map((profile) => profile._id))
    return {
      ...result,
      page: finalPage.ordered.map((profile) => {
        const headline = profile.currentExperience?.title || ''
        const currentCompany = profile.currentExperience?.companyName || profile.currentCompany
        const matchType: 'exact' | 'suggested' = suggestedIds.has(profile._id)
          ? 'suggested'
          : 'exact'

        return {
          _id: profile._id,
          name: profile.name,
          headline,
          currentCompany,
          linkedInUrl: profile.linkedInUrl,
          matchType,
        }
      }),
    }
  },
})

export const getMyProfile = query({
  args: {
    organizationId: v.id('organizations'),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx)
    if (!user) {
      throw new Error('Unauthorized')
    }

    const appUser = await ctx.db
      .query('appUsers')
      .withIndex('by_better_auth_user', (q) => q.eq('betterAuthUserId', user._id))
      .unique()

    if (!appUser || appUser.organizationId !== args.organizationId) {
      throw new Error('Forbidden')
    }

    if (!appUser.profileId) {
      return null
    }

    const profile = await ctx.db.get(appUser.profileId)
    if (!profile || profile.organizationId !== args.organizationId) {
      return null
    }

    return profile
  },
})

export const listPaginatedForExplore = query({
  args: {
    organizationId: v.id('organizations'),
    paginationOpts: paginationOptsValidator,
    filters: v.optional(
      v.object({
        profileType: v.optional(v.union(v.literal('alumni'), v.literal('member'))),
        class: v.optional(v.string()),
        family: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx)
    if (!user) {
      throw new Error('Unauthorized')
    }

    // Look up appUser only to get profileId for excluding current user
    const appUser = await ctx.db
      .query('appUsers')
      .withIndex('by_better_auth_user', (q) => q.eq('betterAuthUserId', user._id))
      .unique()

    const filters = args.filters
    const currentUserProfileId = appUser?.profileId

    let profileQuery = ctx.db
      .query('profiles')
      .withIndex('by_organization_linkedin', (q) =>
        q.eq('organizationId', args.organizationId)
      )

    if (currentUserProfileId) {
      profileQuery = profileQuery.filter((q) =>
        q.neq(q.field('_id'), currentUserProfileId)
      )
    }

    if (filters?.profileType) {
      profileQuery = profileQuery.filter((q) =>
        q.eq(q.field('profileType'), filters.profileType)
      )
    }
    if (filters?.class) {
      profileQuery = profileQuery.filter((q) => q.eq(q.field('class'), filters.class))
    }
    if (filters?.family) {
      profileQuery = profileQuery.filter((q) => q.eq(q.field('family'), filters.family))
    }

    const result = await profileQuery.order('desc').paginate(args.paginationOpts)

    return {
      ...result,
      page: result.page.map((profile) => ({
        _id: profile._id,
        name: profile.name,
        headline: profile.currentExperience?.title || '',
        currentCompany: profile.currentExperience?.companyName || profile.currentCompany,
        linkedInUrl: profile.linkedInUrl,
        industry: profile.industry,
        major: profile.majors[0],
        profileType: profile.profileType,
        class: profile.class,
        family: profile.family,
      })),
    }
  },
})
