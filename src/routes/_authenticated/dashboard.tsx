import { createFileRoute } from '@tanstack/react-router'

import { Skeleton } from '@/components/ui/skeleton'

export const Route = createFileRoute('/_authenticated/dashboard')({
  pendingComponent: DashboardSkeleton,
  component: DashboardPage,
})

function DashboardSkeleton() {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <Skeleton className="h-6 w-32 rounded-full" />
      <Skeleton className="h-4 w-64" />
    </div>
  )
}

function DashboardPage() {
  return (
    <div className="text-center text-muted-foreground">
      <p>Home page placeholder.</p>
    </div>
  )
}
