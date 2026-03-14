import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

interface ChatQueryInterfaceSkeletonProps {
  compact?: boolean
}

export function ChatQueryInterfaceSkeleton({
  compact = false,
}: ChatQueryInterfaceSkeletonProps) {
  return (
    <div
      className={cn(
        'font-(family-name:--font-editorial)',
        'flex w-full max-w-6xl flex-wrap items-center gap-6',
        'rounded-xl border border-border',
        'bg-white/70 shadow-sm backdrop-blur-md',
        compact ? 'px-8 py-7' : 'px-12 py-10',
        'dark:bg-zinc-900/70',
        'flex justify-center'
      )}
    >
      <div className="flex w-full flex-wrap items-center justify-center gap-6">
        <span className="text-foreground shrink-0 text-xl font-medium">
          Find me
        </span>
        <Skeleton className="h-14 min-w-40 rounded-xl" />
        <Skeleton className="h-14 min-w-48 rounded-xl" />
        <Skeleton className="h-14 min-w-52 rounded-xl" />
        <Skeleton className="h-9 w-24 rounded-xl" />
      </div>
    </div>
  )
}

