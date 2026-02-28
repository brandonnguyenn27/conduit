import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useRouteContext } from '@tanstack/react-router'
import { ConvexQueryClient } from '@convex-dev/react-query'

const convexUrl =
  (typeof import.meta !== 'undefined' &&
    (import.meta as any).env?.VITE_CONVEX_URL) ||
  process.env.VITE_CONVEX_URL

export function getContext() {
  if (!convexUrl) throw new Error('VITE_CONVEX_URL is not set')
  const convexQueryClient = new ConvexQueryClient(convexUrl, {
    expectAuth: true,
  })
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        queryKeyHashFn: convexQueryClient.hashFn(),
        queryFn: convexQueryClient.queryFn(),
      },
    },
  })
  convexQueryClient.connect(queryClient)
  return {
    queryClient,
    convexQueryClient,
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
