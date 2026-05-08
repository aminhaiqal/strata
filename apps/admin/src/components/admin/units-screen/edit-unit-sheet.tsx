import { type FormEvent } from "react"

import { AdminSelect } from "@/components/admin/admin-select"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"

import type {
  BlockRecord,
  UnitFormState,
  UnitStatus,
} from "./model"

type EditUnitSheetProps = {
  open: boolean
  sheetMode: "create" | "edit"
  form: UnitFormState
  blocks: BlockRecord[]
  blocksError: string | null
  isLoadingBlocks: boolean
  isLoadingUnitDetail: boolean
  isSubmitting: boolean
  submitError: string | null
  onOpenChange: (open: boolean) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onFormChange: <K extends keyof UnitFormState>(
    key: K,
    value: UnitFormState[K],
  ) => void
  onGoToBlocks: () => void
}

export function EditUnitSheet({
  open,
  sheetMode,
  form,
  blocks,
  blocksError,
  isLoadingBlocks,
  isLoadingUnitDetail,
  isSubmitting,
  submitError,
  onOpenChange,
  onSubmit,
  onFormChange,
  onGoToBlocks,
}: EditUnitSheetProps) {
  const isEditMode = sheetMode === "edit"

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{isEditMode ? "Edit unit" : "Add unit"}</SheetTitle>
        </SheetHeader>

        <form className="flex h-full flex-col" onSubmit={onSubmit}>
          <div className="flex-1 space-y-6 overflow-y-auto px-4 pb-4">
            {submitError ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm leading-6 text-destructive">
                {submitError}
              </div>
            ) : null}

            {!isLoadingUnitDetail && !blocksError && blocks.length === 0 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300">
                <p>
                  Units must be assigned to a block. Create a block first, then
                  return here to add the unit.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-3"
                  onClick={onGoToBlocks}
                >
                  Go to Blocks & buildings
                </Button>
              </div>
            ) : null}

            {isLoadingUnitDetail ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-36 w-full" />
              </div>
            ) : (
              <>
                <FieldGroup className="grid gap-4 md:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="block-id">Block</FieldLabel>
                    <FieldContent>
                      <AdminSelect
                        id="block-id"
                        value={form.blockId}
                        onChange={(event) => onFormChange("blockId", event.target.value)}
                        required
                        disabled={isLoadingBlocks || blocks.length === 0}
                      >
                        <option value="">Select a block</option>
                        {blocks.map((block) => (
                          <option key={block.id} value={String(block.id)}>
                            {block.name}
                          </option>
                        ))}
                      </AdminSelect>
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="unit-number">Unit number</FieldLabel>
                    <FieldContent>
                      <Input
                        id="unit-number"
                        value={form.unitNumber}
                        onChange={(event) =>
                          onFormChange("unitNumber", event.target.value)
                        }
                        placeholder="A-10-01"
                        required
                      />
                    </FieldContent>
                  </Field>
                </FieldGroup>

                <FieldGroup className="grid gap-4 md:grid-cols-3">
                  <Field>
                    <FieldLabel htmlFor="floor">Floor</FieldLabel>
                    <FieldContent>
                      <Input
                        id="floor"
                        value={form.floor}
                        onChange={(event) => onFormChange("floor", event.target.value)}
                        placeholder="10"
                      />
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="unit-type">Unit type</FieldLabel>
                    <FieldContent>
                      <Input
                        id="unit-type"
                        value={form.unitType}
                        onChange={(event) =>
                          onFormChange("unitType", event.target.value)
                        }
                        placeholder="standard"
                      />
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="unit-status">Status</FieldLabel>
                    <FieldContent>
                      <AdminSelect
                        id="unit-status"
                        value={form.status}
                        onChange={(event) =>
                          onFormChange("status", event.target.value as UnitStatus)
                        }
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </AdminSelect>
                    </FieldContent>
                  </Field>
                </FieldGroup>

                <FieldGroup className="grid gap-4 md:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="owner-name">Owner name</FieldLabel>
                    <FieldContent>
                      <Input
                        id="owner-name"
                        value={form.ownerName}
                        onChange={(event) =>
                          onFormChange("ownerName", event.target.value)
                        }
                        placeholder="Alice Owner"
                      />
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="owner-email">Owner email</FieldLabel>
                    <FieldContent>
                      <Input
                        id="owner-email"
                        type="email"
                        value={form.ownerEmail}
                        onChange={(event) =>
                          onFormChange("ownerEmail", event.target.value)
                        }
                        placeholder="alice@example.com"
                      />
                    </FieldContent>
                  </Field>
                </FieldGroup>

                <FieldGroup className="grid gap-4 md:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="owner-phone">Owner phone</FieldLabel>
                    <FieldContent>
                      <Input
                        id="owner-phone"
                        value={form.ownerPhone}
                        onChange={(event) =>
                          onFormChange("ownerPhone", event.target.value)
                        }
                        placeholder="0123456789"
                      />
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="occupancy-status">Occupancy</FieldLabel>
                    <FieldContent>
                      <AdminSelect
                        id="occupancy-status"
                        value={form.isOccupied}
                        onChange={(event) =>
                          onFormChange(
                            "isOccupied",
                            event.target.value as UnitFormState["isOccupied"],
                          )
                        }
                      >
                        <option value="true">Occupied</option>
                        <option value="false">Vacant</option>
                      </AdminSelect>
                    </FieldContent>
                  </Field>
                </FieldGroup>

                <Separator />

                <FieldGroup className="grid gap-4 md:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="tenant-name">Tenant name</FieldLabel>
                    <FieldContent>
                      <Input
                        id="tenant-name"
                        value={form.tenantName}
                        onChange={(event) =>
                          onFormChange("tenantName", event.target.value)
                        }
                        placeholder="Bob Tenant"
                      />
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="tenant-email">Tenant email</FieldLabel>
                    <FieldContent>
                      <Input
                        id="tenant-email"
                        type="email"
                        value={form.tenantEmail}
                        onChange={(event) =>
                          onFormChange("tenantEmail", event.target.value)
                        }
                        placeholder="bob@example.com"
                      />
                    </FieldContent>
                  </Field>
                </FieldGroup>

                <Field>
                  <FieldLabel htmlFor="tenant-phone">Tenant phone</FieldLabel>
                  <FieldContent>
                    <Input
                      id="tenant-phone"
                      value={form.tenantPhone}
                      onChange={(event) =>
                        onFormChange("tenantPhone", event.target.value)
                      }
                      placeholder="0199999999"
                    />
                  </FieldContent>
                </Field>
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
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                isLoadingUnitDetail ||
                isLoadingBlocks ||
                blocks.length === 0
              }
            >
              {isSubmitting
                ? isEditMode
                  ? "Saving..."
                  : "Creating..."
                : isEditMode
                  ? "Save changes"
                  : "Create unit"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
