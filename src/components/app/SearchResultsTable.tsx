import { ProfileTable } from '@/components/app/ProfileTable'

type SearchProfile = {
  _id: string
  name: string
  headline: string
  currentCompany?: string
  major?: string
  linkedInUrl: string
}

interface SearchResultsTableProps {
  title: string
  profiles: SearchProfile[]
  isLoading: boolean
  emptyMessage: string
  onRefresh?: () => void
  isRefreshing?: boolean
  onProfileClick?: (profileId: string) => void
  pageSize?: number
  totalResults?: number
  hasMore?: boolean
  hasPrevious?: boolean
  onNext?: () => void
  onPrevious?: () => void
  currentPage?: number
  knownPages?: number
  onPageSelect?: (page: number) => void
  padToPageSize?: boolean
}

export function SearchResultsTable({
  title,
  profiles,
  isLoading,
  emptyMessage,
  onRefresh,
  isRefreshing,
  onProfileClick,
  pageSize,
  totalResults,
  hasMore,
  hasPrevious,
  onNext,
  onPrevious,
  currentPage,
  knownPages,
  onPageSelect,
  padToPageSize,
}: SearchResultsTableProps) {
  return (
    <ProfileTable
      title={title}
      profiles={profiles}
      isLoading={isLoading}
      emptyMessage={emptyMessage}
      onRefresh={onRefresh}
      isRefreshing={isRefreshing}
      onProfileClick={onProfileClick}
      pageSize={pageSize}
      totalResults={totalResults}
      hasMore={hasMore}
      hasPrevious={hasPrevious}
      onNext={onNext}
      onPrevious={onPrevious}
      currentPage={currentPage}
      knownPages={knownPages}
      onPageSelect={onPageSelect}
      padToPageSize={padToPageSize}
    />
  )
}
