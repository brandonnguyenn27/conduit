import { useQuery } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import type { Id } from '@convex/_generated/dataModel'

import { ProfileDetailDrawer } from '@/components/app/ProfileDetailDrawer'
import { getProfileDetailForViewerFn } from '@/lib/search.functions'

interface SelectedProfileDetailDrawerProps {
  organizationId: Id<'organizations'>
  selectedProfileId: Id<'profiles'>
  open: boolean
  onOpenChange: (nextOpen: boolean) => void
}

export function SelectedProfileDetailDrawer({
  organizationId,
  selectedProfileId,
  open,
  onOpenChange,
}: SelectedProfileDetailDrawerProps) {
  const getProfileDetailForViewer = useServerFn(getProfileDetailForViewerFn)
  const selectedProfileQuery = useQuery({
    queryKey: ['profile-detail', organizationId, selectedProfileId],
    staleTime: Infinity,
    gcTime: 1000 * 60 * 30,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    queryFn: async () =>
      await getProfileDetailForViewer({
        data: {
          organizationId,
          profileId: selectedProfileId,
        },
      }),
  })

  return (
    <ProfileDetailDrawer
      open={open}
      onOpenChange={onOpenChange}
      profile={selectedProfileQuery.data ?? undefined}
      isLoading={selectedProfileQuery.isLoading}
    />
  )
}
