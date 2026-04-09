import { createFileRoute } from '@tanstack/react-router'

import { ChatQueryInterfaceSkeleton } from '@/components/app/ChatQueryInterfaceSkeleton'
import { AuroraText } from '@/components/ui/aurora-text'
import { DotPattern } from '@/components/ui/dot-pattern'
import { cn } from '@/lib/utils'

import { SearchPageContent } from '../../components/app/SearchPageContent'

export const Route = createFileRoute('/_authenticated/search')({
  pendingComponent: SearchPageSkeleton,
  component: SearchPage,
})

function SearchPageSkeleton() {
  return (
    <div className="relative min-h-[70vh] w-full overflow-hidden">
      <DotPattern
        className={cn(
          'mask-[radial-gradient(400px_circle_at_center,white,transparent)]'
        )}
      />
      <div className="relative z-10 flex min-h-[70vh] flex-col items-center justify-center gap-8 max-md:-translate-y-4 md:-translate-y-10">
        <h1 className="w-full max-w-[min(100%,42rem)] px-4 text-center text-4xl font-bold tracking-tighter md:text-5xl lg:text-7xl">
          <AuroraText
            className="font-(family-name:--font-editorial)"
            colors={['#0a0a0a', '#374151', '#0070F3', '#6b7280']}
          >
            Who are you searching for?
          </AuroraText>
        </h1>
        <ChatQueryInterfaceSkeleton />
      </div>
    </div>
  )
}

function SearchPage() {
  return (
    <div className="relative min-h-[70vh] w-full overflow-hidden">
      <DotPattern
        className={cn(
          'mask-[radial-gradient(400px_circle_at_center,white,transparent)]'
        )}
      />
      <SearchPageContent />
    </div>
  )
}

