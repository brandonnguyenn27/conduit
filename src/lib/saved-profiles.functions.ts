import { createServerFn } from '@tanstack/react-start'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { fetchAuthQuery } from '@/lib/auth-server'

export const getSavedProfilesForViewerFn = createServerFn({ method: 'GET' })
  .inputValidator(
    (data: { organizationId: Id<'organizations'> }) => data
  )
  .handler(async ({ data }) => {
    try {
      const savedProfiles = await fetchAuthQuery(
        api.functions.savedProfiles.queries.listPopulatedByUserAndOrg,
        {
          organizationId: data.organizationId,
        }
      )

      return savedProfiles
    } catch (error) {
      console.error('Failed to fetch saved profiles', error)
      throw new Error('Failed to fetch saved profiles')
    }
  })
