import {
  useEffect,
  useState,
  type FormEvent,
} from "react"
import { useRouter } from "@tanstack/react-router"
import {
  Building2Icon,
  HomeIcon,
  PlusIcon,
  UsersIcon,
} from "lucide-react"

import {
  UnauthorizedApiError,
  adminApiJson,
} from "@/lib/auth"
import { AdminSelect } from "@/components/admin/admin-select"
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

type UnitStatus = "active" | "inactive"

type UnitRecord = {
  id: number
  residence_id: number
  block_id: number
  unit_number: string
  floor: string | null
  unit_type: string | null
  owner_name: string | null
  owner_phone: string | null
  owner_email: string | null
  tenant_name: string | null
  tenant_phone: string | null
  tenant_email: string | null
  is_occupied: boolean
  status: UnitStatus
  created_at: string
  updated_at: string
}

type UnitFormState = {
  blockId: string
  unitNumber: string
  floor: string
  unitType: string
  ownerName: string
  ownerPhone: string
  ownerEmail: string
  tenantName: string
  tenantPhone: string
  tenantEmail: string
  isOccupied: "true" | "false"
  status: UnitStatus
}

type UnitFilters = {
  search: string
  blockId: string
  status: "all" | UnitStatus
  occupancy: "all" | "true" | "false"
}

const defaultFormState: UnitFormState = {
  blockId: "",
  unitNumber: "",
  floor: "",
  unitType: "",
  ownerName: "",
  ownerPhone: "",
  ownerEmail: "",
  tenantName: "",
  tenantPhone: "",
  tenantEmail: "",
  isOccupied: "true",
  status: "active",
}

const defaultFilters: UnitFilters = {
  search: "",
  blockId: "",
  status: "all",
  occupancy: "all",
}

function toOptionalString(value: string): string | null {
  const trimmedValue = value.trim()
  return trimmedValue ? trimmedValue : null
}

function buildUnitPayload(form: UnitFormState) {
  return {
    block_id: Number(form.blockId),
    unit_number: form.unitNumber.trim(),
    floor: toOptionalString(form.floor),
    unit_type: toOptionalString(form.unitType),
    owner_name: toOptionalString(form.ownerName),
    owner_phone: toOptionalString(form.ownerPhone),
    owner_email: toOptionalString(form.ownerEmail),
    tenant_name: toOptionalString(form.tenantName),
    tenant_phone: toOptionalString(form.tenantPhone),
    tenant_email: toOptionalString(form.tenantEmail),
    is_occupied: form.isOccupied === "true",
    status: form.status,
  }
}

function unitToForm(unit: UnitRecord): UnitFormState {
  return {
    blockId: String(unit.block_id),
    unitNumber: unit.unit_number,
    floor: unit.floor ?? "",
    unitType: unit.unit_type ?? "",
    ownerName: unit.owner_name ?? "",
    ownerPhone: unit.owner_phone ?? "",
    ownerEmail: unit.owner_email ?? "",
    tenantName: unit.tenant_name ?? "",
    tenantPhone: unit.tenant_phone ?? "",
    tenantEmail: unit.tenant_email ?? "",
    isOccupied: unit.is_occupied ? "true" : "false",
    status: unit.status,
  }
}

function unitStatusVariant(status: UnitStatus) {
  if (status === "active") {
    return "success"
  }

  return "secondary"
}

function occupancyVariant(isOccupied: boolean) {
  return isOccupied ? "default" : "outline"
}

