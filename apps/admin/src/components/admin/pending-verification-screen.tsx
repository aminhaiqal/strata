import {
  BadgeAlertIcon,
  BellRingIcon,
  CheckCheckIcon,
  FileImageIcon,
  SearchIcon,
  XIcon,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
    title: "Pending submissions",
    value: "14",
    detail: "Proofs waiting for verification before balances can move.",
    icon: BellRingIcon,
  },
  {
    title: "Pending amount",
    value: "RM 18,940",
    detail: "Submitted totals that must not reduce verified outstanding balance.",
    icon: BadgeAlertIcon,
  },
  {
    title: "Avg. wait time",
    value: "9.4h",
    detail: "Current median time from resident submission to admin decision.",
    icon: CheckCheckIcon,
  },
]

const queue = [
  {
    resident: "Chloe Tan",
    unit: "B-08-11",
    amount: "RM 640.00",
    method: "Bank transfer",
    reference: "CIMB-20260507-1881",
    submittedAt: "2026-05-07 09:10",
    uploadedBy: "Resident linked to unit",
    outstanding: "RM 1,240.00",
    note: "Resident says this covers April arrears and May maintenance fee.",
    risk: "same_day",
  },
  {
    resident: "Mohd Firdaus",
    unit: "A-15-07",
    amount: "RM 1,200.00",
    method: "Cashier receipt",
    reference: "MANUAL-REC-0441",
    submittedAt: "2026-05-06 16:42",
    uploadedBy: "Finance admin on behalf of resident",
    outstanding: "RM 4,880.00",
    note: "Installment plan payment two of four. Allocation required after verification.",
    risk: "installment",
  },
  {
    resident: "Yap Wei Ming",
    unit: "C-03-02",
    amount: "RM 420.00",
    method: "Online banking",
    reference: "MAYBANK-885102",
    submittedAt: "2026-05-05 20:18",
    uploadedBy: "Owner app upload",
    outstanding: "RM 420.00",
    note: "Reference image is partially cropped and may need manual review.",
    risk: "needs_review",
  },
]

function riskVariant(risk: string) {
  if (risk === "same_day") {
    return "warning"
  }

  if (risk === "needs_review") {
    return "destructive"
  }

  return "secondary"
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}

export function PendingVerificationScreen() {
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

      <Card>
        <CardHeader>
          <CardTitle>Verification queue</CardTitle>
          <CardDescription>
            Review each payment proof before it affects balances, allocations, or
            unit classification.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FieldGroup className="grid gap-4 lg:grid-cols-3">
            <Field>
              <FieldLabel>Search resident or reference</FieldLabel>
              <FieldContent>
                <Input placeholder="Chloe Tan, CIMB-20260507-1881" />
                <FieldDescription>
                  Search queue items by resident, unit, or transaction reference.
                </FieldDescription>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>Payment method</FieldLabel>
              <FieldContent>
                <Input placeholder="Bank transfer, cashier receipt" />
                <FieldDescription>
                  Group proofs by verification workflow or document type.
                </FieldDescription>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>Submission age</FieldLabel>
              <FieldContent>
                <Input placeholder="Today, > 24h, installment queue" />
                <FieldDescription>
                  Prioritize older submissions before disputes escalate.
                </FieldDescription>
              </FieldContent>
            </Field>
          </FieldGroup>

          <Separator />

          <div className="space-y-4">
            {queue.map((payment) => (
              <div
                key={`${payment.unit}-${payment.reference}`}
                className="rounded-2xl border border-border/70 bg-card p-5"
              >
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <Avatar className="h-10 w-10 rounded-xl">
                        <AvatarFallback className="rounded-xl">
                          {initials(payment.resident)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-base font-semibold">
                          {payment.resident}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Unit {payment.unit} · Submitted {payment.submittedAt}
                        </p>
                      </div>
                      <Badge variant={riskVariant(payment.risk)}>
                        {payment.risk.replaceAll("_", " ")}
                      </Badge>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-xl bg-muted/30 p-3">
                        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                          Amount
                        </p>
                        <p className="mt-1 text-sm font-medium">
                          {payment.amount}
                        </p>
                      </div>
                      <div className="rounded-xl bg-muted/30 p-3">
                        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                          Method
                        </p>
                        <p className="mt-1 text-sm font-medium">
                          {payment.method}
                        </p>
                      </div>
                      <div className="rounded-xl bg-muted/30 p-3">
                        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                          Reference
                        </p>
                        <p className="mt-1 text-sm font-medium">
                          {payment.reference}
                        </p>
                      </div>
                      <div className="rounded-xl bg-muted/30 p-3">
                        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                          Outstanding
                        </p>
                        <p className="mt-1 text-sm font-medium">
                          {payment.outstanding}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-4">
                      <p className="text-sm font-medium">Submission context</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {payment.note}
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Uploaded by: {payment.uploadedBy}
                      </p>
                    </div>
                  </div>

                  <div className="flex min-w-60 flex-col gap-2">
                    <Button variant="outline">
                      <SearchIcon />
                      Inspect proof
                    </Button>
                    <Button>
                      <CheckCheckIcon />
                      Verify payment
                    </Button>
                    <Button variant="destructive">
                      <XIcon />
                      Reject payment
                    </Button>
                    <Button variant="ghost">
                      <FileImageIcon />
                      Open receipt history
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

