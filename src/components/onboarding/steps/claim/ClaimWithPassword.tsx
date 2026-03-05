import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'

import { authClient } from '@/lib/auth-client'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type ClaimWithPasswordProps = {
  organizationId: Id<'organizations'>
  profileId: Id<'profiles'>
  email: string
  name: string
  savedPassword: string
  onDraftChange: (password: string) => void
  onSuccess: () => void
}

export function ClaimWithPassword({
  organizationId,
  profileId,
  email,
  name,
  savedPassword,
  onDraftChange,
  onSuccess,
}: ClaimWithPasswordProps) {
  const completeOnboarding = useMutation(api.functions.appUsers.mutations.completeOnboarding)

  const [errorMessage, setErrorMessage] = useState('')

  const form = useForm({
    defaultValues: {
      password: savedPassword,
    },
    onSubmit: async ({ value }) => {
      setErrorMessage('')
      try {
        const signUpResult = await authClient.signUp.email({
          email,
          password: value.password,
          name,
        })

        if (signUpResult.error) {
          setErrorMessage(signUpResult.error.message || 'Unable to create account.')
          return
        }

        await completeOnboarding({
          organizationId,
          profileId,
        })

        onSuccess()
      } catch {
        setErrorMessage('Unable to complete onboarding right now. Please try again.')
      }
    },
  })

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        void form.handleSubmit()
      }}
    >
      <div className="rounded-md border border-border p-4">
        <p className="text-sm font-medium">{name}</p>
        <p className="mt-1 text-sm text-muted-foreground">{email}</p>
      </div>

      <form.Field
        name="password"
        validators={{
          onChange: ({ value }) => {
            if (!value) return 'Password is required'
            if (value.length < 8) return 'Password must be at least 8 characters.'
            return undefined
          },
        }}
      >
        {(field) => (
          <div className="grid gap-2">
            <Label htmlFor="claim-password">Create password</Label>
            <Input
              id="claim-password"
              type="password"
              placeholder="Minimum 8 characters"
              value={field.state.value}
              onChange={(e) => {
                field.handleChange(e.target.value)
                onDraftChange(e.target.value)
              }}
              onBlur={field.handleBlur}
              autoComplete="new-password"
            />
          </div>
        )}
      </form.Field>

      {errorMessage ? (
        <Alert variant="destructive">
          <AlertTitle>Unable to complete signup</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
        {([canSubmit, isSubmitting]) => (
          <Button type="submit" className="mt-2 w-full" disabled={!canSubmit || isSubmitting}>
            {isSubmitting ? 'Creating account...' : 'Claim profile and create account'}
          </Button>
        )}
      </form.Subscribe>
    </form>
  )
}
