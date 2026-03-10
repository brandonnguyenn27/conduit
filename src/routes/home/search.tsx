import { createFileRoute } from '@tanstack/react-router'
import { usePaginatedQuery, useConvex } from 'convex/react'
import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import { ChatQueryInterface } from '@/components/app/ChatQueryInterface'
import { ProfileDetailDrawer } from '@/components/app/ProfileDetailDrawer'
import { SearchResultsTable } from '@/components/app/SearchResultsTable'
import { AuroraText } from '@/components/ui/aurora-text'
import { DotPattern } from '@/components/ui/dot-pattern'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
} from '@/components/ui/pagination'
import type { Slot2Value } from '@/components/app/chat-query-config'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { useOrganization } from '@/contexts/OrganizationContext'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/home/search')({
  component: SearchPage,
})

type SearchParams = { slot2: Slot2Value; slot3: string } | null

function SearchPage() {
  const organizationId = useOrganization()
  const [searchParams, setSearchParams] = useState<SearchParams>(null)
  const [searchKey, setSearchKey] = useState(() => Date.now())
  const [mainVisibleCount, setMainVisibleCount] = useState(10)
  const [selectedProfileId, setSelectedProfileId] = useState<Id<'profiles'> | null>(null)
  const hasSearched = !!searchParams

  const { results, status, loadMore } = usePaginatedQuery(
    api.functions.profiles.queries.searchProfilesPaginated,
    organizationId && searchParams
      ? {
          organizationId,
          searchQuery: searchParams.slot3,
          slot2: searchParams.slot2,
          searchKey,
        }
      : 'skip',
    { initialNumItems: 10 }
  )

  useEffect(() => {
    setMainVisibleCount(10)
    setSelectedProfileId(null)
  }, [searchParams, organizationId])

  const mainProfiles = useMemo(
    () => results.slice(0, mainVisibleCount),
    [mainVisibleCount, results]
  )
  const isInitialSearchLoading = hasSearched && status === 'LoadingFirstPage'

  const disableLoadMore = status === 'Exhausted' || status === 'LoadingMore'

  function handleSearch(slot2: Slot2Value, slot3: string) {
    const normalized = slot3.trim()
    if (!normalized) return
    setSearchKey(Date.now())
    setSearchParams({ slot2, slot3: normalized })
  }

  function handleRefresh() {
    setSearchKey(Date.now())
  }

  function handleNextPage() {
    if (status !== 'CanLoadMore') return
    setMainVisibleCount((current) => current + 10)
    loadMore(10)
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
                <div className="flex w-full flex-col gap-6">
                  <SearchResultsTable
                    title="Results"
                    profiles={mainProfiles}
                    isLoading={false}
                    emptyMessage="No profiles found. Try another search."
                    onRefresh={handleRefresh}
                    isRefreshing={status === 'LoadingFirstPage' || status === 'LoadingMore'}
                    onProfileClick={(profileId) =>
                      setSelectedProfileId(profileId as Id<'profiles'>)
                    }
                  />

                  {mainProfiles.length > 0 ? (
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationNext
                            href="#"
                            onClick={(event) => {
                              event.preventDefault()
                              handleNextPage()
                            }}
                            aria-disabled={disableLoadMore}
                            className={cn(
                              disableLoadMore ? 'pointer-events-none opacity-50' : undefined
                            )}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  ) : null}
                </div>
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

function SelectedProfileDetailDrawer({
  organizationId,
  selectedProfileId,
  open,
  onOpenChange,
}: {
  organizationId: Id<'organizations'>
  selectedProfileId: Id<'profiles'>
  open: boolean
  onOpenChange: (nextOpen: boolean) => void
}) {
  const convex = useConvex()
  const selectedProfileQuery = useQuery({
    queryKey: ['profile-detail', organizationId, selectedProfileId],
    staleTime: Infinity,
    gcTime: 1000 * 60 * 30,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    queryFn: async () =>
      await convex.query(api.functions.profiles.queries.getForViewer, {
        organizationId,
        id: selectedProfileId,
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
