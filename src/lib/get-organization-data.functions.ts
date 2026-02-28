import { createServerFn } from '@tanstack/react-start'
import { redirect } from '@tanstack/react-router'

// TODO: Explore optimizations - caching, request deduplication, or infrastructure
// changes to reduce load on auth/org fetches when navigating across home routes.

export const getOrganizationDataFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { getOrganizationData } = await import(
      './get-organization-data.server'
    )
    const data = await getOrganizationData()
    if (!data) {
      throw redirect({ to: '/demo/better-auth' })
    }
    return data
  }
)
