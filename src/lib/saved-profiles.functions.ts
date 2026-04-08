import { createServerFn } from '@tanstack/react-start'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { fetchAuthQuery } from '@/lib/auth.server'

export const getSavedProfilesForViewerFn = createServerFn({ method: 'GET' })
  .inputValidator(
    (data: { organizationId: Id<'organizations'>; cursor?: string | null }) => data
  )
  .handler(async ({ data }) => {
    try {
      const savedProfiles = await fetchAuthQuery(
        api.functions.savedProfiles.queries.listPopulatedByUserAndOrg,
        {
          organizationId: data.organizationId,
          paginationOpts: {
            numItems: 10,
            cursor: data.cursor ?? null,
          },
        }
      )

      return savedProfiles
    } catch (error) {
      console.error('Failed to fetch saved profiles', error)
      throw new Error('Failed to fetch saved profiles')
    }
  })
