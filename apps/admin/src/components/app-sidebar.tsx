"use client"

import type { ComponentProps } from "react"

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
import { Building2Icon } from "lucide-react"
import { adminNavigation } from "@/lib/admin-navigation"

const data = {
  user: {
    name: "Residence Admin",
    email: "admin@axelyn.strata",
    avatar: "",
  },
  teams: [
    {
      name: "Axelyn Strata",
      logo: <Building2Icon />,
      plan: "Admin Console",
    },
  ],
}

export function AppSidebar({ ...props }: ComponentProps<typeof Sidebar>) {
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

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain label="Finance Operations" items={items} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
