import {
  Outlet,
  createFileRoute,
  useLoaderData,
} from '@tanstack/react-router'

import { AppSidebar } from '@/components/app/AppSidebar'
import { OrganizationProvider } from '@/contexts/OrganizationContext'
import { getOrganizationDataFn } from '@/lib/get-organization-data.functions'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'

export const Route = createFileRoute('/home')({
  loader: () => getOrganizationDataFn(),
  component: HomeLayout,
})

function HomeLayout() {
  const { organizationId } = useLoaderData({ from: '/home' })

  return (
    <OrganizationProvider organizationId={organizationId}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-4">
            <SidebarTrigger />
          </header>
          <div className="flex flex-1 flex-col items-center justify-center p-6">
            <Outlet />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </OrganizationProvider>
  )
}
