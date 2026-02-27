import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/home/saved')({
  component: SavedPage,
})

function SavedPage() {
  return (
    <div className="text-center text-muted-foreground">
      <p>Saved profiles will appear here.</p>
    </div>
  )
}
