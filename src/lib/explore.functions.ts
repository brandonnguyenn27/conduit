import { createServerFn } from '@tanstack/react-start'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { fetchAuthQuery } from '@/lib/auth-server'

type ExploreFilters = {
  profileType?: 'alumni' | 'member'
  class?: string
  family?: string
}

export const getExploreProfilesFn = createServerFn({ method: 'GET' })
  .inputValidator(
    (data: {
      organizationId: Id<'organizations'>
      cursor?: string | null
      filters?: ExploreFilters
    }) => data
  )
  .handler(async ({ data }) => {
    try {
      const profiles = await fetchAuthQuery(
        api.functions.profiles.queries.listPaginatedForExplore,
        {
          organizationId: data.organizationId,
          paginationOpts: {
            numItems: 10,
            cursor: data.cursor ?? null,
          },
          filters: data.filters,
        }
      )

      return profiles
    } catch (error) {
      console.error('Failed to fetch explore profiles', error)
      throw new Error('Failed to fetch explore profiles')
    }
  })
