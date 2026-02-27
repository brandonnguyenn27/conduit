import { createFileRoute } from '@tanstack/react-router'

import { ChatQueryInterface } from '@/components/app/ChatQueryInterface'

export const Route = createFileRoute('/home/')({
  component: HomePage,
})

function HomePage() {
  return <ChatQueryInterface />
}
