import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState, useTransition } from 'react'

import { ExplorePageSkeleton } from '@/components/app/ExplorePageSkeleton'
import { ProfileDetailDrawer } from '@/components/app/ProfileDetailDrawer'
import { ProfileTable } from '@/components/app/ProfileTable'
import { SelectedProfileDetailDrawer } from '@/components/home/search/SelectedProfileDetailDrawer'
import { AuroraText } from '@/components/ui/aurora-text'
import { DotPattern } from '@/components/ui/dot-pattern'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Id } from '@convex/_generated/dataModel'
import { useOrganization } from '@/contexts/OrganizationContext'
import { FRATERNITY_CLASS_LABELS, FRATERNITY_FAMILY_LABELS } from '@/lib/fraternityCatalog'
import { getExploreProfilesFn } from '@/lib/explore.functions'
import { getOrganizationDataFn } from '@/lib/get-organization-data.functions'
import { cn } from '@/lib/utils'

type ExploreFilters = {
  profileType?: 'alumni' | 'member'
  class?: string
  family?: string
}

export const Route = createFileRoute('/_authenticated/explore')({
  loader: async ({ context }) => {
    const { organizationId } = await getOrganizationDataFn()
    if (!organizationId) return

    await context.queryClient.prefetchQuery({
      queryKey: ['explore-profiles', organizationId, null, {}],
      queryFn: async () =>
        await getExploreProfilesFn({
          data: { organizationId, cursor: null, filters: {} },
        }),
      staleTime: 5 * 60 * 1000,
    })
  },
  pendingComponent: ExplorePageSkeleton,
  component: ExplorePage,
})

const ALL_VALUE = '__all__'

function ExplorePage() {
  const organizationId = useOrganization()
  const getExploreProfiles = useServerFn(getExploreProfilesFn)
  const [selectedProfileId, setSelectedProfileId] = useState<Id<'profiles'> | null>(
    null
  )
  const [cursors, setCursors] = useState<(string | null)[]>([null])
  const [pageIndex, setPageIndex] = useState(0)
  const [isPending, startTransition] = useTransition()

  const [filters, setFilters] = useState<ExploreFilters>({})

  const currentCursor = cursors[pageIndex]

  const {
    data: paginatedProfiles,
    refetch,
    isFetching,
  } = useSuspenseQuery({
    queryKey: ['explore-profiles', organizationId, currentCursor, filters],
    queryFn: async () =>
      await getExploreProfiles({
        data: {
          organizationId: organizationId!,
          cursor: currentCursor,
          filters,
        },
      }),
  })

  const handleNextPage = () => {
    if (paginatedProfiles && !paginatedProfiles.isDone) {
      startTransition(() => {
        if (cursors.length <= pageIndex + 1) {
          setCursors((prev) => {
            const next = [...prev]
            next[pageIndex + 1] = paginatedProfiles.continueCursor
            return next
          })
        }
        setPageIndex((prev) => prev + 1)
      })
    }
  }

  const handlePrevPage = () => {
    if (pageIndex > 0) {
      startTransition(() => {
        setPageIndex((prev) => prev - 1)
      })
    }
  }

  const handlePageSelect = (targetPageIndex: number) => {
    if (targetPageIndex >= 0 && targetPageIndex < cursors.length) {
      startTransition(() => {
        setPageIndex(targetPageIndex)
      })
    }
  }

  const handleFilterChange = (key: keyof ExploreFilters, value: string) => {
    startTransition(() => {
      setFilters((prev) => {
        const next = { ...prev }
        if (value === ALL_VALUE || value === '') {
          delete next[key]
        } else if (key === 'profileType') {
          next.profileType = value as ExploreFilters['profileType']
        } else if (key === 'class') {
          next.class = value
        } else if (key === 'family') {
          next.family = value
        }
        return next
      })
      // Reset pagination when filters change
      setCursors([null])
      setPageIndex(0)
    })
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
            Explore
          </AuroraText>
        </h1>

        <div className="w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          {/* Filter bar */}
          <div className="mb-4 flex flex-wrap items-center gap-3 font-secondary">
            <Select
              value={filters.profileType ?? ALL_VALUE}
              onValueChange={(v) => handleFilterChange('profileType', v)}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Profile Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>All Types</SelectItem>
                <SelectItem value="alumni">Alumni</SelectItem>
                <SelectItem value="member">Member</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.class ?? ALL_VALUE}
              onValueChange={(v) => handleFilterChange('class', v)}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>All Classes</SelectItem>
                {FRATERNITY_CLASS_LABELS.map((label) => (
                  <SelectItem key={label} value={label}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.family ?? ALL_VALUE}
              onValueChange={(v) => handleFilterChange('family', v)}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Family" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>All Families</SelectItem>
                {FRATERNITY_FAMILY_LABELS.map((label) => (
                  <SelectItem key={label} value={label}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters(filters) && (
              <button
                type="button"
                onClick={() => {
                  startTransition(() => {
                    setFilters({})
                    setCursors([null])
                    setPageIndex(0)
                  })
                }}
                className="text-sm text-muted-foreground underline hover:text-foreground"
              >
                Clear filters
              </button>
            )}
          </div>

          <ProfileTable
            title="All Profiles"
            profiles={paginatedProfiles?.page ?? []}
            isLoading={false}
            emptyMessage="No profiles found matching your filters."
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



function hasActiveFilters(filters: ExploreFilters): boolean {
  return !!(filters.profileType || filters.class || filters.family)
}
