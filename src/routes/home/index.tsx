import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/home/')({
  component: HomePage,
})

function HomePage() {
  return (
    <div className="text-center text-muted-foreground">
      <p>Home page placeholder.</p>
    </div>
  )
}
