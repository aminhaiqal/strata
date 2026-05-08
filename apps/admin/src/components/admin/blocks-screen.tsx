import { useEffect, useMemo, useState, type FormEvent } from "react"
import { useRouter } from "@tanstack/react-router"

import {
  adminApiJson,
  UnauthorizedApiError,
} from "@/lib/auth"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { getErrorMessage } from "@/lib/admin-screen-utils"
import { BlockList } from "./blocks-screen/block-list"
import { EditBlockSheet } from "./blocks-screen/edit-block-sheet"
import {
  blockToForm,
  buildBlockPayload,
  defaultFormState,
} from "./blocks-screen/model"
import type {
  BlockFormState,
  BlockRecord,
} from "./blocks-screen/model"
import { BlockStats } from "./blocks-screen/block-stats"

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
      <BlockStats
        isLoading={isLoading}
        visibleBlocksCount={visibleBlocks.length}
        totalBlocksCount={blocks.length}
        describedBlocksCount={describedBlocksCount}
      />

      {submitNotice ? (
        <Card className="border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/20">
          <CardContent className="py-4 text-sm text-emerald-800 dark:text-emerald-300">
            {submitNotice}
          </CardContent>
        </Card>
      ) : null}

      <BlockList
        search={search}
        isLoading={isLoading}
        loadError={loadError}
        visibleBlocks={visibleBlocks}
        onSearchChange={setSearch}
        onCreate={openCreateSheet}
        onEdit={(blockId) => {
          void openEditSheet(blockId)
        }}
      />

      <EditBlockSheet
        open={isSheetOpen}
        sheetMode={sheetMode}
        form={form}
        isLoadingDetail={isLoadingDetail}
        isSubmitting={isSubmitting}
        submitError={submitError}
        onOpenChange={handleSheetOpenChange}
        onSubmit={handleSubmit}
        onFormChange={updateForm}
      />
    </div>
  )
}
