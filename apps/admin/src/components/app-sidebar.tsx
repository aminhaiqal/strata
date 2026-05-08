"use client"

import type { ComponentProps } from "react"

import { Building2Icon } from "lucide-react"

import { readStoredAdminSession } from "@/lib/auth"
import { adminNavigation } from "@/lib/admin-navigation"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

export function AppSidebar({ ...props }: ComponentProps<typeof Sidebar>) {
  const session = readStoredAdminSession()
  const items = adminNavigation.map((item) => ({
    title: item.title,
    url: item.url,
    icon: <item.icon />,
    badge: item.badge,
    items: item.items?.map((subItem) => ({
      title: subItem.title,
      url: subItem.url,
    })),
  }))
  const user = session?.user ?? {
    name: "Residence Admin",
    email: "admin@example.com",
    role: "Role & access",
  }
  const teams = [
    {
      name: "Strata",
      logo: <Building2Icon />,
      plan: "Admin Console",
    },
  ]

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain label="Finance Operations" items={items} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: user.name,
            email: user.email,
            avatar: "",
            role: user.role,
          }}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
