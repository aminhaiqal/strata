import { PlusIcon } from "lucide-react"

import { AdminSelect } from "@/components/admin/admin-select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
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
import { Skeleton } from "@/components/ui/skeleton"
import { formatTimestamp } from "@/lib/admin-screen-utils"

import {
  getOccupancyLabel,
  occupancyVariant,
  unitStatusVariant,
} from "./model"
import type {
  BlockRecord,
  UnitFilters,
  UnitRecord,
} from "./model"

type UnitRegistryProps = {
  blocks: BlockRecord[]
  units: UnitRecord[]
  filters: UnitFilters
  isLoadingBlocks: boolean
  isLoadingUnits: boolean
  blocksError: string | null
  unitsError: string | null
  onFilterChange: <K extends keyof UnitFilters>(
    key: K,
    value: UnitFilters[K],
  ) => void
  onCreate: () => void
  onEdit: (unitId: number) => void
  getBlockName: (blockId: number) => string
}

export function UnitRegistry({
  blocks,
  units,
  filters,
  isLoadingBlocks,
  isLoadingUnits,
  blocksError,
  unitsError,
  onFilterChange,
  onCreate,
  onEdit,
  getBlockName,
}: UnitRegistryProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CardTitle>Unit registry</CardTitle>
          </div>
          <Button onClick={onCreate} disabled={isLoadingBlocks}>
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
                onChange={(event) => onFilterChange("search", event.target.value)}
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
                onChange={(event) => onFilterChange("blockId", event.target.value)}
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
                  onFilterChange("status", event.target.value as UnitFilters["status"])
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
                  onFilterChange(
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
                        onEdit(unit.id)
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
  )
}
