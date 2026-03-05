import { createFileRoute } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { authClient } from '@/lib/auth-client'

export const Route = createFileRoute('/home/profile')({
  component: ProfilePage,
})

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
