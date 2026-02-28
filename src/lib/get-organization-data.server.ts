import { fetchAuthQuery } from '@/lib/auth-server'
import { api } from '@convex/_generated/api'

export async function getOrganizationData() {
  const user = await fetchAuthQuery(api.auth.getCurrentUser, {})
  if (!user) return null
  const appUser = await fetchAuthQuery(
    api.functions.appUsers.queries.getByBetterAuthUserId,
    { betterAuthUserId: user._id }
  )
  return { organizationId: appUser?.organizationId ?? null }
}
