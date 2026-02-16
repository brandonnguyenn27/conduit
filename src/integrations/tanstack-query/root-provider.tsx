import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useRouteContext } from '@tanstack/react-router'

export function getContext() {
  const queryClient = new QueryClient()
  return {
    queryClient,
  }
}

export default function TanStackQueryProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { queryClient } = useRouteContext({ from: '__root__' })
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
