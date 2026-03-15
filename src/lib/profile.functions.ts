import { createServerFn } from '@tanstack/react-start'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { fetchAuthQuery } from '@/lib/auth-server'

export const getMyProfileFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { organizationId: Id<'organizations'> }) => data)
  .handler(async ({ data }) => {
    try {
      const profile = await fetchAuthQuery(
        api.functions.profiles.queries.getMyProfile,
        {
          organizationId: data.organizationId,
        }
      )
      return profile
    } catch (error) {
      console.error('Failed to fetch my profile', error)
      throw new Error('Failed to fetch profile')
    }
  })
