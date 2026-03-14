import { createFileRoute } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { authClient } from '@/lib/auth-client'
import { Skeleton } from '@/components/ui/skeleton'

export const Route = createFileRoute('/_authenticated/profile')({
  pendingComponent: ProfilePageSkeleton,
  component: ProfilePage,
})

function ProfilePageSkeleton() {
  return (
    <div className="flex flex-col items-center gap-4 text-center text-muted-foreground">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-9 w-28 rounded-full" />
    </div>
  )
}

function ProfilePage() {
  return (
    <div className="flex flex-col items-center gap-4 text-center text-muted-foreground">
      <p>Your profile will appear here.</p>
      <Button
        variant="destructive"
        onClick={() => {
          void authClient.signOut({
            fetchOptions: {
              onSuccess: () => location.reload(),
            },
          })
        }}
      >
        Log out
      </Button>
    </div>
  )
}
