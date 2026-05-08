import { Link } from "@tanstack/react-router"

import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

type BreadcrumbEntry = {
  label: string
  url?: string
}

export function AdminShell({
  badge,
  title,
  description,
  breadcrumbs,
  children,
}: {
  badge?: string
  title: string
  description: string
  breadcrumbs: BreadcrumbEntry[]
  children: React.ReactNode
}) {
  const lastBreadcrumbIndex = breadcrumbs.length - 1

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-20 border-b border-border/60 bg-background/95 backdrop-blur">
          <div className="flex h-14 items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 h-4 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((item, index) => {
                  const isLast = index === lastBreadcrumbIndex

                  return (
                    <BreadcrumbItem key={`${item.label}-${index}`}>
                      {isLast || !item.url ? (
                        <BreadcrumbPage>{item.label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link to={item.url}>{item.label}</Link>
                        </BreadcrumbLink>
                      )}
                      {!isLast ? <BreadcrumbSeparator /> : null}
                    </BreadcrumbItem>
                  )
                })}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-4">
          <div className="flex max-w-3xl flex-col gap-3">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
              <p className="text-sm leading-6 text-muted-foreground sm:text-base">
                {description}
              </p>
            </div>
          </div>
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

