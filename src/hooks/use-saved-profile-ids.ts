import { useQuery } from 'convex/react'
import { useMemo } from 'react'

import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'

export function useSavedProfileIds(organizationId: Id<'organizations'> | null) {
  const savedProfileIds = useQuery(
    api.functions.savedProfiles.queries.listSavedProfileIdsByUserAndOrg,
    organizationId ? { organizationId } : 'skip'
  )

  const savedProfileIdSet = useMemo(() => {
    return new Set(savedProfileIds ?? [])
  }, [savedProfileIds])

  return {
    savedProfileIdSet,
    isLoading: !!organizationId && savedProfileIds === undefined,
  }
}
