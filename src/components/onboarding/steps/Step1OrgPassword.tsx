import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { useAction } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { Eye, EyeOff } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Step1OrgPasswordProps = {
  organizations: Array<{
    _id: Id<'organizations'>
    name: string
    slug: string
    logoUrl?: string
  }>
  savedOrganizationId: string
  savedPassword: string
  onDraftChange: (draft: { organizationId?: string; password?: string }) => void
  onVerified: (payload: {
    organizationId: Id<'organizations'>
    joinToken: string
  }) => void
}

export function Step1OrgPassword({
  organizations,
  savedOrganizationId,
  savedPassword,
  onDraftChange,
  onVerified,
}: Step1OrgPasswordProps) {
  const verifyOrgPassword = useAction(api.functions.onboarding.actions.verifyOrgPassword)

  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const form = useForm({
    defaultValues: {
      organizationId: savedOrganizationId,
      password: savedPassword,
    },
    onSubmit: async ({ value }) => {
      setErrorMessage('')
      try {
        const result = await verifyOrgPassword({
          organizationId: value.organizationId as Id<'organizations'>,
          password: value.password,
        })

        if (!result.ok) {
          setErrorMessage('Invalid organization password. Please contact your organization admin.')
          return
        }

        onVerified({
          organizationId: result.organizationId as Id<'organizations'>,
          joinToken: result.joinToken,
        })
      } catch {
        setErrorMessage('Unable to verify organization password right now. Please try again.')
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
      <form.Field
        name="organizationId"
        validators={{
          onChange: ({ value }) => (!value ? 'Organization is required' : undefined),
        }}
      >
        {(field) => (
          <div className="grid gap-2">
            <Label htmlFor="organization">Organization</Label>
            <Select
              value={field.state.value || undefined}
              onValueChange={(value) => {
                field.handleChange(value)
                onDraftChange({ organizationId: value })
              }}
            >
              <SelectTrigger id="organization" className="w-full">
                <SelectValue placeholder="Select your organization" />
              </SelectTrigger>
              <SelectContent>
                {(organizations ?? []).map((organization) => (
                  <SelectItem key={organization._id} value={organization._id}>
                    {organization.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </form.Field>

      <form.Field
        name="password"
        validators={{
          onChange: ({ value }) =>
            !value?.trim() ? 'Organization password is required' : undefined,
        }}
      >
        {(field) => (
          <div className="grid gap-2">
            <Label htmlFor="org-password">Organization password</Label>
            <InputGroup>
              <InputGroupInput
                id="org-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter organization password"
                value={field.state.value}
                onChange={(e) => {
                  field.handleChange(e.target.value)
                  onDraftChange({ password: e.target.value })
                }}
                onBlur={field.handleBlur}
                autoComplete="current-password"
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  type="button"
                  variant="ghost"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </div>
        )}
      </form.Field>

      {errorMessage ? (
        <Alert variant="destructive">
          <AlertTitle>Unable to continue</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
        {([canSubmit, isSubmitting]) => (
          <Button
            type="submit"
            className="mt-2 w-full"
            disabled={!canSubmit || isSubmitting || organizations.length === 0}
          >
            {isSubmitting ? 'Verifying...' : 'Continue'}
          </Button>
        )}
      </form.Subscribe>
    </form>
  )
}
