import { Link, useRouterState } from '@tanstack/react-router'
import { Bookmark, Search, User } from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

const SIDEBAR_ITEMS = [
  { label: 'Search', href: '/home', icon: Search },
  { label: 'Saved', href: '/home/saved', icon: Bookmark },
  { label: 'Profile', href: '/home/profile', icon: User },
] as const

export function AppSidebar() {
  const routerState = useRouterState()
  const pathname = routerState.location.pathname

  return (
    <Sidebar
      className={cn(
        'font-(family-name:--font-editorial)',
        'rounded-r-lg border-r border-sidebar-border'
      )}
    >
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
        <Link to="/" className="text-lg font-semibold tracking-tight">
          Conduit
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {SIDEBAR_ITEMS.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link to={item.href}>
                        <Icon className="size-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
