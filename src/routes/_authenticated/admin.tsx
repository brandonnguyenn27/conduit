import { api } from '@convex/_generated/api'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { getOrganizationDataFn } from '@/lib/get-organization-data.functions'

const CLAIM_CODES_LIMIT = 200

export const Route = createFileRoute('/_authenticated/admin')({
  loader: async () => {
    const { isAdmin } = await getOrganizationDataFn()
    if (!isAdmin) {
      throw redirect({ to: '/explore' })
    }
  },
  component: AdminPage,
})

type ImportResult = {
  createdCount: number
  skippedInvalid: number
  skippedDuplicates: number
  invalidUrls: string[]
}

function AdminPage() {
  const [now, setNow] = useState(() => Date.now())
  const [urlBatch, setUrlBatch] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)

  const claimCodeRows = useQuery(api.functions.claimCodes.queries.listActiveForAdmin, {
    now,
    limit: CLAIM_CODES_LIMIT,
  })
  const createManyForCurrentOrg = useMutation(
    api.functions.importQueue.mutations.createManyForCurrentOrg
  )

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitError(null)
    setImportResult(null)

    const linkedInUrls = urlBatch
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)

    if (linkedInUrls.length === 0) {
      setSubmitError('Paste at least one LinkedIn profile URL.')
      return
    }

    try {
      setIsSubmitting(true)
      const result = await createManyForCurrentOrg({ linkedInUrls })
      setImportResult(result)
      if (result.createdCount > 0) {
        setUrlBatch('')
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to enqueue LinkedIn URLs.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-6xl space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="font-editorial">Claim Code Requests</CardTitle>
          <Button
            type="button"
            variant="outline"
            onClick={() => setNow(Date.now())}
            disabled={claimCodeRows === undefined}
          >
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Requester</TableHead>
                <TableHead>Claim code</TableHead>
                <TableHead>Expires</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {claimCodeRows === undefined ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-muted-foreground">
                    Loading claim code requests...
                  </TableCell>
                </TableRow>
              ) : claimCodeRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-muted-foreground">
                    No active claim code requests.
                  </TableCell>
                </TableRow>
              ) : (
                claimCodeRows.map((row) => (
                  <TableRow key={row._id}>
                    <TableCell>{row.requesterName}</TableCell>
                    <TableCell>{row.code}</TableCell>
                    <TableCell>{new Date(row.expiresAt).toLocaleString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-editorial">LinkedIn Batch Import</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="linkedin-url-batch">LinkedIn profile URLs (one per line)</Label>
              <Textarea
                id="linkedin-url-batch"
                value={urlBatch}
                onChange={(event) => setUrlBatch(event.target.value)}
                placeholder="https://www.linkedin.com/in/example-profile"
                rows={10}
              />
            </div>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Queueing...' : 'Queue URLs'}
            </Button>

            {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}

            {importResult ? (
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>Created: {importResult.createdCount}</p>
                <p>Skipped invalid: {importResult.skippedInvalid}</p>
                <p>Skipped duplicates: {importResult.skippedDuplicates}</p>
                {importResult.invalidUrls.length > 0 ? (
                  <p>Invalid URL examples: {importResult.invalidUrls.join(', ')}</p>
                ) : null}
              </div>
            ) : null}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
