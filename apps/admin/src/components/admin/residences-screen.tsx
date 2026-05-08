import { useEffect, useState, type FormEvent } from "react"
import { useRouter } from "@tanstack/react-router"
import { Building2Icon, CalendarIcon, MapPinIcon, PencilIcon } from "lucide-react"

import {
  adminApiJson,
  UnauthorizedApiError,
} from "@/lib/auth"
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { AdminSelect } from "@/components/admin/admin-select"
import {
  formatTimestamp,
  getErrorMessage,
} from "@/lib/admin-screen-utils"

type ResidenceStatus = "active" | "inactive"

type ResidenceRecord = {
  id: number
  name: string
  address: string
  timezone: string
  currency: string
  billing_cycle_day: number
  status: ResidenceStatus
  created_at: string
  updated_at: string
}

type ResidenceFormState = {
  name: string
  address: string
  timezone: string
  currency: string
  billingCycleDay: string
  status: ResidenceStatus
}

const defaultFormState: ResidenceFormState = {
  name: "",
  address: "",
  timezone: "Asia/Kuala_Lumpur",
  currency: "MYR",
  billingCycleDay: "1",
  status: "active",
}

function residenceToForm(residence: ResidenceRecord): ResidenceFormState {
  return {
    name: residence.name,
    address: residence.address,
    timezone: residence.timezone,
    currency: residence.currency,
    billingCycleDay: String(residence.billing_cycle_day),
    status: residence.status,
  }
}

function buildResidencePayload(form: ResidenceFormState) {
  return {
    name: form.name.trim(),
    address: form.address.trim(),
    timezone: form.timezone.trim(),
    currency: form.currency.trim().toUpperCase(),
    billing_cycle_day: Number(form.billingCycleDay),
    status: form.status,
  }
}

function statusVariant(status: ResidenceStatus) {
  return status === "active" ? "success" : "secondary"
}

