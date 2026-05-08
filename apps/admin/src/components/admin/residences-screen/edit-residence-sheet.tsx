import { type FormEvent } from "react"

import { AdminSelect } from "@/components/admin/admin-select"
import { Button } from "@/components/ui/button"
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

import type {
  ResidenceFormState,
  ResidenceStatus,
} from "./model"

type EditResidenceSheetProps = {
  open: boolean
  form: ResidenceFormState
  isLoadingDetail: boolean
  isSubmitting: boolean
  submitError: string | null
  onOpenChange: (open: boolean) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onFormChange: <K extends keyof ResidenceFormState>(
    key: K,
    value: ResidenceFormState[K],
  ) => void
}

export function EditResidenceSheet({
  open,
  form,
  isLoadingDetail,
  isSubmitting,
  submitError,
  onOpenChange,
  onSubmit,
  onFormChange,
}: EditResidenceSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Edit residence</SheetTitle>
          <SheetDescription>
            Update the current residence profile and billing settings from the
            admin app.
          </SheetDescription>
        </SheetHeader>

        <form className="flex h-full flex-col" onSubmit={onSubmit}>
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
                        onChange={(event) =>
                          onFormChange("name", event.target.value)
                        }
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
                          onFormChange(
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
                      onChange={(event) =>
                        onFormChange("address", event.target.value)
                      }
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
                          onFormChange("timezone", event.target.value)
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
                          onFormChange("currency", event.target.value)
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
                          onFormChange("billingCycleDay", event.target.value)
                        }
                        required
                      />
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
              onClick={() => onOpenChange(false)}
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
  )
}
