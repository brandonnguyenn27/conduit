import { useMemo } from 'react'

import { SearchResultsTable } from '@/components/app/SearchResultsTable'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
} from '@/components/ui/pagination'
import { cn } from '@/lib/utils'

type SearchProfile = {
  _id: string
  matchType?: string
  name: string
  headline: string
  currentCompany?: string
  linkedInUrl: string
}

interface SearchResultsContentProps {
  profiles: SearchProfile[]
  isRoleQuery: boolean
  isRefreshing: boolean
  disableLoadMore: boolean
  onRefresh: () => void
  onLoadMore: () => void
  onProfileClick: (profileId: string) => void
}

export function SearchResultsContent({
  profiles,
  isRoleQuery,
  isRefreshing,
  disableLoadMore,
  onRefresh,
  onLoadMore,
  onProfileClick,
}: SearchResultsContentProps) {
  const exactProfiles = useMemo(
    () =>
      isRoleQuery ? profiles.filter((profile) => profile.matchType === 'exact') : profiles,
    [isRoleQuery, profiles]
  )
  const suggestedProfiles = useMemo(
    () =>
      isRoleQuery ? profiles.filter((profile) => profile.matchType === 'suggested') : [],
    [isRoleQuery, profiles]
  )

  return (
    <div className="flex w-full flex-col gap-6">
      <SearchResultsTable
        title="Results"
        profiles={exactProfiles}
        isLoading={false}
        emptyMessage="No profiles found. Try another search."
        onRefresh={onRefresh}
        isRefreshing={isRefreshing}
        onProfileClick={onProfileClick}
      />

      {suggestedProfiles.length > 0 ? (
        <SearchResultsTable
          title="Suggested/Similar Profiles"
          profiles={suggestedProfiles}
          isLoading={false}
          emptyMessage="No suggested profiles."
          onProfileClick={onProfileClick}
        />
      ) : null}

      {profiles.length > 0 ? (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(event) => {
                  event.preventDefault()
                  onLoadMore()
                }}
                aria-disabled={disableLoadMore}
                className={cn(disableLoadMore ? 'pointer-events-none opacity-50' : undefined)}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}
    </div>
  )
}
