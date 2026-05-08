import { Link, useParams } from "@tanstack/react-router"
import { ArrowRightIcon } from "lucide-react"

import { ArrearsReportScreen } from "@/components/admin/arrears-report-screen"
import { ChargesScreen } from "@/components/admin/charges-screen"
import { PendingVerificationScreen } from "@/components/admin/pending-verification-screen"
import { UnitsScreen } from "@/components/admin/units-screen"
import { AdminShell } from "@/components/admin-shell"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  adminNavigation,
  getAdminSection,
  getAdminSubsection,
} from "@/lib/admin-navigation"

const detailedScreenMap = {
  "residences/units": UnitsScreen,
  "billing/charges": ChargesScreen,
  "collections/pending-verification": PendingVerificationScreen,
  "reports/arrears-report": ArrearsReportScreen,
} as const

export default function AdminSectionPage() {
  const { section, subsection } = useParams({ strict: false }) as {
    section?: string
    subsection?: string
  }

  const currentSection = section ? getAdminSection(section) : undefined
  const currentSubsection =
    section && subsection ? getAdminSubsection(section, subsection) : undefined

  if (!currentSection) {
    return null
  }

  const pageTitle = currentSubsection?.title ?? currentSection.title
  const pageDescription =
    currentSubsection?.description ?? currentSection.description
  const pageCapabilities =
    currentSubsection?.capabilities ?? currentSection.capabilities
  const Icon = currentSection.icon
  const screenKey =
    currentSection.slug && currentSubsection
      ? (`${currentSection.slug}/${currentSubsection.slug}` as keyof typeof detailedScreenMap)
      : undefined
  const DetailedScreen = screenKey ? detailedScreenMap[screenKey] : undefined

  return (
    <AdminShell
      badge={currentSection.badge}
      title={pageTitle}
      description={pageDescription}
      breadcrumbs={[
        { label: "Dashboard", url: "/dashboard" },
        { label: currentSection.title, url: currentSection.url },
        ...(currentSubsection ? [{ label: currentSubsection.title }] : []),
      ]}
    >
      {DetailedScreen ? <DetailedScreen /> : null}

      {!DetailedScreen ? (
        <>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(20rem,0.9fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Requirement coverage</CardTitle>
            <CardDescription>
              This screen is wired and ready for module-specific implementation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {pageCapabilities.map((capability) => (
                <div
                  key={capability}
                  className="rounded-xl border border-border/70 bg-muted/30 p-4"
                >
                  <p className="text-sm leading-6">{capability}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Section context</CardTitle>
            <CardDescription>
              Navigation grouping for the administrator interface.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl border border-border/70 bg-background p-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                <Icon className="size-4" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">{currentSection.title}</p>
                <p className="text-sm leading-6 text-muted-foreground">
                  {currentSection.description}
                </p>
              </div>
            </div>
            <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-4 text-sm leading-6 text-muted-foreground">
              {currentSubsection
                ? "Use this screen for the detailed workflow under the selected section."
                : "Choose a child screen below to move from section overview into an operational workflow."}
            </div>
          </CardContent>
        </Card>
      </div>
        </>
      ) : null}

      {currentSection.items?.length ? (
        <Card>
          <CardHeader>
            <CardTitle>
              {currentSubsection ? "Related screens" : "Available screens"}
            </CardTitle>
            <CardDescription>
              {currentSubsection
                ? "Jump to adjacent workflows inside the same admin section."
                : "Each screen maps to a requirement-backed area of the administrator interface."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {currentSection.items.map((item) => (
                <Link
                  key={item.slug}
                  to={item.url}
                  className="group rounded-xl border border-border/70 bg-card transition-colors hover:border-foreground/20"
                >
                  <div className="flex h-full flex-col gap-3 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-sm font-semibold">{item.title}</h2>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                      <ArrowRightIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                    </div>
                    <div className="space-y-2 border-t border-border/60 pt-3">
                      {item.capabilities.slice(0, 2).map((capability) => (
                        <p
                          key={capability}
                          className="text-xs leading-5 text-muted-foreground"
                        >
                          {capability}
                        </p>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Other admin areas</CardTitle>
          <CardDescription>
            High-level navigation across the rest of the finance operations console.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {adminNavigation
              .filter((item) => item.slug !== currentSection.slug)
              .map((item) => (
                <Link
                  key={item.slug}
                  to={item.url}
                  className="rounded-xl border border-border/70 bg-muted/20 p-4 transition-colors hover:bg-muted/40"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </Link>
              ))}
          </div>
        </CardContent>
      </Card>
    </AdminShell>
  )
}
