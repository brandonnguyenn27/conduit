import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { Authenticated, AuthLoading, Unauthenticated } from 'convex/react'
import { api } from '@convex/_generated/api'
import { authClient } from '@/lib/auth-client'
import { SignInForm } from '@/integrations/better-auth/sign-in-form'

export const Route = createFileRoute('/demo/better-auth')({
  component: BetterAuthDemo,
})

type AuthUser = { email: string; name?: string | null; image?: string | null }

function SignedInView() {
  const user = useQuery(api.auth.getCurrentUser) as AuthUser | null | undefined

  if (user === undefined || !user) return null

  return (
    <div className="flex justify-center py-10 px-4">
      <div className="w-full max-w-md p-6 space-y-6">
        <div className="space-y-1.5">
          <h1 className="text-lg font-semibold leading-none tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            You're signed in as {user.email}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {user.image ? (
            <img src={user.image} alt="" className="h-10 w-10" />
          ) : (
            <div className="h-10 w-10 bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center">
              <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
              {user.email}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            void authClient.signOut({
              fetchOptions: {
                onSuccess: () => location.reload(),
              },
            })
          }}
          className="w-full h-9 px-4 text-sm font-medium border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          Sign out
        </button>

        <p className="text-xs text-center text-neutral-400 dark:text-neutral-500">
          Built with{' '}
          <a
            href="https://better-auth.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium hover:text-neutral-600 dark:hover:text-neutral-300"
          >
            BETTER-AUTH
          </a>
          .
        </p>
      </div>
    </div>
  )
}

function BetterAuthDemo() {
  return (
    <>
      <AuthLoading>
        <div className="flex items-center justify-center py-10">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-900 dark:border-neutral-800 dark:border-t-neutral-100" />
        </div>
      </AuthLoading>
      <Authenticated>
        <SignedInView />
      </Authenticated>
      <Unauthenticated>
        <SignInForm />
      </Unauthenticated>
    </>
  )
}
