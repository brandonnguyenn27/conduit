import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { DotPattern } from '@/components/ui/dot-pattern'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export function ProfilePageSkeleton() {
  return (
    <div className="relative min-h-[70vh] w-full flex flex-col items-center overflow-x-hidden font-secondary">
      <DotPattern
        width={32}
        height={32}
        cx={1}
        cy={1}
        cr={1.5}
        className={cn(
          'mask-[radial-gradient(800px_circle_at_center,white,transparent)]'
        )}
      />
      <div className="relative z-10 w-full max-w-4xl space-y-6 pt-10 pb-16 px-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="space-y-3 flex-1">
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/4" />
            </div>
            <Skeleton className="h-9 w-24" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Skeleton className="h-12 w-12" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-1/4" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-1/5" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}
