import { useQuery } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { motion } from 'framer-motion'
import { useState } from 'react'

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
  const [searchLimit, setSearchLimit] = useState(10)
  const [selectedProfileId, setSelectedProfileId] = useState<Id<'profiles'> | null>(null)
  const hasSearched = !!searchParams

  const shouldRunSearch = !!searchParams

  const {
    data: searchResults,
    isPending: isInitialSearchLoading,
    isFetching: isRefreshing,
  } = useQuery({
    queryKey: [
      'search-profiles',
      organizationId,
      searchParams?.slot2 ?? null,
      searchParams?.slot3 ?? null,
      ...(searchParams ? [searchKey, searchLimit] : []),
    ],
    enabled: shouldRunSearch,
    queryFn: async () =>
      await searchProfilesForViewer({
        data: {
          organizationId: organizationId!,
          searchQuery: searchParams!.slot3,
          slot2: searchParams!.slot2,
          searchKey,
          limit: searchLimit,
        },
      }),
  })

  const mainProfiles = searchResults?.page ?? []
  const isRoleQuery =
    searchParams?.slot2 === 'works_as' || searchParams?.slot2 === 'worked_as'
  const disableLoadMore =
    isRefreshing || !searchResults || searchResults.isDone

  function handleSearch(slot2: Slot2Value, slot3: string) {
    const normalized = normalizeSearchValue(slot2, slot3)
    if (!normalized) return
    setSearchLimit(10)
    setSelectedProfileId(null)
    setSearchKey(Date.now())
    setSearchParams({ slot2, slot3: normalized })
  }

  function handleRefresh() {
    setSearchKey(Date.now())
  }

  function handleNextPage() {
    if (disableLoadMore) return
    setSearchLimit((current) => current + 10)
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
              isRefreshing={isRefreshing}
              disableLoadMore={disableLoadMore}
              onRefresh={handleRefresh}
              onLoadMore={handleNextPage}
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
