import {
  useEffect,
  useState,
  type FormEvent,
} from "react"
import { useRouter } from "@tanstack/react-router"

import {
  UnauthorizedApiError,
  adminApiJson,
} from "@/lib/auth"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { getErrorMessage } from "@/lib/admin-screen-utils"
import { EditUnitSheet } from "./units-screen/edit-unit-sheet"
import {
  buildUnitPayload,
  defaultFilters,
  defaultFormState,
  unitToForm,
} from "./units-screen/model"
import type {
  BlockRecord,
  UnitFilters,
  UnitFormState,
  UnitRecord,
} from "./units-screen/model"
import { UnitRegistry } from "./units-screen/unit-registry"
import { UnitStats } from "./units-screen/unit-stats"

export function UnitsScreen() {
  const router = useRouter()
  const [blocks, setBlocks] = useState<BlockRecord[]>([])
  const [units, setUnits] = useState<UnitRecord[]>([])
  const [filters, setFilters] = useState(defaultFilters)
  const [isLoadingBlocks, setIsLoadingBlocks] = useState(true)
  const [isLoadingUnits, setIsLoadingUnits] = useState(true)
  const [blocksError, setBlocksError] = useState<string | null>(null)
  const [unitsError, setUnitsError] = useState<string | null>(null)
  const [refreshUnitsKey, setRefreshUnitsKey] = useState(0)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [sheetMode, setSheetMode] = useState<"create" | "edit">("create")
  const [editingUnitId, setEditingUnitId] = useState<number | null>(null)
  const [isLoadingUnitDetail, setIsLoadingUnitDetail] = useState(false)
  const [form, setForm] = useState(defaultFormState)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitNotice, setSubmitNotice] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadBlocks() {
      setIsLoadingBlocks(true)
      setBlocksError(null)

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

        setBlocksError(
          getErrorMessage(error, "Unable to load blocks for this residence."),
        )
      } finally {
        if (!cancelled) {
          setIsLoadingBlocks(false)
        }
      }
    }

    void loadBlocks()

    return () => {
      cancelled = true
    }
  }, [router])

  useEffect(() => {
    let cancelled = false

    async function loadUnits() {
      setIsLoadingUnits(true)
      setUnitsError(null)

      const params = new URLSearchParams()

      if (filters.search.trim()) {
        params.set("search", filters.search.trim())
      }

      if (filters.blockId) {
        params.set("block_id", filters.blockId)
      }

      if (filters.status !== "all") {
        params.set("status", filters.status)
      }

      if (filters.occupancy !== "all") {
        params.set("is_occupied", filters.occupancy)
      }

      const path = params.size ? `/admin/units?${params.toString()}` : "/admin/units"

      try {
        const nextUnits = await adminApiJson<UnitRecord[]>(path)

        if (cancelled) {
          return
        }

        setUnits(nextUnits)
      } catch (error) {
        if (cancelled) {
          return
        }

        if (error instanceof UnauthorizedApiError) {
          await router.invalidate()
          await router.navigate({ to: "/login" })
          return
        }

        setUnitsError(
          getErrorMessage(error, "Unable to load units for this residence."),
        )
      } finally {
        if (!cancelled) {
          setIsLoadingUnits(false)
        }
      }
    }

    void loadUnits()

    return () => {
      cancelled = true
    }
  }, [
    filters.blockId,
    filters.occupancy,
    filters.search,
    filters.status,
    refreshUnitsKey,
    router,
  ])

  function resetSheetState() {
    setForm(defaultFormState)
    setSubmitError(null)
    setEditingUnitId(null)
    setIsLoadingUnitDetail(false)
    setIsSubmitting(false)
    setSheetMode("create")
  }

  function handleSheetOpenChange(open: boolean) {
    setIsSheetOpen(open)

    if (!open) {
      resetSheetState()
    }
  }

  function updateForm<K extends keyof UnitFormState>(
    key: K,
    value: UnitFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function updateFilter<K extends keyof UnitFilters>(
    key: K,
    value: UnitFilters[K],
  ) {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  function openCreateSheet() {
    setSubmitNotice(null)
    setSheetMode("create")
    setForm(defaultFormState)
    setSubmitError(null)
    setEditingUnitId(null)
    setIsSheetOpen(true)
  }

  async function openEditSheet(unitId: number) {
    setSubmitNotice(null)
    setSheetMode("edit")
    setEditingUnitId(unitId)
    setSubmitError(null)
    setIsLoadingUnitDetail(true)
    setIsSheetOpen(true)

    try {
      const unit = await adminApiJson<UnitRecord>(`/admin/units/${unitId}`)
      setForm(unitToForm(unit))
    } catch (error) {
      if (error instanceof UnauthorizedApiError) {
        await router.invalidate()
        await router.navigate({ to: "/login" })
        return
      }

      setSubmitError(
        getErrorMessage(error, "Unable to load this unit for editing."),
      )
    } finally {
      setIsLoadingUnitDetail(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitError(null)
    setSubmitNotice(null)
    setIsSubmitting(true)

    try {
      if (sheetMode === "edit" && editingUnitId !== null) {
        await adminApiJson<UnitRecord>(`/admin/units/${editingUnitId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(buildUnitPayload(form)),
        })
        setSubmitNotice(`Unit ${form.unitNumber.trim()} updated.`)
      } else {
        await adminApiJson<UnitRecord>("/admin/units", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(buildUnitPayload(form)),
        })
        setSubmitNotice(`Unit ${form.unitNumber.trim()} created.`)
      }

      handleSheetOpenChange(false)
      setRefreshUnitsKey((current) => current + 1)
    } catch (error) {
      if (error instanceof UnauthorizedApiError) {
        await router.invalidate()
        await router.navigate({ to: "/login" })
        return
      }

      setSubmitError(
        getErrorMessage(error, "Unable to save this unit right now."),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  function getBlockName(blockId: number): string {
    return blocks.find((block) => block.id === blockId)?.name ?? `Block #${blockId}`
  }

  const activeUnitsCount = units.filter((unit) => unit.status === "active").length
  const occupiedUnitsCount = units.filter((unit) => unit.is_occupied).length

  return (
    <div className="space-y-6">
      <UnitStats
        isLoadingUnits={isLoadingUnits}
        visibleUnitsCount={units.length}
        activeUnitsCount={activeUnitsCount}
        occupiedUnitsCount={occupiedUnitsCount}
      />

      {submitNotice ? (
        <Card className="border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/20">
          <CardContent className="py-4 text-sm text-emerald-800 dark:text-emerald-300">
            {submitNotice}
          </CardContent>
        </Card>
      ) : null}

      <UnitRegistry
        blocks={blocks}
        units={units}
        filters={filters}
        isLoadingBlocks={isLoadingBlocks}
        isLoadingUnits={isLoadingUnits}
        blocksError={blocksError}
        unitsError={unitsError}
        onFilterChange={updateFilter}
        onCreate={openCreateSheet}
        onEdit={(unitId) => {
          void openEditSheet(unitId)
        }}
        getBlockName={getBlockName}
      />

      <EditUnitSheet
        open={isSheetOpen}
        sheetMode={sheetMode}
        form={form}
        blocks={blocks}
        blocksError={blocksError}
        isLoadingBlocks={isLoadingBlocks}
        isLoadingUnitDetail={isLoadingUnitDetail}
        isSubmitting={isSubmitting}
        submitError={submitError}
        onOpenChange={handleSheetOpenChange}
        onSubmit={handleSubmit}
        onFormChange={updateForm}
        onGoToBlocks={() => {
          handleSheetOpenChange(false)
          void router.navigate({
            to: "/dashboard/$section/$subsection",
            params: {
              section: "residences",
              subsection: "blocks-buildings",
            },
          })
        }}
      />
    </div>
  )
}
