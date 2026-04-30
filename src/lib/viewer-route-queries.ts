import type { Id } from '@convex/_generated/dataModel'

export const VIEWER_ROUTE_STALE_MS = 5 * 60 * 1000

export function savedProfilesQueryKey(
  organizationId: Id<'organizations'>,
  cursor: string | null | undefined,
) {
  return ['saved-profiles', organizationId, cursor ?? null] as const
}

export function myProfileQueryKey(organizationId: Id<'organizations'>) {
  return ['my-profile', organizationId] as const
}

export function savedProfilesQueryOptions<TData>(
  organizationId: Id<'organizations'>,
  cursor: string | null | undefined,
  queryFn: () => Promise<TData>,
) {
  return {
    queryKey: savedProfilesQueryKey(organizationId, cursor),
    queryFn,
    staleTime: VIEWER_ROUTE_STALE_MS,
  }
}

export function myProfileQueryOptions<TData>(
  organizationId: Id<'organizations'>,
  queryFn: () => Promise<TData>,
) {
  return {
    queryKey: myProfileQueryKey(organizationId),
    queryFn,
    staleTime: VIEWER_ROUTE_STALE_MS,
  }
}
