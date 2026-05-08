import {
  CalendarRangeIcon,
  CircleDollarSignIcon,
  FileSpreadsheetIcon,
  PlusIcon,
  Repeat2Icon,
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

const billingMetrics = [
  {
    title: "Current month due",
    value: "RM 182,400",
    detail: "May 2026 maintenance and sinking fund cycle.",
    icon: CalendarRangeIcon,
  },
  {
    title: "Overdue charges",
    value: "RM 47,920",
    detail: "Open balances still affecting collection priority.",
    icon: CircleDollarSignIcon,
  },
  {
    title: "Bulk generation",
    value: "412 units",
    detail: "Last billing job completed without validation errors.",
    icon: Repeat2Icon,
  },
]

const charges = [
  {
    unit: "A-12-03",
    type: "Maintenance fee",
    description: "Monthly maintenance charge",
    amount: "RM 320.00",
    billingMonth: "May 2026",
    dueDate: "2026-05-10",
    status: "pending",
  },
  {
    unit: "B-08-11",
    type: "Sinking fund",
    description: "Monthly sinking fund contribution",
    amount: "RM 80.00",
    billingMonth: "May 2026",
    dueDate: "2026-05-10",
    status: "partially_paid",
  },
  {
    unit: "A-15-07",
    type: "Special repair fee",
    description: "Lift refurbishment recovery levy",
    amount: "RM 1,500.00",
    billingMonth: "Apr 2026",
    dueDate: "2026-04-12",
    status: "overdue",
  },
  {
    unit: "C-03-02",
    type: "Late fee",
    description: "Late payment penalty",
    amount: "RM 35.00",
    billingMonth: "Mar 2026",
    dueDate: "2026-03-15",
    status: "waived",
  },
]

function chargeStatusVariant(status: string) {
  if (status === "paid") {
    return "success"
  }

  if (status === "partially_paid" || status === "pending") {
    return "warning"
  }

  if (status === "overdue") {
    return "destructive"
  }

  return "outline"
}

export function ChargesScreen() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {billingMetrics.map((metric) => {
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
                <CardTitle>Charge ledger</CardTitle>
                <CardDescription>
                  Issue charges, keep their lifecycle visible, and protect the
                  balance rules that drive arrears reporting.
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline">
                  <FileSpreadsheetIcon />
                  Bulk generate
                </Button>
                <Button>
                  <PlusIcon />
                  Create charge
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <FieldGroup className="grid gap-4 lg:grid-cols-3">
              <Field>
                <FieldLabel>Search unit or charge type</FieldLabel>
                <FieldContent>
                  <Input placeholder="A-12-03, maintenance fee" />
                  <FieldDescription>
                    Inspect charge history before manual corrections.
                  </FieldDescription>
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel>Billing month</FieldLabel>
                <FieldContent>
                  <Input placeholder="May 2026" />
                  <FieldDescription>
                    Scope the ledger to a collection period.
                  </FieldDescription>
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel>Status</FieldLabel>
                <FieldContent>
                  <Input placeholder="pending, overdue, waived" />
                  <FieldDescription>
                    Keep waived and cancelled charges auditable.
                  </FieldDescription>
                </FieldContent>
              </Field>
            </FieldGroup>

            <Separator />

            <div className="space-y-4">
              {charges.map((charge) => (
                <div
                  key={`${charge.unit}-${charge.type}-${charge.billingMonth}`}
                  className="rounded-2xl border border-border/70 bg-card p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-base font-semibold">
                          {charge.type}
                        </p>
                        <Badge variant={chargeStatusVariant(charge.status)}>
                          {charge.status.replaceAll("_", " ")}
                        </Badge>
                      </div>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {charge.description}
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-xl bg-muted/30 p-3">
                          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                            Unit
                          </p>
                          <p className="mt-1 text-sm font-medium">{charge.unit}</p>
                        </div>
                        <div className="rounded-xl bg-muted/30 p-3">
                          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                            Amount
                          </p>
                          <p className="mt-1 text-sm font-medium">
                            {charge.amount}
                          </p>
                        </div>
                        <div className="rounded-xl bg-muted/30 p-3">
                          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                            Billing month
                          </p>
                          <p className="mt-1 text-sm font-medium">
                            {charge.billingMonth}
                          </p>
                        </div>
                        <div className="rounded-xl bg-muted/30 p-3">
                          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                            Due date
                          </p>
                          <p className="mt-1 text-sm font-medium">
                            {charge.dueDate}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm">
                        Unit ledger
                      </Button>
                      <Button size="sm">Edit charge</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Billing controls</CardTitle>
            <CardDescription>
              Charge operations that should remain visible to residence and
              finance administrators.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              "Generate monthly maintenance and sinking fund charges in bulk.",
              "Review waived and cancelled charge actions through the audit trail.",
              "Keep special repair and penalty fees isolated from recurring billing.",
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

