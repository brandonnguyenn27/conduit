import { createFileRoute, redirect } from '@tanstack/react-router'

import { SignInForm } from '@/integrations/better-auth/sign-in-form'

export const Route = createFileRoute('/login')({
  beforeLoad: (ctx) => {
    if (ctx.context.isAuthenticated) {
      throw redirect({ to: '/explore' })
    }
  },
  component: LoginRoute,
})

function LoginRoute() {
  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-zinc-100 px-6 py-10 md:py-14">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-2xl border border-zinc-300 bg-zinc-100/80">
          <SignInForm />
        </div>
      </div>
    </main>
  )
}
