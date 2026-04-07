import { useInfiniteQuery } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'

import { ChatQueryInterface } from '@/components/app/ChatQueryInterface'
import { ProfileDetailDrawer } from '@/components/app/ProfileDetailDrawer'
import { SearchResultsContent } from '@/components/home/search/SearchResultsContent'
import { SelectedProfileDetailDrawer } from '@/components/home/search/SelectedProfileDetailDrawer'
import { AuroraText } from '@/components/ui/aurora-text'
import type { Slot2Value } from '@/components/app/chat-query-config'
import type { Id } from '@convex/_generated/dataModel'
import { useOrganization } from '@/contexts/OrganizationContext'
import { normalizeSearchValue } from '@/lib/search'
import { searchProfilesForViewerFn } from '@/lib/search.functions'
import { cn } from '@/lib/utils'

type SearchParams = { slot2: Slot2Value; slot3: string } | null

export function SearchPageContent() {
  const organizationId = useOrganization()
  const searchProfilesForViewer = useServerFn(searchProfilesForViewerFn)
  const [searchParams, setSearchParams] = useState<SearchParams>(null)
  const [searchKey, setSearchKey] = useState(0)
  const [selectedProfileId, setSelectedProfileId] = useState<Id<'profiles'> | null>(null)
  const hasSearched = !!searchParams

  const shouldRunSearch = !!searchParams

  const {
    data: searchResults,
    isPending: isInitialSearchLoading,
    isFetching: isRefreshing,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: [
      'search-profiles',
      organizationId,
      searchParams?.slot2 ?? null,
      searchParams?.slot3 ?? null,
      ...(searchParams ? [searchKey] : []),
    ],
    enabled: shouldRunSearch,
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => (lastPage.isDone ? undefined : lastPage.continueCursor),
    queryFn: async ({ pageParam }) =>
      await searchProfilesForViewer({
        data: {
          organizationId: organizationId!,
          searchQuery: searchParams!.slot3,
          slot2: searchParams!.slot2,
          searchKey,
          cursor: pageParam,
          numItems: 10,
        },
      }),
  })

  const mainProfiles = useMemo(
    () => (searchResults?.pages ?? []).flatMap((p) => p.page),
    [searchResults]
  )
  const isRoleQuery =
    searchParams?.slot2 === 'works_as' || searchParams?.slot2 === 'worked_as'
  const hasMoreServer = !!hasNextPage

  function handleSearch(slot2: Slot2Value, slot3: string) {
    const normalized = normalizeSearchValue(slot2, slot3)
    if (!normalized) return
    setSelectedProfileId(null)
    setSearchKey(Date.now())
    setSearchParams({ slot2, slot3: normalized })
  }

  function handleRefresh() {
    setSearchKey(Date.now())
  }

  return (
    <div
      className={cn(
        'relative z-10 flex min-h-[70vh] flex-col items-center gap-8',
        hasSearched ? 'justify-start py-10' : 'justify-center -translate-y-12'
      )}
    >
      <motion.h1
        layout
        className="text-4xl font-bold tracking-tighter md:text-5xl lg:text-7xl"
      >
        <AuroraText
          className="font-(family-name:--font-editorial)"
          colors={['#0a0a0a', '#374151', '#0070F3', '#6b7280']}
        >
          Who are you searching for?
        </AuroraText>
      </motion.h1>

      <ChatQueryInterface
        organizationId={organizationId!}
        onSearch={handleSearch}
        compact={hasSearched}
        isSearching={hasSearched && isInitialSearchLoading}
        resultsSlot={
          hasSearched && !isInitialSearchLoading ? (
            <SearchResultsContent
              profiles={mainProfiles}
              isRoleQuery={isRoleQuery}
              isRefreshing={isRefreshing || isFetchingNextPage}
              hasMoreServer={hasMoreServer}
              onRefresh={handleRefresh}
              onLoadMore={() => {
                if (!hasNextPage || isFetchingNextPage) return
                fetchNextPage()
              }}
              onProfileClick={(profileId) =>
                setSelectedProfileId(profileId as Id<'profiles'>)
              }
            />
          ) : null
        }
      />
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
