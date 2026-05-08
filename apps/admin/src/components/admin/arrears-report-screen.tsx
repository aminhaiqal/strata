import {
  ArrowDownWideNarrowIcon,
  DownloadIcon,
  FileWarningIcon,
  PhoneCallIcon,
  TrendingUpIcon,
  WalletCardsIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"

const metrics = [
  {
    title: "Total outstanding",
    value: "RM 418,620",
    detail: "Verified unpaid balance across all active units.",
    icon: WalletCardsIcon,
  },
  {
    title: "Long overdue",
    value: "67 units",
    detail: "Units with oldest unpaid due dates beyond 60 days.",
    icon: FileWarningIcon,
  },
  {
    title: "Collection trend",
    value: "+8.4%",
    detail: "Improvement against the previous monthly collection cycle.",
    icon: TrendingUpIcon,
  },
]

const debtors = [
  {
    unit: "A-15-07",
    resident: "Siti Khatijah",
    classification: "on_installment",
    outstanding: "RM 4,880.00",
    oldestDue: "2025-12-10",
    monthsOverdue: "5",
    followUp: "Promised to pay on 2026-05-12",
  },
  {
    unit: "B-08-11",
    resident: "Daniel Lim",
    classification: "pending_verification",
    outstanding: "RM 1,240.00",
    oldestDue: "2026-03-10",
    monthsOverdue: "2",
    followUp: "Awaiting payment verification before next notice",
  },
  {
    unit: "D-02-05",
    resident: "Ng Siew Lan",
    classification: "legacy_debtor",
    outstanding: "RM 13,420.00",
    oldestDue: "2024-11-10",
    monthsOverdue: "17",
    followUp: "Escalated for legal warning review",
  },
  {
    unit: "C-10-09",
    resident: "Khairul Azman",
    classification: "never_paid",
    outstanding: "RM 6,080.00",
    oldestDue: "2025-08-10",
    monthsOverdue: "9",
    followUp: "No response after phone and WhatsApp follow-up",
  },
]

function classificationVariant(classification: string) {
  if (classification === "pending_verification") {
    return "warning"
  }

  if (classification === "legacy_debtor" || classification === "never_paid") {
    return "destructive"
  }

  if (classification === "on_installment") {
    return "secondary"
  }

  return "outline"
}

export function ArrearsReportScreen() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {metrics.map((metric) => {
          const Icon = metric.icon

          return (
            <Card key={metric.title}>
              <CardHeader>
                <CardDescription>{metric.title}</CardDescription>
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-3xl font-semibold">
                    {metric.value}
                  </CardTitle>
                  <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
                    <Icon className="size-4" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-muted-foreground">
                  {metric.detail}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.85fr)]">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <CardTitle>Arrears priority list</CardTitle>
                <CardDescription>
                  This report ranks units by verified exposure, overdue age, and
                  collection risk so follow-up efforts are focused correctly.
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline">
                  <ArrowDownWideNarrowIcon />
                  Re-rank
                </Button>
                <Button>
                  <DownloadIcon />
                  Export CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <FieldGroup className="grid gap-4 lg:grid-cols-3">
              <Field>
                <FieldLabel>Search unit or resident</FieldLabel>
                <FieldContent>
                  <Input placeholder="A-15-07, Ng Siew Lan" />
                  <FieldDescription>
                    Jump directly to a debtor before starting outreach.
                  </FieldDescription>
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel>Classification</FieldLabel>
                <FieldContent>
                  <Input placeholder="legacy_debtor, never_paid" />
                  <FieldDescription>
                    Filter by collection severity or workflow type.
                  </FieldDescription>
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel>Months overdue</FieldLabel>
                <FieldContent>
                  <Input placeholder="> 6, 2-6, on_installment" />
                  <FieldDescription>
                    Segment units before follow-up batching.
                  </FieldDescription>
                </FieldContent>
              </Field>
            </FieldGroup>

            <Separator />

            <div className="space-y-4">
              {debtors.map((debtor) => (
                <div
                  key={debtor.unit}
                  className="rounded-2xl border border-border/70 bg-card p-5"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-base font-semibold">{debtor.unit}</p>
                        <p className="text-sm text-muted-foreground">
                          {debtor.resident}
                        </p>
                        <Badge variant={classificationVariant(debtor.classification)}>
                          {debtor.classification.replaceAll("_", " ")}
                        </Badge>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-xl bg-muted/30 p-3">
                          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                            Outstanding
                          </p>
                          <p className="mt-1 text-sm font-medium">
                            {debtor.outstanding}
                          </p>
                        </div>
                        <div className="rounded-xl bg-muted/30 p-3">
                          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                            Oldest due date
                          </p>
                          <p className="mt-1 text-sm font-medium">
                            {debtor.oldestDue}
                          </p>
                        </div>
                        <div className="rounded-xl bg-muted/30 p-3">
                          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                            Months overdue
                          </p>
                          <p className="mt-1 text-sm font-medium">
                            {debtor.monthsOverdue}
                          </p>
                        </div>
                        <div className="rounded-xl bg-muted/30 p-3">
                          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                            Follow-up
                          </p>
                          <p className="mt-1 text-sm font-medium">
                            {debtor.followUp}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm">
                        View unit
                      </Button>
                      <Button size="sm">
                        <PhoneCallIcon />
                        Add follow-up
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Report guidance</CardTitle>
            <CardDescription>
              The arrears report should remain the main operating view for
              collection prioritization.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              "Use verified outstanding balance, not pending submissions, when ranking debtors.",
              "Keep longest overdue and never-paid units visible for escalation planning.",
              "Link follow-up activity and installment status back into prioritization decisions.",
            ].map((item) => (
              <div
                key={item}
                className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-4 text-sm leading-6 text-muted-foreground"
              >
                {item}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

