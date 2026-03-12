import { redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import type { Slot2Value } from '@/components/app/chat-query-config'
import { fetchAuthQuery } from '@/lib/auth-server'

export const getSearchRouteDataFn = createServerFn({ method: 'GET' }).handler(async () => {
  const { getOrganizationData } = await import('./get-organization-data.server')
  const data = await getOrganizationData()

  if (!data) {
    throw redirect({ to: '/login' })
  }

  return { organizationId: data.organizationId ?? null }
})

export const getProfileDetailForViewerFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (payload: { organizationId: Id<'organizations'>; profileId: Id<'profiles'> }) => payload
  )
  .handler(async ({ data }) => {
    return await fetchAuthQuery(api.functions.profiles.queries.getForViewer, {
      organizationId: data.organizationId,
      id: data.profileId,
    })
  })

export const searchProfilesForViewerFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (payload: {
      organizationId: Id<'organizations'>
      searchQuery: string
      slot2: Slot2Value
      searchKey: number
      limit: number
    }) => payload
  )
  .handler(async ({ data }) => {
    const result = await fetchAuthQuery(api.functions.profiles.queries.searchProfilesPaginated, {
      organizationId: data.organizationId,
      searchQuery: data.searchQuery,
      slot2: data.slot2,
      searchKey: data.searchKey,
      paginationOpts: {
        cursor: null,
        numItems: data.limit,
      },
    })

    return {
      page: result.page,
      isDone: result.isDone,
    }
  })
