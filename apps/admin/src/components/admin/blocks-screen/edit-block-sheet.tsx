import { type FormEvent } from "react"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"

import type { BlockFormState } from "./model"

type EditBlockSheetProps = {
  open: boolean
  sheetMode: "create" | "edit"
  form: BlockFormState
  isLoadingDetail: boolean
  isSubmitting: boolean
  submitError: string | null
  onOpenChange: (open: boolean) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onFormChange: <K extends keyof BlockFormState>(
    key: K,
    value: BlockFormState[K],
  ) => void
}

export function EditBlockSheet({
  open,
  sheetMode,
  form,
  isLoadingDetail,
  isSubmitting,
  submitError,
  onOpenChange,
  onSubmit,
  onFormChange,
}: EditBlockSheetProps) {
  const isEditMode = sheetMode === "edit"

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{isEditMode ? "Edit block" : "Add block"}</SheetTitle>
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
                <Skeleton className="h-24 w-full" />
              </div>
            ) : (
              <>
                <Field>
                  <FieldLabel htmlFor="block-name">Name</FieldLabel>
                  <FieldContent>
                    <Input
                      id="block-name"
                      value={form.name}
                      onChange={(event) => onFormChange("name", event.target.value)}
                      placeholder="Tower A"
                      required
                    />
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel htmlFor="block-description">Description</FieldLabel>
                  <FieldContent>
                    <Input
                      id="block-description"
                      value={form.description}
                      onChange={(event) =>
                        onFormChange("description", event.target.value)
                      }
                      placeholder="Main residential tower"
                    />
                    <FieldDescription>
                      Optional context for administrators managing units inside
                      this block.
                    </FieldDescription>
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
            <Button type="submit" disabled={isSubmitting || isLoadingDetail}>
              {isSubmitting
                ? isEditMode
                  ? "Saving..."
                  : "Creating..."
                : isEditMode
                  ? "Save changes"
                  : "Create block"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
