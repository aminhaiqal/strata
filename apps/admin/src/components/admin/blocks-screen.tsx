import { useEffect, useMemo, useState, type FormEvent } from "react"
import { useRouter } from "@tanstack/react-router"
import {
  Building2Icon,
  PencilIcon,
  PlusIcon,
  Rows3Icon,
} from "lucide-react"

import {
  adminApiJson,
  UnauthorizedApiError,
} from "@/lib/auth"
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
import {
  formatTimestamp,
  getErrorMessage,
} from "@/lib/admin-screen-utils"

type BlockRecord = {
  id: number
  residence_id: number
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

type BlockFormState = {
  name: string
  description: string
}

const defaultFormState: BlockFormState = {
  name: "",
  description: "",
}

function blockToForm(block: BlockRecord): BlockFormState {
  return {
    name: block.name,
    description: block.description ?? "",
  }
}

function toOptionalString(value: string): string | null {
  const trimmedValue = value.trim()
  return trimmedValue ? trimmedValue : null
}

function buildBlockPayload(form: BlockFormState) {
  return {
    name: form.name.trim(),
    description: toOptionalString(form.description),
  }
}

export function BlocksScreen() {
  const router = useRouter()
  const [blocks, setBlocks] = useState<BlockRecord[]>([])
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [sheetMode, setSheetMode] = useState<"create" | "edit">("create")
  const [editingBlockId, setEditingBlockId] = useState<number | null>(null)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [form, setForm] = useState(defaultFormState)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitNotice, setSubmitNotice] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadBlocks() {
      setIsLoading(true)
      setLoadError(null)

      try {
        const nextBlocks = await adminApiJson<BlockRecord[]>("/admin/blocks")

        if (cancelled) {
          return
        }

        setBlocks(nextBlocks)
      } catch (error) {
        if (cancelled) {
          return
        }

        if (error instanceof UnauthorizedApiError) {
          await router.invalidate()
          await router.navigate({ to: "/login" })
          return
        }

        setLoadError(getErrorMessage(error, "Unable to load blocks."))
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadBlocks()

    return () => {
      cancelled = true
    }
  }, [refreshKey, router])

  function handleSheetOpenChange(open: boolean) {
    setIsSheetOpen(open)

    if (!open) {
      setSheetMode("create")
      setEditingBlockId(null)
      setIsLoadingDetail(false)
      setForm(defaultFormState)
      setSubmitError(null)
      setIsSubmitting(false)
    }
  }

  function updateForm<K extends keyof BlockFormState>(
    key: K,
    value: BlockFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function openCreateSheet() {
    setSheetMode("create")
    setEditingBlockId(null)
    setForm(defaultFormState)
    setSubmitError(null)
    setSubmitNotice(null)
    setIsSheetOpen(true)
  }

  async function openEditSheet(blockId: number) {
    setSheetMode("edit")
    setEditingBlockId(blockId)
    setIsLoadingDetail(true)
    setSubmitError(null)
    setSubmitNotice(null)
    setIsSheetOpen(true)

    try {
      const block = await adminApiJson<BlockRecord>(`/admin/blocks/${blockId}`)
      setForm(blockToForm(block))
    } catch (error) {
      if (error instanceof UnauthorizedApiError) {
        await router.invalidate()
        await router.navigate({ to: "/login" })
        return
      }

      setSubmitError(
        getErrorMessage(error, "Unable to load this block for editing."),
      )
    } finally {
      setIsLoadingDetail(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitError(null)
    setSubmitNotice(null)
    setIsSubmitting(true)

    try {
      if (sheetMode === "edit" && editingBlockId !== null) {
        await adminApiJson<BlockRecord>(`/admin/blocks/${editingBlockId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(buildBlockPayload(form)),
        })
        setSubmitNotice(`Block ${form.name.trim()} updated.`)
      } else {
        await adminApiJson<BlockRecord>("/admin/blocks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(buildBlockPayload(form)),
        })
        setSubmitNotice(`Block ${form.name.trim()} created.`)
      }

      handleSheetOpenChange(false)
      setRefreshKey((current) => current + 1)
    } catch (error) {
      if (error instanceof UnauthorizedApiError) {
        await router.invalidate()
        await router.navigate({ to: "/login" })
        return
      }

      setSubmitError(
        getErrorMessage(error, "Unable to save this block right now."),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const visibleBlocks = useMemo(() => {
    const searchValue = search.trim().toLowerCase()

    if (!searchValue) {
      return blocks
    }

    return blocks.filter((block) =>
      `${block.name} ${block.description ?? ""}`.toLowerCase().includes(searchValue),
    )
  }, [blocks, search])

  const describedBlocksCount = blocks.filter((block) => block.description).length

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Visible blocks</CardDescription>
            <div className="flex items-start justify-between gap-3">
              <CardTitle className="text-3xl font-semibold">
                {isLoading ? "--" : visibleBlocks.length}
              </CardTitle>
              <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
                <Rows3Icon className="size-4" />
              </div>
            </div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Total block records</CardDescription>
            <div className="flex items-start justify-between gap-3">
              <CardTitle className="text-3xl font-semibold">
                {isLoading ? "--" : blocks.length}
              </CardTitle>
              <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
                <Building2Icon className="size-4" />
              </div>
            </div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Described blocks</CardDescription>
            <div className="flex items-start justify-between gap-3">
              <CardTitle className="text-3xl font-semibold">
                {isLoading ? "--" : describedBlocksCount}
              </CardTitle>
              <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
                <PencilIcon className="size-4" />
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
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <CardTitle>Blocks & buildings</CardTitle>
            </div>
            <Button onClick={openCreateSheet}>
              <PlusIcon />
              Add block
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Field orientation="horizontal">
            <Input
                id="block-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tower A, podium, annex"
              />
              <Button>Search</Button>
          </Field>

          {loadError ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm leading-6 text-destructive">
              {loadError}
            </div>
          ) : null}

          {isLoading ? (
            <div className="grid gap-4">
              {[0, 1, 2].map((item) => (
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

          {!isLoading && !loadError && visibleBlocks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 py-10 text-center">
              <p className="text-sm font-medium">
                No blocks match the current search.
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Adjust the filter or create the first block for this residence.
              </p>
            </div>
          ) : null}

          {!isLoading && !loadError && visibleBlocks.length > 0 ? (
            <div className="grid gap-4">
              {visibleBlocks.map((block) => (
                <Card key={block.id}>
                  <CardContent className="flex flex-col gap-5 py-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div>
                        <p className="text-base font-semibold">{block.name}</p>
                        <p className="text-sm leading-6 text-muted-foreground">
                          {block.description ?? "No description added yet."}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Last updated {formatTimestamp(block.updated_at)}.
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          void openEditSheet(block.id)
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
            <SheetTitle>
              {sheetMode === "edit" ? "Edit block" : "Add block"}
            </SheetTitle>
            <SheetDescription>
              {sheetMode === "edit"
                ? "Load one block from `GET /admin/blocks/{block_id}` and save changes with `PATCH /admin/blocks/{block_id}`."
                : "Create a new block or building record with `POST /admin/blocks`."}
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
                        onChange={(event) => updateForm("name", event.target.value)}
                        placeholder="Tower A"
                        required
                      />
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="block-description">
                      Description
                    </FieldLabel>
                    <FieldContent>
                      <Input
                        id="block-description"
                        value={form.description}
                        onChange={(event) =>
                          updateForm("description", event.target.value)
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
                onClick={() => handleSheetOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || isLoadingDetail}>
                {isSubmitting
                  ? sheetMode === "edit"
                    ? "Saving..."
                    : "Creating..."
                  : sheetMode === "edit"
                    ? "Save changes"
                    : "Create block"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
