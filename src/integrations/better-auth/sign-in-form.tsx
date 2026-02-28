import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { authClient } from '@/lib/auth-client'
import { authFormDefaultValues } from './auth-form.options'
import { AuthTextField, AuthPasswordField } from './auth-form-fields'

export function SignInForm() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [apiError, setApiError] = useState('')

  const form = useForm({
    defaultValues: authFormDefaultValues,
    onSubmit: async ({ value }) => {
      setApiError('')
      try {
        if (isSignUp) {
          const result = await authClient.signUp.email({
            email: value.email,
            password: value.password,
            name: value.name ?? value.email,
          })
          if (result.error) {
            setApiError(result.error.message || 'Sign up failed')
          }
        } else {
          const result = await authClient.signIn.email({
            email: value.email,
            password: value.password,
          })
          if (result.error) {
            setApiError(result.error.message || 'Sign in failed')
          }
        }
      } catch {
        setApiError('An unexpected error occurred')
      }
    },
  })

  const handleToggleMode = () => {
    setIsSignUp(!isSignUp)
    setApiError('')
  }

  return (
    <div className="flex justify-center py-10 px-4">
      <div className="w-full max-w-md p-6">
        <h1 className="text-lg font-semibold leading-none tracking-tight">
          {isSignUp ? 'Create an account' : 'Sign in'}
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2 mb-6">
          {isSignUp
            ? 'Enter your information to create an account'
            : 'Enter your email below to login to your account'}
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
          className="grid gap-4"
        >
          {isSignUp && (
            <form.Field
              name="name"
              validators={{
                onChange: ({ value }) =>
                  !value?.trim() ? 'Name is required' : undefined,
              }}
            >
              {(field) => (
                <AuthTextField field={field} label="Name" required />
              )}
            </form.Field>
          )}

          <form.Field
            name="email"
            validators={{
              onChange: ({ value }) => {
                if (!value) return 'Email is required'
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
                  return 'Invalid email address'
                return undefined
              },
            }}
          >
            {(field) => (
              <AuthTextField
                field={field}
                label="Email"
                type="email"
                required
              />
            )}
          </form.Field>

          <form.Field
            name="password"
            validators={{
              onChange: ({ value }) => {
                if (!value) return 'Password is required'
                if (value.length < 8)
                  return 'Password must be at least 8 characters'
                return undefined
              },
            }}
          >
            {(field) => (
              <AuthPasswordField field={field} label="Password" required />
            )}
          </form.Field>

          {apiError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
              <p className="text-sm text-red-600 dark:text-red-400">
                {apiError}
              </p>
            </div>
          )}

          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
          >
            {([canSubmit, isSubmitting]) => (
              <button
                type="submit"
                disabled={!canSubmit || isSubmitting}
                className="w-full h-9 px-4 text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-400 border-t-white dark:border-neutral-600 dark:border-t-neutral-900" />
                    <span>Please wait</span>
                  </span>
                ) : isSignUp ? (
                  'Create account'
                ) : (
                  'Sign in'
                )}
              </button>
            )}
          </form.Subscribe>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={handleToggleMode}
            className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
          >
            {isSignUp
              ? 'Already have an account? Sign in'
              : "Don't have an account? Sign up"}
          </button>
        </div>

        <p className="mt-6 text-xs text-center text-neutral-400 dark:text-neutral-500">
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
