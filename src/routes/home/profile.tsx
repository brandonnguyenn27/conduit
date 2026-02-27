import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/home/profile')({
  component: ProfilePage,
})

function ProfilePage() {
  return (
    <div className="text-center text-muted-foreground">
      <p>Your profile will appear here.</p>
    </div>
  )
}
