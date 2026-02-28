import { createContext, useContext, type ReactNode } from 'react'
import type { Id } from '@convex/_generated/dataModel'

const OrganizationContext = createContext<Id<'organizations'> | null>(null)

export function OrganizationProvider({
  organizationId,
  children,
}: {
  organizationId: Id<'organizations'> | null
  children: ReactNode
}) {
  return (
    <OrganizationContext.Provider value={organizationId}>
      {children}
    </OrganizationContext.Provider>
  )
}

export function useOrganization() {
  return useContext(OrganizationContext)
}
