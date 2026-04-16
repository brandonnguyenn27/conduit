import {
  Link,
  Outlet,
  createFileRoute,
  useLoaderData,
} from '@tanstack/react-router'

import { OrganizationProvider } from '@/contexts/OrganizationContext'
import { getOrganizationDataFn } from '@/lib/get-organization-data.functions'
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@/components/ui/navigation-menu'

export const Route = createFileRoute('/_authenticated')({
  loader: () => getOrganizationDataFn(),
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  const { organizationId, isAdmin } = useLoaderData({ from: '/_authenticated' })

  return (
    <OrganizationProvider organizationId={organizationId}>
      <div className="flex min-h-screen flex-col">
        <header
          className="grid h-14 grid-cols-[1fr_auto_1fr] items-center border-b border-border px-4"
          style={{ fontFamily: 'var(--font-editorial)' }}
        >
          <Link
            to="/"
            className="hidden justify-self-start text-lg font-semibold tracking-tight sm:block"
          >
            Conduit
          </Link>

          <NavigationMenu viewport={false} className="justify-self-center">
            <NavigationMenuList className="gap-2">
              <NavigationMenuItem>
                <NavigationMenuLink asChild className="rounded-full px-4 py-2">
                  <Link
                    to="/explore"
                    activeOptions={{ exact: true }}
                    activeProps={{ className: 'bg-accent text-accent-foreground' }}
                  >
                    Explore
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild className="rounded-full px-4 py-2">
                  <Link
                    to="/search"
                    activeProps={{ className: 'bg-accent text-accent-foreground' }}
                  >
                    Search
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild className="rounded-full px-4 py-2">
                  <Link
                    to="/saved"
                    activeProps={{ className: 'bg-accent text-accent-foreground' }}
                  >
                    Saved
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild className="rounded-full px-4 py-2">
                  <Link
                    to="/profile"
                    activeProps={{ className: 'bg-accent text-accent-foreground' }}
                  >
                    Profile
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              {isAdmin ? (
                <NavigationMenuItem>
                  <NavigationMenuLink asChild className="rounded-full px-4 py-2">
                    <Link
                      to="/admin"
                      activeProps={{ className: 'bg-accent text-accent-foreground' }}
                    >
                      Admin
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ) : null}
            </NavigationMenuList>
          </NavigationMenu>
        </header>

        <div className="flex flex-1 flex-col items-center justify-center p-6">
          <Outlet />
        </div>
      </div>
    </OrganizationProvider>
  )
}
