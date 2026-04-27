import { useEffect, useMemo, useState } from 'react'

import { SearchResultsTable } from '@/components/app/SearchResultsTable'

type SearchProfile = {
  _id: string
  matchType?: string
  name: string
  headline: string
  currentCompany?: string
  major?: string
  linkedInUrl: string
}

const PAGE_SIZE = 10

interface SearchResultsContentProps {
  profiles: SearchProfile[]
  isRoleQuery: boolean
  isRefreshing: boolean
  hasMoreServer: boolean
  onRefresh: () => void
  onLoadMore: () => void
  onProfileClick: (profileId: string) => void
}

export function SearchResultsContent({
  profiles,
  isRoleQuery,
  isRefreshing,
  hasMoreServer,
  onRefresh,
  onLoadMore,
  onProfileClick,
}: SearchResultsContentProps) {
  const [resultsPage, setResultsPage] = useState(1)
  const [suggestedPage, setSuggestedPage] = useState(1)
  const [desiredResultsPage, setDesiredResultsPage] = useState<number | null>(null)

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

  useEffect(() => {
    setResultsPage(1)
    setSuggestedPage(1)
    setDesiredResultsPage(null)
  }, [profiles])

  const resultsLoadedPages = Math.max(1, Math.ceil(exactProfiles.length / PAGE_SIZE))
  const resultsHasMoreServer = hasMoreServer && exactProfiles.length >= PAGE_SIZE
  const resultsKnownPages = resultsHasMoreServer ? resultsLoadedPages + 1 : resultsLoadedPages
  const suggestedKnownPages = Math.max(1, Math.ceil(suggestedProfiles.length / PAGE_SIZE))

  const safeResultsPage = Math.min(resultsPage, resultsKnownPages)
  const safeSuggestedPage = Math.min(suggestedPage, suggestedKnownPages)

  const resultsSlice = useMemo(() => {
    const start = (safeResultsPage - 1) * PAGE_SIZE
    return exactProfiles.slice(start, start + PAGE_SIZE)
  }, [exactProfiles, safeResultsPage])

  const suggestedSlice = useMemo(() => {
    const start = (safeSuggestedPage - 1) * PAGE_SIZE
    return suggestedProfiles.slice(start, start + PAGE_SIZE)
  }, [suggestedProfiles, safeSuggestedPage])

  useEffect(() => {
    if (desiredResultsPage === null) return
    if (desiredResultsPage <= resultsLoadedPages) {
      setResultsPage(desiredResultsPage)
      setDesiredResultsPage(null)
      return
    }
    if (!resultsHasMoreServer || isRefreshing) return
    onLoadMore()
  }, [
    desiredResultsPage,
    resultsLoadedPages,
    resultsHasMoreServer,
    isRefreshing,
    onLoadMore,
  ])

  return (
    <div className="flex w-full flex-col gap-6">
      <SearchResultsTable
        title="Results"
        profiles={resultsSlice}
        isLoading={false}
        emptyMessage="No profiles found. Try another search."
        onRefresh={onRefresh}
        isRefreshing={isRefreshing}
        onProfileClick={onProfileClick}
        pageSize={PAGE_SIZE}
        padToPageSize={false}
        totalResults={!resultsHasMoreServer ? exactProfiles.length : undefined}
        currentPage={safeResultsPage}
        knownPages={resultsKnownPages}
        hasPrevious={safeResultsPage > 1}
        hasMore={resultsHasMoreServer ? safeResultsPage <= resultsLoadedPages : safeResultsPage < resultsKnownPages}
        onPrevious={() => setResultsPage((p) => Math.max(1, p - 1))}
        onNext={() => {
          setResultsPage((p) => {
            if (p < resultsLoadedPages) return p + 1
            if (!resultsHasMoreServer || isRefreshing) return p
            setDesiredResultsPage(p + 1)
            onLoadMore()
            return p
          })
        }}
        onPageSelect={(page) => {
          const next = Math.min(Math.max(1, page), resultsKnownPages)
          if (next <= resultsLoadedPages) {
            setResultsPage(next)
            return
          }
          if (!resultsHasMoreServer) return
          setDesiredResultsPage(next)
          if (!isRefreshing) onLoadMore()
        }}
      />

      {suggestedProfiles.length > 0 ? (
        <SearchResultsTable
          title="Suggested/Similar Profiles"
          profiles={suggestedSlice}
          isLoading={false}
          emptyMessage="No suggested profiles."
          onProfileClick={onProfileClick}
          pageSize={PAGE_SIZE}
          padToPageSize={false}
          totalResults={suggestedProfiles.length}
          currentPage={safeSuggestedPage}
          knownPages={suggestedKnownPages}
          hasPrevious={safeSuggestedPage > 1}
          hasMore={safeSuggestedPage < suggestedKnownPages}
          onPrevious={() => setSuggestedPage((p) => Math.max(1, p - 1))}
          onNext={() => setSuggestedPage((p) => Math.min(suggestedKnownPages, p + 1))}
          onPageSelect={(page) =>
            setSuggestedPage(Math.min(Math.max(1, page), suggestedKnownPages))
          }
        />
      ) : null}
    </div>
  )
}
