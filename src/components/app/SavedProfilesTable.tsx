import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { SaveProfileButton } from './SaveProfileButton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { useOrganization } from '@/contexts/OrganizationContext'

type SearchProfile = {
  _id: string
  name: string
  headline: string
  currentCompany?: string
  linkedInUrl: string
}

interface SavedProfilesTableProps {
  title: string
  profiles: SearchProfile[]
  isLoading: boolean
  emptyMessage: string
  onRefresh?: () => void
  isRefreshing?: boolean
  onProfileClick?: (profileId: string) => void
  hasMore?: boolean
  hasPrevious?: boolean
  onNext?: () => void
  onPrevious?: () => void
  currentPage?: number
  knownPages?: number
  onPageSelect?: (page: number) => void
}

export function SavedProfilesTable({
  title,
  profiles,
  isLoading,
  emptyMessage,
  onRefresh,
  isRefreshing,
  onProfileClick,
  hasMore,
  hasPrevious,
  onNext,
  onPrevious,
  currentPage = 1,
  knownPages = 1,
  onPageSelect,
}: SavedProfilesTableProps) {
  const organizationId = useOrganization()
  const showEmptyState = !isLoading && profiles.length === 0

  const [direction, setDirection] = useState(0)
  const prevPageRef = useRef(currentPage)

  useEffect(() => {
    if (currentPage !== prevPageRef.current) {
      setDirection(currentPage > prevPageRef.current ? 1 : -1)
      prevPageRef.current = currentPage
    }
  }, [currentPage])

  const paddingRows = Math.max(0, 10 - profiles.length)

  return (
    <Card className="rounded-lg border-border/70 bg-white/70 backdrop-blur-md dark:bg-zinc-900/70">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle className="font-(family-name:--font-editorial) text-2xl">
          {title}
        </CardTitle>
        {onRefresh ? (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="text-sm text-muted-foreground underline hover:text-foreground disabled:opacity-50"
          >
            Refresh
          </button>
        ) : null}
      </CardHeader>
      <CardContent>
        <div className="relative w-full overflow-hidden grid" style={{ gridTemplateColumns: '1fr', gridTemplateRows: '1fr' }}>
          <AnimatePresence custom={direction} initial={false} mode="wait">
            <motion.div
              key={currentPage}
              custom={direction}
              variants={{
                enter: (dir: number) => ({ x: dir > 0 ? 30 : -30, opacity: 0 }),
                center: { x: 0, opacity: 1 },
                exit: (dir: number) => ({ x: dir < 0 ? 30 : -30, opacity: 0 })
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="col-start-1 row-start-1 w-full"
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs uppercase tracking-wide">Name</TableHead>
                    <TableHead className="text-xs uppercase tracking-wide">Current Occupation</TableHead>
                    <TableHead className="text-xs uppercase tracking-wide">Company</TableHead>
                    <TableHead className="text-right text-xs uppercase tracking-wide">LinkedIn</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles.map((profile) => (
                    <TableRow
                      key={profile._id}
                      onClick={() => onProfileClick?.(profile._id)}
                      className={cn(
                        'group',
                        onProfileClick ? 'cursor-pointer' : 'cursor-default'
                      )}
                    >
                      <TableCell className="py-4 font-medium">{profile.name}</TableCell>
                      <TableCell className="text-muted-foreground py-4">{profile.headline}</TableCell>
                      <TableCell className="py-4">{profile.currentCompany ?? '—'}</TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center justify-end gap-2">
                          {organizationId ? (
                            <SaveProfileButton
                              profileId={profile._id as any}
                              organizationId={organizationId}
                              className="h-9 w-9"
                            />
                          ) : null}
                          <a
                            href={profile.linkedInUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Open ${profile.name} on LinkedIn`}
                            onClick={(event) => {
                              event.stopPropagation()
                            }}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border/70 hover:bg-muted"
                          >
                            <LinkedInIcon />
                          </a>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {Array.from({ length: paddingRows }).map((_, i) => (
                    <TableRow key={`padding-${i}`} className="pointer-events-none border-b-0 hover:bg-transparent">
                      <TableCell className="py-4">
                        <div className="h-9 w-px"></div>
                      </TableCell>
                      <TableCell className="py-4"></TableCell>
                      <TableCell className="py-4"></TableCell>
                      <TableCell className="py-4"></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </motion.div>
          </AnimatePresence>
        </div>

        {showEmptyState ? (
          <p className="text-muted-foreground mt-4 text-sm">{emptyMessage}</p>
        ) : null}

        {(hasPrevious || hasMore) && (
          <div className="mt-4 flex items-center justify-end px-2">
            <Pagination className="w-auto mx-0">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={(e) => {
                      e.preventDefault()
                      if (hasPrevious && onPrevious) onPrevious()
                    }}
                    href="#"
                    aria-disabled={!hasPrevious}
                    className={!hasPrevious ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                {Array.from({ length: knownPages }).map((_, i) => {
                  const pageNum = i + 1
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        href="#"
                        isActive={currentPage === pageNum}
                        onClick={(e: React.MouseEvent) => {
                          e.preventDefault()
                          if (onPageSelect) onPageSelect(pageNum)
                        }}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  )
                })}
                {hasMore && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
                <PaginationItem>
                  <PaginationNext
                    onClick={(e) => {
                      e.preventDefault()
                      if (hasMore && onNext) onNext()
                    }}
                    href="#"
                    aria-disabled={!hasMore}
                    className={!hasMore ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function LinkedInIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4 fill-current text-foreground"
    >
      <path d="M19 3A2 2 0 0 1 21 5v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14ZM8.34 17.34V9.89H5.86v7.45h2.48Zm-1.24-8.47c.79 0 1.43-.65 1.43-1.43 0-.8-.64-1.43-1.43-1.43-.78 0-1.42.64-1.42 1.43 0 .79.64 1.43 1.42 1.43Zm11.24 8.47v-4.12c0-2.21-1.18-3.24-2.75-3.24-1.27 0-1.84.7-2.16 1.2v-1.03h-2.48v7.2h2.48v-4.02c0-.21.02-.42.08-.57.17-.42.56-.86 1.21-.86.85 0 1.19.65 1.19 1.6v3.85h2.43Z" />
    </svg>
  )
}
