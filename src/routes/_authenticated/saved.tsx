import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState, useTransition } from 'react'

import { ProfileDetailDrawer } from '@/components/app/ProfileDetailDrawer'
import { ProfileTable } from '@/components/app/ProfileTable'
import { SelectedProfileDetailDrawer } from '@/components/home/search/SelectedProfileDetailDrawer'
import { AuroraText } from '@/components/ui/aurora-text'
import { DotPattern } from '@/components/ui/dot-pattern'
import { Skeleton } from '@/components/ui/skeleton'
import type { Id } from '@convex/_generated/dataModel'
import { useOrganization } from '@/contexts/OrganizationContext'
import { ensureOrganizationData } from '@/lib/get-organization-data.functions'
import { getSavedProfilesForViewerFn } from '@/lib/saved-profiles.functions'
import { useCursorPagination } from '@/lib/use-cursor-pagination'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_authenticated/saved')({
  loader: async ({ context }) => {
    const { organizationId } = await ensureOrganizationData(context.queryClient)
    if (!organizationId) return

    await context.queryClient.prefetchQuery({
      queryKey: ['saved-profiles', organizationId, null],
      queryFn: async () =>
        await getSavedProfilesForViewerFn({
          data: { organizationId, cursor: null },
        }),
      staleTime: 5 * 60 * 1000,
    })
  },
  pendingComponent: SavedPageSkeleton,
  component: SavedPage,
})

function SavedPageSkeleton() {
  return (
    <div className="relative min-h-[70vh] w-full overflow-hidden">
      <DotPattern
        width={32}
        height={32}
        cx={1}
        cy={1}
        cr={1.5}
        className={cn(
          'mask-[radial-gradient(800px_circle_at_center,white,transparent)]'
        )}
      />
      <div className="relative z-10 flex min-h-[70vh] flex-col items-center justify-start gap-8 py-10">
        <h1 className="text-4xl font-bold tracking-tighter md:text-5xl lg:text-7xl">
          <AuroraText
            className="font-(family-name:--font-editorial)"
            colors={['#0a0a0a', '#374151', '#0070F3', '#6b7280']}
          >
            Saved Profiles
          </AuroraText>
        </h1>
        <div className="w-full max-w-6xl space-y-4 px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-[880px] w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}

function SavedPage() {
  const organizationId = useOrganization()
  const getSavedProfiles = useServerFn(getSavedProfilesForViewerFn)
  const [selectedProfileId, setSelectedProfileId] = useState<Id<'profiles'> | null>(
    null
  )
  const [isPending, startTransition] = useTransition()

  const { cursors, pageIndex, currentCursor, nextPage, prevPage, selectPage } =
    useCursorPagination()

  if (!organizationId) {
    return <SavedPageSkeleton />
  }

  const {
    data: paginatedProfiles,
    refetch,
    isFetching,
  } = useSuspenseQuery({
    queryKey: ['saved-profiles', organizationId, currentCursor],
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    queryFn: async () =>
      await getSavedProfiles({
        data: { organizationId, cursor: currentCursor },
      }),
  })

  const handleNextPage = () => {
    startTransition(() => nextPage(paginatedProfiles))
  }

  const handlePrevPage = () => {
    startTransition(prevPage)
  }

  const handlePageSelect = (targetPageIndex: number) => {
    // Only allow selecting pages we already have cursors for
    startTransition(() => selectPage(targetPageIndex))
  }

  return (
    <div className="relative min-h-[70vh] w-full overflow-hidden">
      <DotPattern
        width={32}
        height={32}
        cx={1}
        cy={1}
        cr={1.5}
        className={cn(
          'mask-[radial-gradient(800px_circle_at_center,white,transparent)]'
        )}
      />

      <div className="relative z-10 flex min-h-[70vh] flex-col items-center justify-start gap-8 py-10">
        <h1 className="text-4xl font-bold tracking-tighter md:text-5xl lg:text-7xl">
          <AuroraText
            className="font-(family-name:--font-editorial)"
            colors={['#0a0a0a', '#374151', '#0070F3', '#6b7280']}
          >
            Saved Profiles
          </AuroraText>
        </h1>

        <div className="w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <ProfileTable
            title="Your Favorites"
            profiles={paginatedProfiles?.page ?? []}
            isLoading={false}
            emptyMessage="You haven't saved any profiles yet."
            onRefresh={refetch}
            isRefreshing={isFetching || isPending}
            onProfileClick={(id) => setSelectedProfileId(id as Id<'profiles'>)}
            hasMore={paginatedProfiles ? !paginatedProfiles.isDone : false}
            hasPrevious={pageIndex > 0}
            onNext={handleNextPage}
            onPrevious={handlePrevPage}
            currentPage={pageIndex + 1}
            knownPages={cursors.length}
            onPageSelect={(page) => handlePageSelect(page - 1)}
          />
        </div>
      </div>

      {selectedProfileId ? (
        <SelectedProfileDetailDrawer
          organizationId={organizationId!}
          selectedProfileId={selectedProfileId}
          open
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setSelectedProfileId(null)
          }}
        />
      ) : (
        <ProfileDetailDrawer
          open={!!selectedProfileId}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setSelectedProfileId(null)
          }}
          profile={undefined}
          isLoading={false}
        />
      )}
    </div>
  )
}
