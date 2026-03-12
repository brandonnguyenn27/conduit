import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { motion } from 'framer-motion'
import { useState } from 'react'

import { ChatQueryInterface } from '@/components/app/ChatQueryInterface'
import { ProfileDetailDrawer } from '@/components/app/ProfileDetailDrawer'
import { SearchResultsContent } from '@/components/home/search/SearchResultsContent'
import { SelectedProfileDetailDrawer } from '@/components/home/search/SelectedProfileDetailDrawer'
import { AuroraText } from '@/components/ui/aurora-text'
import { DotPattern } from '@/components/ui/dot-pattern'
import type { Slot2Value } from '@/components/app/chat-query-config'
import type { Id } from '@convex/_generated/dataModel'
import { getSearchRouteDataFn, searchProfilesForViewerFn } from '@/lib/search.functions'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/home/search')({
  beforeLoad: async () => await getSearchRouteDataFn(),
  component: SearchPage,
})

type SearchParams = { slot2: Slot2Value; slot3: string } | null

function normalizeSearchValue(slot2: Slot2Value, value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (slot2 !== 'works_as' && slot2 !== 'worked_as') return trimmed
  return trimmed.replace(/\s+/g, ' ')
}

function SearchPage() {
  const { organizationId } = Route.useRouteContext()
  const searchProfilesForViewer = useServerFn(searchProfilesForViewerFn)
  const [searchParams, setSearchParams] = useState<SearchParams>(null)
  const [searchKey, setSearchKey] = useState(() => Date.now())
  const [searchLimit, setSearchLimit] = useState(10)
  const [selectedProfileId, setSelectedProfileId] = useState<Id<'profiles'> | null>(null)
  const hasSearched = !!searchParams

  const searchResultsQuery = useQuery({
    queryKey: [
      'search-profiles',
      organizationId,
      searchParams?.slot2,
      searchParams?.slot3,
      searchKey,
      searchLimit,
    ],
    enabled: !!organizationId && !!searchParams,
    queryFn: async () =>
      await searchProfilesForViewer({
        data: {
          organizationId: organizationId as Id<'organizations'>,
          searchQuery: searchParams!.slot3,
          slot2: searchParams!.slot2,
          searchKey,
          limit: searchLimit,
        },
      }),
  })

  const mainProfiles = searchResultsQuery.data?.page ?? []
  const isRoleQuery =
    searchParams?.slot2 === 'works_as' || searchParams?.slot2 === 'worked_as'
  const isInitialSearchLoading = hasSearched && searchResultsQuery.isPending
  const isRefreshing = searchResultsQuery.isFetching
  const disableLoadMore =
    isRefreshing || !searchResultsQuery.data || searchResultsQuery.data.isDone

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
    <div className="relative min-h-[70vh] w-full overflow-hidden">
      <DotPattern
        className={cn(
          'mask-[radial-gradient(400px_circle_at_center,white,transparent)]'
        )}
      />
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

        {organizationId ? (
          <ChatQueryInterface
            organizationId={organizationId}
            onSearch={handleSearch}
            compact={hasSearched}
            isSearching={isInitialSearchLoading}
            resultsSlot={
              hasSearched && !isInitialSearchLoading ? (
                <SearchResultsContent
                  profiles={mainProfiles}
                  isRoleQuery={isRoleQuery}
                  isRefreshing={isRefreshing}
                  disableLoadMore={disableLoadMore}
                  onRefresh={handleRefresh}
                  onLoadMore={handleNextPage}
                  onProfileClick={(profileId) => setSelectedProfileId(profileId as Id<'profiles'>)}
                />
              ) : null
            }
          />
        ) : (
          <p className="text-muted-foreground font-(family-name:--font-editorial) text-lg">
            Select an organization to search profiles.
          </p>
        )}
      </div>
      {organizationId && selectedProfileId ? (
        <SelectedProfileDetailDrawer
          organizationId={organizationId}
          selectedProfileId={selectedProfileId}
          open={!!selectedProfileId}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) {
              setSelectedProfileId(null)
            }
          }}
        />
      ) : (
        <ProfileDetailDrawer
          open={!!selectedProfileId}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) {
              setSelectedProfileId(null)
            }
          }}
          profile={undefined}
          isLoading={false}
        />
      )}
    </div>
  )
}
