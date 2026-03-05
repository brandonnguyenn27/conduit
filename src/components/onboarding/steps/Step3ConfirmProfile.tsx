import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

type Step3ConfirmProfileProps = {
  joinToken: string
  profileId: Id<'profiles'>
  onConfirm: () => void
}

export function Step3ConfirmProfile({
  joinToken,
  profileId,
  onConfirm,
}: Step3ConfirmProfileProps) {
  const profile = useQuery(api.functions.onboarding.queries.getProfilePreview, {
    joinToken,
    profileId,
  })
  const [showRejectMessage, setShowRejectMessage] = useState(false)

  if (profile === undefined) {
    return <p className="text-sm text-muted-foreground">Loading profile preview...</p>
  }

  if (profile === null) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Unable to verify profile</AlertTitle>
        <AlertDescription>
          We could not load your profile preview. Please restart onboarding and try again.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-md border border-border p-4">
        <h3 className="text-lg font-semibold">{profile.name}</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Current company: {profile.currentCompany ?? 'Not available'}
        </p>
        <p className="text-sm text-muted-foreground">
          Current position: {profile.currentTitle ?? 'Not available'}
        </p>
        <p className="mt-3 text-sm font-medium">Education</p>
        <p className="text-sm text-muted-foreground">
          {profile.education.length > 0
            ? profile.education.map((item) => item.schoolName).join(', ')
            : 'Not available'}
        </p>
      </div>

      {showRejectMessage ? (
        <Alert variant="destructive">
          <AlertTitle>Profile mismatch</AlertTitle>
          <AlertDescription>
            Please contact your organization admin. There is no matching profile for this onboarding flow.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-2">
        <Button type="button" variant="outline" onClick={() => setShowRejectMessage(true)}>
          No, this is not me
        </Button>
        <Button
          type="button"
          onClick={() => {
            setShowRejectMessage(false)
            onConfirm()
          }}
        >
          Yes, this is me
        </Button>
      </div>
    </div>
  )
}
