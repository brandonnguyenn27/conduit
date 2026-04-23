import { createServerFn } from '@tanstack/react-start'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import type { Slot2Value } from '@/components/app/chat-query-config'
import { fetchAuthQuery } from '@/lib/auth.server'

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
      cursor?: string | null
      numItems?: number
      profileType?: 'alumni' | 'member'
    }) => payload
  )
  .handler(async ({ data }) => {
    const cursor = data.cursor ?? null
    const numItems = data.numItems ?? 10
    const result = await fetchAuthQuery(api.functions.profiles.queries.searchProfilesPaginated, {
      organizationId: data.organizationId,
      searchQuery: data.searchQuery,
      slot2: data.slot2,
      searchKey: data.searchKey,
      ...(data.profileType ? { profileType: data.profileType } : {}),
      paginationOpts: {
        cursor,
        numItems,
      },
    })

    return {
      page: result.page,
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    }
  })
