import { keepPreviousData, useQuery as useTanStackQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { Search, X } from 'lucide-react'
import { useMemo, useState, useTransition } from 'react'

import { ExplorePageSkeleton } from '@/components/app/ExplorePageSkeleton'
import { ProfileDetailDrawer } from '@/components/app/ProfileDetailDrawer'
import { ProfileTable } from '@/components/app/ProfileTable'
import { SelectedProfileDetailDrawer } from '@/components/home/search/SelectedProfileDetailDrawer'
import { AuroraText } from '@/components/ui/aurora-text'
import { DotPattern } from '@/components/ui/dot-pattern'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Id } from '@convex/_generated/dataModel'
import { api } from 'convex/_generated/api'
import { useQuery } from 'convex/react'
import { useOrganization } from '@/contexts/OrganizationContext'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { FRATERNITY_FAMILY_LABELS } from '@/lib/fraternityCatalog'
import { sortFraternityClassesByGreek } from '@/lib/fraternityClassSort'
import { getExploreProfilesFn } from '@/lib/explore.functions'
import { ensureOrganizationData } from '@/lib/get-organization-data.functions'
import { useCursorPagination } from '@/lib/use-cursor-pagination'
import { cn } from '@/lib/utils'

type ExploreFilters = {
  profileType?: 'alumni' | 'member'
  class?: string
  family?: string
}

export const Route = createFileRoute('/_authenticated/explore')({
  loader: async ({ context }) => {
    const { organizationId } = await ensureOrganizationData(context.queryClient)
    if (!organizationId) return
    await context.queryClient.prefetchQuery({
      queryKey: ['explore-profiles', organizationId, null, '', '', '', ''],
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
  if (!organizationId) {
    return <ExplorePageSkeleton />
  }
  return <ExplorePageContent organizationId={organizationId} />
}

function ExplorePageContent({ organizationId }: { organizationId: Id<'organizations'> }) {
  const getExploreProfiles = useServerFn(getExploreProfilesFn)
  const [selectedProfileId, setSelectedProfileId] = useState<Id<'profiles'> | null>(
    null
  )
  const [isTransitionPending, startTransition] = useTransition()

  const [filters, setFilters] = useState<ExploreFilters>({})
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebouncedValue(searchInput, 350)

  const filtersKey = useMemo(
    () =>
      [filters.profileType ?? '', filters.class ?? '', filters.family ?? '', debouncedSearch.trim()] as const,
    [filters.profileType, filters.class, filters.family, debouncedSearch]
  )

  const exploreFiltersPayload = useMemo(() => {
    const q = debouncedSearch.trim()
    return {
      ...filters,
      ...(q ? { searchText: q } : {}),
    }
  }, [filters, debouncedSearch])

  const { cursors, pageIndex, currentCursor, reset, nextPage, prevPage, selectPage } =
    useCursorPagination(filtersKey.join('\0'))

  const classFacetPage = useQuery(
    api.functions.facets.queries.getFacetPage,
    organizationId
      ? { organizationId, facet: 'classes' as const, limit: 500 }
      : 'skip'
  )

  const classFilterOptions = useMemo(() => {
    const fromDb = classFacetPage?.items ?? []
    const withSelected =
      filters.class && !fromDb.includes(filters.class) ? [filters.class, ...fromDb] : fromDb
    return sortFraternityClassesByGreek(withSelected)
  }, [classFacetPage?.items, filters.class])

  const {
    data: paginatedProfiles,
    refetch,
    isFetching,
    isPending: isQueryPending,
  } = useTanStackQuery({
    queryKey: ['explore-profiles', organizationId, currentCursor, ...filtersKey],
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
    queryFn: async () =>
      await getExploreProfiles({
        data: {
          organizationId,
          cursor: currentCursor,
          filters: exploreFiltersPayload,
        },
      }),
  })

  const savedProfileIdSet = useMemo(() => {
    return new Set(paginatedProfiles?.savedProfileIds ?? [])
  }, [paginatedProfiles?.savedProfileIds])

  const handleNextPage = () => {
    startTransition(() => nextPage(paginatedProfiles))
  }

  const handlePrevPage = () => {
    startTransition(prevPage)
  }

  const handlePageSelect = (targetPageIndex: number) => {
    startTransition(() => selectPage(targetPageIndex))
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
      reset()
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
          {/* Filter bar + search */}
          <div className="mb-4 flex flex-col gap-4 font-secondary lg:flex-row lg:items-center lg:justify-between">
            <div className="flex w-full min-w-0 flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
              <Select
                value={filters.profileType ?? ALL_VALUE}
                onValueChange={(v) => handleFilterChange('profileType', v)}
              >
                <SelectTrigger className="w-full md:w-[150px]">
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
                <SelectTrigger className="w-full md:w-[150px]">
                  <SelectValue placeholder="Class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>All Classes</SelectItem>
                  {classFilterOptions.map((label) => (
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
                <SelectTrigger className="w-full md:w-[150px]">
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

              {hasActiveSelectFilters(filters) && (
                <button
                  type="button"
                  onClick={() => {
                    startTransition(() => {
                      setFilters({})
                      reset()
                    })
                  }}
                  className="text-sm text-muted-foreground underline hover:text-foreground md:self-center"
                >
                  Clear filters
                </button>
              )}
            </div>

            <div className="w-full shrink-0 lg:max-w-sm">
              <InputGroup className="font-secondary">
                <InputGroupAddon align="inline-start" aria-hidden>
                  <Search />
                </InputGroupAddon>
                <InputGroupInput
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search by name…"
                  aria-label="Search profiles by name"
                />
                {searchInput.length > 0 ? (
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      aria-label="Clear search"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation()
                        startTransition(() => {
                          setSearchInput('')
                          reset()
                        })
                      }}
                    >
                      <X />
                    </InputGroupButton>
                  </InputGroupAddon>
                ) : null}
              </InputGroup>
            </div>
          </div>

          <ProfileTable
            title="All Profiles"
            profiles={paginatedProfiles?.page ?? []}
            isLoading={isQueryPending && paginatedProfiles === undefined}
            emptyMessage="No profiles found matching your filters."
            savedProfileIdSet={savedProfileIdSet}
            isSavedProfilesLoading={false}
            onRefresh={refetch}
            isRefreshing={isFetching || isTransitionPending}
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
          organizationId={organizationId}
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
          savedProfileIdSet={savedProfileIdSet}
          isSavedProfilesLoading={false}
        />
      )}
    </div>
  )
}



function hasActiveSelectFilters(filters: ExploreFilters): boolean {
  return !!(filters.profileType || filters.class || filters.family)
}
