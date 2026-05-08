import { Link } from "@tanstack/react-router"
import { ArrowRightIcon } from "lucide-react"

import { AdminShell } from "@/components/admin-shell"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { adminNavigation } from "@/lib/admin-navigation"

export default function Page() {
  return (
    <AdminShell
      badge="All"
      title="Finance dashboard"
      description="Monitor the collection operation from one place: overdue exposure, verification workload, debtor prioritization, and recovery follow-up."
      breadcrumbs={[{ label: "Dashboard" }]}
    >
      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            title: "Collection visibility",
            description:
              "Track overdue units, never-paid accounts, and installment exposure.",
          },
          {
            title: "Verification queue",
            description:
              "Review recent payment submissions and pending proof checks.",
          },
          {
            title: "Recovery actions",
            description:
              "Keep follow-ups, classifications, and debtor escalation visible.",
          },
        ].map((item) => (
          <Card key={item.title}>
            <CardHeader>
              <CardTitle>{item.title}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Admin work areas</CardTitle>
          <CardDescription>
            Every major section from the requirements is now routable from the
            administrator interface.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {adminNavigation
              .filter((item) => item.slug !== "dashboard")
              .map((item) => (
                <Link
                  key={item.slug}
                  to={item.url}
                  className="group rounded-xl border border-border/70 bg-card p-5 transition-colors hover:border-foreground/20"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                    <ArrowRightIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                  </div>
                </Link>
              ))}
          </div>
        </CardContent>
      </Card>
    </AdminShell>
  )
}
