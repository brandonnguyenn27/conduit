import { useQuery } from 'convex/react'
import { Link } from '@tanstack/react-router'
import { Authenticated, AuthLoading, Unauthenticated } from 'convex/react'
import { api } from '@convex/_generated/api'
import { authClient } from '@/lib/auth-client'

function HeaderContent() {
  const user = useQuery(api.auth.getCurrentUser)

  if (user === undefined) {
    return (
      <div className="h-8 w-8 bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
    )
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        {user.image ? (
          <img src={user.image} alt="" className="h-8 w-8" />
        ) : (
          <div className="h-8 w-8 bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
            <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
              {user.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
        )}
        <button
          onClick={() => {
            void authClient.signOut({
              fetchOptions: {
                onSuccess: () => location.reload(),
              },
            })
          }}
          className="flex-1 h-9 px-4 text-sm font-medium bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-50 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
        >
          Sign out
        </button>
      </div>
    )
  }

  return null
}

export default function BetterAuthHeader() {
  return (
    <>
      <AuthLoading>
        <div className="h-8 w-8 bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
      </AuthLoading>
      <Authenticated>
        <HeaderContent />
      </Authenticated>
      <Unauthenticated>
        <Link
          to="/demo/better-auth"
          className="h-9 px-4 text-sm font-medium bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-50 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors inline-flex items-center"
        >
          Sign in
        </Link>
      </Unauthenticated>
    </>
  )
}