function getOccupancyLabel(unit: Pick<UnitRecord, "is_occupied" | "tenant_name">) {
  if (!unit.is_occupied) {
    return "Vacant"
  }

  return unit.tenant_name ? "Tenanted" : "Occupied"
}

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
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Visible units</CardDescription>
            <div className="flex items-start justify-between gap-3">
              <CardTitle className="text-3xl font-semibold">
                {isLoadingUnits ? "--" : units.length}
              </CardTitle>
              <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
                <HomeIcon className="size-4" />
              </div>
            </div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Active units</CardDescription>
            <div className="flex items-start justify-between gap-3">
              <CardTitle className="text-3xl font-semibold">
                {isLoadingUnits ? "--" : activeUnitsCount}
              </CardTitle>
              <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
                <Building2Icon className="size-4" />
              </div>
            </div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Occupied units</CardDescription>
            <div className="flex items-start justify-between gap-3">
              <CardTitle className="text-3xl font-semibold">
                {isLoadingUnits ? "--" : occupiedUnitsCount}
              </CardTitle>
              <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
                <UsersIcon className="size-4" />
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
              <CardTitle>Unit registry</CardTitle>
            </div>
            <Button
              onClick={openCreateSheet}
              disabled={isLoadingBlocks}
            >
              <PlusIcon />
              Add unit
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <FieldGroup className="grid gap-4 xl:grid-cols-[minmax(0,1.8fr)_repeat(3,minmax(0,1fr))]">
            <Field>
              <FieldLabel htmlFor="unit-search">Search</FieldLabel>
              <FieldContent>
                <Input
                  id="unit-search"
                  value={filters.search}
                  onChange={(event) => updateFilter("search", event.target.value)}
                  placeholder="A-10-01, Alice Owner, Bob Tenant"
                />
                <FieldDescription>
                  Matches unit number, owner name, or tenant name.
                </FieldDescription>
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="block-filter">Block</FieldLabel>
              <FieldContent>
                <AdminSelect
                  id="block-filter"
                  value={filters.blockId}
                  onChange={(event) => updateFilter("blockId", event.target.value)}
                  disabled={isLoadingBlocks || blocks.length === 0}
                >
                  <option value="">All blocks</option>
                  {blocks.map((block) => (
                    <option key={block.id} value={String(block.id)}>
                      {block.name}
                    </option>
                  ))}
                </AdminSelect>
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="status-filter">Status</FieldLabel>
              <FieldContent>
                <AdminSelect
                  id="status-filter"
                  value={filters.status}
                  onChange={(event) =>
                    updateFilter("status", event.target.value as UnitFilters["status"])
                  }
                >
                  <option value="all">All statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </AdminSelect>
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="occupancy-filter">Occupancy</FieldLabel>
              <FieldContent>
                <AdminSelect
                  id="occupancy-filter"
                  value={filters.occupancy}
                  onChange={(event) =>
                    updateFilter(
                      "occupancy",
                      event.target.value as UnitFilters["occupancy"],
                    )
                  }
                >
                  <option value="all">All occupancy</option>
                  <option value="true">Occupied</option>
                  <option value="false">Vacant</option>
                </AdminSelect>
              </FieldContent>
            </Field>
          </FieldGroup>

          {blocksError ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300">
              {blocksError}
            </div>
          ) : null}

          {!isLoadingBlocks && blocks.length === 0 && !blocksError ? (
            <div className="rounded-xl border border-border/70 bg-muted/20 p-4 text-sm leading-6 text-muted-foreground">
              No blocks are available for this residence yet. Create blocks first,
              then assign units with the required `block_id`.
            </div>
          ) : null}

          {unitsError ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm leading-6 text-destructive">
              {unitsError}
            </div>
          ) : null}

          {isLoadingUnits ? (
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

          {!isLoadingUnits && !unitsError && units.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 py-10 text-center">
              <p className="text-sm font-medium">No units match the current filters.</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Adjust the search or filters, or create the first unit for this
                residence.
              </p>
            </div>
          ) : null}

          {!isLoadingUnits && !unitsError && units.length > 0 ? (
            <div className="grid gap-4">
              {units.map((unit) => (
                <Card key={unit.id}>
                  <CardContent className="flex flex-col gap-5 py-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold">{unit.unit_number}</p>
                        <Badge variant={unitStatusVariant(unit.status)}>
                          {unit.status}
                        </Badge>
                        <Badge variant={occupancyVariant(unit.is_occupied)}>
                          {getOccupancyLabel(unit)}
                        </Badge>
                      </div>

                      <div className="grid gap-4 text-sm text-muted-foreground sm:grid-cols-2 xl:grid-cols-4">
                        <div>
                          <p className="font-medium text-foreground">Block</p>
                          <p>{getBlockName(unit.block_id)}</p>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Floor</p>
                          <p>{unit.floor ?? "Not set"}</p>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Unit type</p>
                          <p>{unit.unit_type ?? "Not set"}</p>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Updated</p>
                          <p>{formatTimestamp(unit.updated_at)}</p>
                        </div>
                      </div>

                      <Separator />

                      <div className="grid gap-4 text-sm sm:grid-cols-2">
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">Owner</p>
                          <p className="text-muted-foreground">
                            {unit.owner_name ?? "Not set"}
                          </p>
                          <p className="text-muted-foreground">
                            {unit.owner_phone ?? "No phone"}
                          </p>
                          <p className="text-muted-foreground">
                            {unit.owner_email ?? "No email"}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">Tenant</p>
                          <p className="text-muted-foreground">
                            {unit.tenant_name ?? "Not set"}
                          </p>
                          <p className="text-muted-foreground">
                            {unit.tenant_phone ?? "No phone"}
                          </p>
                          <p className="text-muted-foreground">
                            {unit.tenant_email ?? "No email"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          void openEditSheet(unit.id)
                        }}
                      >
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
        <SheetContent className="w-full sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>
              {sheetMode === "edit" ? "Edit unit" : "Add unit"}
            </SheetTitle>
            <SheetDescription>
              {sheetMode === "edit"
                ? "Load one unit from `GET /admin/units/{unit_id}` and save changes with `PATCH /admin/units/{unit_id}`."
                : "Create a unit with the fields supported by `POST /admin/units`."}
            </SheetDescription>
          </SheetHeader>

          <form className="flex h-full flex-col" onSubmit={handleSubmit}>
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
                    onClick={() => {
                      handleSheetOpenChange(false)
                      void router.navigate({
                        to: "/dashboard/$section/$subsection",
                        params: {
                          section: "residences",
                          subsection: "blocks-buildings",
                        },
                      })
                    }}
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
                          onChange={(event) => updateForm("blockId", event.target.value)}
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
                        <FieldDescription>
                          Required by the backend as `block_id`.
                        </FieldDescription>
                      </FieldContent>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="unit-number">Unit number</FieldLabel>
                      <FieldContent>
                        <Input
                          id="unit-number"
                          value={form.unitNumber}
                          onChange={(event) =>
                            updateForm("unitNumber", event.target.value)
                          }
                          placeholder="A-10-01"
                          required
                        />
                        <FieldDescription>
                          Required and unique within the selected block.
                        </FieldDescription>
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
                          onChange={(event) => updateForm("floor", event.target.value)}
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
                            updateForm("unitType", event.target.value)
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
                            updateForm("status", event.target.value as UnitStatus)
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
                            updateForm("ownerName", event.target.value)
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
                            updateForm("ownerEmail", event.target.value)
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
                            updateForm("ownerPhone", event.target.value)
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
                            updateForm(
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
                            updateForm("tenantName", event.target.value)
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
                            updateForm("tenantEmail", event.target.value)
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
                          updateForm("tenantPhone", event.target.value)
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
                onClick={() => handleSheetOpenChange(false)}
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
                  ? sheetMode === "edit"
                    ? "Saving..."
                    : "Creating..."
                  : sheetMode === "edit"
                    ? "Save changes"
                    : "Create unit"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
