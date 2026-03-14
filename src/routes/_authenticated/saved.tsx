import { createFileRoute } from '@tanstack/react-router'

import { Skeleton } from '@/components/ui/skeleton'

export const Route = createFileRoute('/_authenticated/saved')({
  pendingComponent: SavedPageSkeleton,
  component: SavedPage,
})

function SavedPageSkeleton() {
  return (
    <div className="text-center text-muted-foreground space-y-3">
      <Skeleton className="mx-auto h-5 w-40" />
      <div className="mx-auto flex max-w-md flex-col gap-2">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    </div>
  )
}

function SavedPage() {
  return (
    <div className="text-center text-muted-foreground">
      <p>Saved profiles will appear here.</p>
    </div>
  )
}