export function ResidencesScreen() {
  const router = useRouter()
  const [residences, setResidences] = useState<ResidenceRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [editingResidenceId, setEditingResidenceId] = useState<number | null>(null)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [form, setForm] = useState(defaultFormState)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitNotice, setSubmitNotice] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadResidences() {
      setIsLoading(true)
      setLoadError(null)

      try {
        const nextResidences =
          await adminApiJson<ResidenceRecord[]>("/admin/residences")

        if (cancelled) {
          return
        }

        setResidences(nextResidences)
      } catch (error) {
        if (cancelled) {
          return
        }

        if (error instanceof UnauthorizedApiError) {
          await router.invalidate()
          await router.navigate({ to: "/login" })
          return
        }

        setLoadError(
          getErrorMessage(error, "Unable to load residence settings."),
        )
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadResidences()

    return () => {
      cancelled = true
    }
  }, [refreshKey, router])

  function handleSheetOpenChange(open: boolean) {
    setIsSheetOpen(open)

    if (!open) {
      setEditingResidenceId(null)
      setIsLoadingDetail(false)
      setForm(defaultFormState)
      setSubmitError(null)
      setIsSubmitting(false)
    }
  }

  function updateForm<K extends keyof ResidenceFormState>(
    key: K,
    value: ResidenceFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function openEditSheet(residenceId: number) {
    setEditingResidenceId(residenceId)
    setIsLoadingDetail(true)
    setSubmitError(null)
    setSubmitNotice(null)
    setIsSheetOpen(true)

    try {
      const residence = await adminApiJson<ResidenceRecord>(
        `/admin/residences/${residenceId}`,
      )
      setForm(residenceToForm(residence))
    } catch (error) {
      if (error instanceof UnauthorizedApiError) {
        await router.invalidate()
        await router.navigate({ to: "/login" })
        return
      }

      setSubmitError(
        getErrorMessage(error, "Unable to load this residence for editing."),
      )
    } finally {
      setIsLoadingDetail(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (editingResidenceId === null) {
      return
    }

    setSubmitError(null)
    setSubmitNotice(null)
    setIsSubmitting(true)

    try {
      await adminApiJson<ResidenceRecord>(
        `/admin/residences/${editingResidenceId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(buildResidencePayload(form)),
        },
      )

      setSubmitNotice(`Residence ${form.name.trim()} updated.`)
      handleSheetOpenChange(false)
      setRefreshKey((current) => current + 1)
    } catch (error) {
      if (error instanceof UnauthorizedApiError) {
        await router.invalidate()
        await router.navigate({ to: "/login" })
        return
      }

      setSubmitError(
        getErrorMessage(error, "Unable to save this residence right now."),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const activeResidencesCount = residences.filter(
    (residence) => residence.status === "active",
  ).length

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Accessible residences</CardDescription>
            <div className="flex items-start justify-between gap-3">
              <CardTitle className="text-3xl font-semibold">
                {isLoading ? "--" : residences.length}
              </CardTitle>
              <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
                <Building2Icon className="size-4" />
              </div>
            </div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Active residences</CardDescription>
            <div className="flex items-start justify-between gap-3">
              <CardTitle className="text-3xl font-semibold">
                {isLoading ? "--" : activeResidencesCount}
              </CardTitle>
              <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
                <MapPinIcon className="size-4" />
              </div>
            </div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Billing profiles</CardDescription>
            <div className="flex items-start justify-between gap-3">
              <CardTitle className="text-3xl font-semibold">
                {isLoading ? "--" : residences.length}
              </CardTitle>
              <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
                <CalendarIcon className="size-4" />
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      {submitNotice ? (
        <Card className="border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/20">
          <CardContent className="py-4 text-sm text-emerald-800 dark:text-emerald-300">
            {submitNotice}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Residence settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {loadError ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm leading-6 text-destructive">
              {loadError}
            </div>
          ) : null}

          {isLoading ? (
            <div className="grid gap-4">
              {[0, 1].map((item) => (
                <Card key={item}>
                  <CardContent className="space-y-3 py-5">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : null}

          {!isLoading && !loadError && residences.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 py-10 text-center">
              <p className="text-sm font-medium">
                No residences are available for this admin account.
              </p>
            </div>
          ) : null}

          {!isLoading && !loadError && residences.length > 0 ? (
            <div className="grid gap-4">
              {residences.map((residence) => (
                <Card key={residence.id}>
                  <CardContent className="flex flex-col gap-5 py-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold">{residence.name}</p>
                        <Badge variant={statusVariant(residence.status)}>
                          {residence.status}
                        </Badge>
                      </div>

                      <div className="grid gap-4 text-sm text-muted-foreground sm:grid-cols-2 xl:grid-cols-4">
                        <div>
                          <p className="font-medium text-foreground">Address</p>
                          <p>{residence.address}</p>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Timezone</p>
                          <p>{residence.timezone}</p>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Currency</p>
                          <p>{residence.currency}</p>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            Billing cycle day
                          </p>
                          <p>{residence.billing_cycle_day}</p>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        Last updated {formatTimestamp(residence.updated_at)}.
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          void openEditSheet(residence.id)
                        }}
                      >
                        <PencilIcon />
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Sheet open={isSheetOpen} onOpenChange={handleSheetOpenChange}>
        <SheetContent className="w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Edit residence</SheetTitle>
            <SheetDescription>
              Update the current residence profile and billing settings from the
              admin app.
            </SheetDescription>
          </SheetHeader>

          <form className="flex h-full flex-col" onSubmit={handleSubmit}>
            <div className="flex-1 space-y-6 overflow-y-auto px-4 pb-4">
              {submitError ? (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm leading-6 text-destructive">
                  {submitError}
                </div>
              ) : null}

              {isLoadingDetail ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <>
                  <FieldGroup className="grid gap-4 md:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="residence-name">Name</FieldLabel>
                      <FieldContent>
                        <Input
                          id="residence-name"
                          value={form.name}
                          onChange={(event) => updateForm("name", event.target.value)}
                          placeholder="Residency One"
                          required
                        />
                      </FieldContent>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="residence-status">Status</FieldLabel>
                      <FieldContent>
                        <AdminSelect
                          id="residence-status"
                          value={form.status}
                          onChange={(event) =>
                            updateForm(
                              "status",
                              event.target.value as ResidenceStatus,
                            )
                          }
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </AdminSelect>
                      </FieldContent>
                    </Field>
                  </FieldGroup>

                  <Field>
                    <FieldLabel htmlFor="residence-address">Address</FieldLabel>
                    <FieldContent>
                      <Input
                        id="residence-address"
                        value={form.address}
                        onChange={(event) => updateForm("address", event.target.value)}
                        placeholder="123 Street"
                        required
                      />
                    </FieldContent>
                  </Field>

                  <FieldGroup className="grid gap-4 md:grid-cols-3">
                    <Field>
                      <FieldLabel htmlFor="residence-timezone">Timezone</FieldLabel>
                      <FieldContent>
                        <Input
                          id="residence-timezone"
                          value={form.timezone}
                          onChange={(event) =>
                            updateForm("timezone", event.target.value)
                          }
                          placeholder="Asia/Kuala_Lumpur"
                          required
                        />
                      </FieldContent>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="residence-currency">Currency</FieldLabel>
                      <FieldContent>
                        <Input
                          id="residence-currency"
                          value={form.currency}
                          onChange={(event) =>
                            updateForm("currency", event.target.value)
                          }
                          placeholder="MYR"
                          required
                        />
                      </FieldContent>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="billing-cycle-day">
                        Billing cycle day
                      </FieldLabel>
                      <FieldContent>
                        <Input
                          id="billing-cycle-day"
                          type="number"
                          min="1"
                          max="31"
                          value={form.billingCycleDay}
                          onChange={(event) =>
                            updateForm("billingCycleDay", event.target.value)
                          }
                          required
                        />
                        <FieldDescription>
                          Must stay within the backend `1..31` validation rule.
                        </FieldDescription>
                      </FieldContent>
                    </Field>
                  </FieldGroup>
                </>
              )}
            </div>

            <SheetFooter className="border-t border-border/70 bg-background">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSheetOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || isLoadingDetail}>
                {isSubmitting ? "Saving..." : "Save changes"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
