import {
  useState,
  type ChangeEvent,
  type ComponentProps,
  type FormEvent,
} from "react"
import {
  DownloadIcon,
  FileSpreadsheetIcon,
  FilterIcon,
  HomeIcon,
  PlusIcon,
  UploadIcon,
  UsersIcon,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
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
  SheetTrigger,
} from "@/components/ui/sheet"

type UnitRecord = {
  unitNumber: string
  block: string
  type: string
  owner: string
  tenant: string
  occupancy: string
  status: string
  classification: string
  outstanding: string
  phone: string
  email: string
  updatedAt: string
}

type AddUnitFormState = {
  unitNumber: string
  block: string
  floor: string
  unitType: string
  ownerName: string
  ownerPhone: string
  ownerEmail: string
  tenantName: string
  tenantPhone: string
  tenantEmail: string
  isOccupied: string
  status: string
}

type ImportBatchState = {
  fileName: string
  source: string
  queuedAt: string
}

const metrics = [
  {
    title: "Active units",
    value: "412",
    detail: "18 newly onboarded after the April import batch.",
    icon: HomeIcon,
  },
  {
    title: "Occupied",
    value: "365",
    detail: "Owner and tenant occupancy records are up to date for 89%.",
    icon: UsersIcon,
  },
  {
    title: "Needs review",
    value: "21",
    detail: "Units missing owner or tenant contacts before billing notices.",
    icon: FilterIcon,
  },
]

const initialUnits: UnitRecord[] = [
  {
    unitNumber: "A-12-03",
    block: "Tower A",
    type: "Type B1",
    owner: "Nur Aisyah",
    tenant: "Vacant",
    occupancy: "Owner occupied",
    status: "active",
    classification: "healthy",
    outstanding: "RM 0.00",
    phone: "+60 12-338 9012",
    email: "nur.aisyah@example.com",
    updatedAt: "Updated 2 hours ago",
  },
  {
    unitNumber: "B-08-11",
    block: "Tower B",
    type: "Type C2",
    owner: "Daniel Lim",
    tenant: "Chloe Tan",
    occupancy: "Tenanted",
    status: "active",
    classification: "pending_verification",
    outstanding: "RM 1,240.00",
    phone: "+60 19-447 1208",
    email: "daniel.lim@example.com",
    updatedAt: "Updated after payment proof submission",
  },
  {
    unitNumber: "C-03-02",
    block: "Tower C",
    type: "Studio",
    owner: "Yap Wei Ming",
    tenant: "Vacant",
    occupancy: "Vacant",
    status: "maintenance_hold",
    classification: "under_review",
    outstanding: "RM 420.00",
    phone: "+60 18-552 1890",
    email: "wm.yap@example.com",
    updatedAt: "Missing meter verification before reactivation",
  },
  {
    unitNumber: "A-15-07",
    block: "Tower A",
    type: "Type D",
    owner: "Siti Khatijah",
    tenant: "Hafiz Jamal",
    occupancy: "Tenanted",
    status: "active",
    classification: "on_installment",
    outstanding: "RM 4,880.00",
    phone: "+60 16-662 4117",
    email: "siti.khatijah@example.com",
    updatedAt: "Installment plan active until July 2026",
  },
]

const defaultFormState: AddUnitFormState = {
  unitNumber: "",
  block: "",
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

const importSourceOptions = [
  "Excel CSV export",
  "Google Sheets CSV download",
  "Legacy finance sheet CSV",
]

const requiredImportColumns = [
  "block_name",
  "unit_number",
  "floor",
  "unit_type",
  "owner_name",
  "owner_phone",
  "owner_email",
  "tenant_name",
  "tenant_phone",
  "tenant_email",
  "is_occupied",
  "status",
]

function unitStatusVariant(status: string) {
  if (status === "active") {
    return "success"
  }

  if (status === "maintenance_hold") {
    return "warning"
  }

  return "outline"
}

function classificationVariant(classification: string) {
  if (classification === "healthy") {
    return "success"
  }

  if (classification === "pending_verification") {
    return "warning"
  }

  if (classification === "under_review") {
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

function getOccupancyLabel(form: AddUnitFormState) {
  if (form.isOccupied !== "true") {
    return "Vacant"
  }

  if (form.tenantName.trim()) {
    return "Tenanted"
  }

  return "Owner occupied"
}

function getClassification(status: string) {
  if (status === "active") {
    return "healthy"
  }

  return "under_review"
}

function buildUnitRecord(form: AddUnitFormState): UnitRecord {
  return {
    unitNumber: form.unitNumber.trim(),
    block: form.block.trim(),
    type: form.unitType.trim() || "Standard",
    owner: form.ownerName.trim(),
    tenant: form.tenantName.trim() || "Vacant",
    occupancy: getOccupancyLabel(form),
    status: form.status,
    classification: getClassification(form.status),
    outstanding: "RM 0.00",
    phone: form.ownerPhone.trim() || "Not provided",
    email: form.ownerEmail.trim() || "Not provided",
    updatedAt: "Added just now",
  }
}

function Select(props: ComponentProps<"select">) {
  return (
    <select
      data-slot="select"
      className="h-9 w-full rounded-md border border-input bg-transparent px-2.5 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      {...props}
    />
  )
}

export function UnitsScreen() {
  const [units, setUnits] = useState(initialUnits)
  const [isAddUnitOpen, setIsAddUnitOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [form, setForm] = useState(defaultFormState)
  const [importSource, setImportSource] = useState(importSourceOptions[0])
  const [importFileName, setImportFileName] = useState("")
  const [blocksReady, setBlocksReady] = useState("yes")
  const [latestImportBatch, setLatestImportBatch] =
    useState<ImportBatchState | null>(null)
  const [importInputKey, setImportInputKey] = useState(0)

  function handleOpenChange(open: boolean) {
    setIsAddUnitOpen(open)

    if (!open) {
      setForm(defaultFormState)
    }
  }

  function handleImportOpenChange(open: boolean) {
    setIsImportOpen(open)

    if (!open) {
      setImportSource(importSourceOptions[0])
      setImportFileName("")
      setBlocksReady("yes")
      setImportInputKey((current) => current + 1)
    }
  }

  function updateForm<K extends keyof AddUnitFormState>(
    key: K,
    value: AddUnitFormState[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setUnits((current) => [buildUnitRecord(form), ...current])
    setForm(defaultFormState)
    setIsAddUnitOpen(false)
  }

  function handleImportFileChange(event: ChangeEvent<HTMLInputElement>) {
    setImportFileName(event.target.files?.[0]?.name ?? "")
  }

  function handleImportSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!importFileName || blocksReady !== "yes") {
      return
    }

    setLatestImportBatch({
      fileName: importFileName,
      source: importSource,
      queuedAt: "Queued just now",
    })
    handleImportOpenChange(false)
  }

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

      {latestImportBatch ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileSpreadsheetIcon className="size-4" />
              Import batch ready
            </CardTitle>
            <CardDescription>
              The UI is prepared for CSV unit import. Wire this submission to
              `POST /admin/imports/units` next.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <p className="font-medium text-foreground">
                {latestImportBatch.fileName}
              </p>
              <p>{latestImportBatch.source}</p>
            </div>
            <Badge variant="secondary">{latestImportBatch.queuedAt}</Badge>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <CardTitle>Unit registry</CardTitle>
              <CardDescription>
                Maintain unit identity, ownership, occupancy, and collection
                context before charges and follow-ups are applied.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Sheet open={isImportOpen} onOpenChange={handleImportOpenChange}>
                <SheetTrigger asChild>
                  <Button variant="outline">
                    <DownloadIcon />
                    Import units
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-2xl">
                  <SheetHeader>
                    <SheetTitle>Import units</SheetTitle>
                    <SheetDescription>
                      Upload a CSV exported from Excel or Google Sheets to
                      create units in bulk.
                    </SheetDescription>
                  </SheetHeader>

                  <form
                    className="flex h-full flex-col"
                    onSubmit={handleImportSubmit}
                  >
                    <div className="flex-1 space-y-6 overflow-y-auto px-4 pb-4">
                      <div className="grid gap-4 md:grid-cols-3">
                        {[
                          "Export the current unit sheet as CSV.",
                          "Make sure blocks already exist in this residence.",
                          "Review row-level errors before re-uploading.",
                        ].map((item) => (
                          <div
                            key={item}
                            className="rounded-xl border border-border/70 bg-muted/20 p-4 text-sm leading-6 text-muted-foreground"
                          >
                            {item}
                          </div>
                        ))}
                      </div>

                      <FieldGroup className="grid gap-4 md:grid-cols-2">
                        <Field>
                          <FieldLabel htmlFor="import-source">Source</FieldLabel>
                          <FieldContent>
                            <Select
                              id="import-source"
                              value={importSource}
                              onChange={(event) =>
                                setImportSource(event.target.value)
                              }
                            >
                              {importSourceOptions.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </Select>
                            <FieldDescription>
                              Import from a CSV produced by the team&apos;s
                              existing spreadsheet workflow.
                            </FieldDescription>
                          </FieldContent>
                        </Field>

                        <Field>
                          <FieldLabel htmlFor="blocks-ready">
                            Blocks already created
                          </FieldLabel>
                          <FieldContent>
                            <Select
                              id="blocks-ready"
                              value={blocksReady}
                              onChange={(event) =>
                                setBlocksReady(event.target.value)
                              }
                            >
                              <option value="yes">Yes, blocks exist</option>
                              <option value="no">No, create blocks first</option>
                            </Select>
                            <FieldDescription>
                              The current API requires `block_name` values to
                              match existing blocks.
                            </FieldDescription>
                          </FieldContent>
                        </Field>
                      </FieldGroup>

                      <Field>
                        <FieldLabel htmlFor="units-csv">CSV file</FieldLabel>
                        <FieldContent>
                          <Input
                            key={importInputKey}
                            id="units-csv"
                            type="file"
                            accept=".csv,text/csv"
                            onChange={handleImportFileChange}
                            required
                          />
                          <FieldDescription>
                            {importFileName
                              ? `Selected file: ${importFileName}`
                              : "Accepted format: .csv"}
                          </FieldDescription>
                        </FieldContent>
                      </Field>

                      <Separator />

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">
                            Required columns
                          </CardTitle>
                          <CardDescription>
                            Match the current backend contract exactly for the
                            first MVP import flow.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-2 sm:grid-cols-2">
                          {requiredImportColumns.map((column) => (
                            <div
                              key={column}
                              className="rounded-lg border border-border/70 bg-background px-3 py-2 text-sm font-mono"
                            >
                              {column}
                            </div>
                          ))}
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">
                            Import result to expect
                          </CardTitle>
                          <CardDescription>
                            The backend processes unit imports synchronously and
                            returns success and failure row counts.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm leading-6 text-muted-foreground">
                          <p>
                            Successful rows create units immediately in the
                            current residence.
                          </p>
                          <p>
                            Invalid rows should come back with row-level
                            validation errors for correction.
                          </p>
                          <p>
                            Unknown block names should fail until the matching
                            block records exist.
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    <SheetFooter className="border-t border-border/70 bg-background">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleImportOpenChange(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={!importFileName || blocksReady !== "yes"}
                      >
                        <UploadIcon />
                        Queue import
                      </Button>
                    </SheetFooter>
                  </form>
                </SheetContent>
              </Sheet>
              <Sheet open={isAddUnitOpen} onOpenChange={handleOpenChange}>
                <SheetTrigger asChild>
                  <Button>
                    <PlusIcon />
                    Add unit
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-2xl">
                  <SheetHeader>
                    <SheetTitle>Add unit</SheetTitle>
                    <SheetDescription>
                      Create a unit record with the minimum ownership and
                      occupancy context needed before billing starts.
                    </SheetDescription>
                  </SheetHeader>

                  <form
                    className="flex h-full flex-col"
                    onSubmit={handleSubmit}
                  >
                    <div className="flex-1 space-y-6 overflow-y-auto px-4 pb-4">
                      <FieldGroup className="grid gap-4 md:grid-cols-2">
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
                              Keep unit numbers unique within the selected block.
                            </FieldDescription>
                          </FieldContent>
                        </Field>

                        <Field>
                          <FieldLabel htmlFor="block-name">Block or building</FieldLabel>
                          <FieldContent>
                            <Input
                              id="block-name"
                              value={form.block}
                              onChange={(event) =>
                                updateForm("block", event.target.value)
                              }
                              placeholder="Tower A"
                              required
                            />
                            <FieldDescription>
                              Match the naming used in your billing and import data.
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
                              onChange={(event) =>
                                updateForm("floor", event.target.value)
                              }
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
                              placeholder="Type B1"
                            />
                          </FieldContent>
                        </Field>

                        <Field>
                          <FieldLabel htmlFor="occupancy-status">Occupancy</FieldLabel>
                          <FieldContent>
                            <Select
                              id="occupancy-status"
                              value={form.isOccupied}
                              onChange={(event) =>
                                updateForm("isOccupied", event.target.value)
                              }
                            >
                              <option value="true">Occupied</option>
                              <option value="false">Vacant</option>
                            </Select>
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
                              placeholder="Nur Aisyah"
                              required
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
                              placeholder="owner@example.com"
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
                              placeholder="+60 12-345 6789"
                            />
                          </FieldContent>
                        </Field>

                        <Field>
                          <FieldLabel htmlFor="unit-status">Unit status</FieldLabel>
                          <FieldContent>
                            <Select
                              id="unit-status"
                              value={form.status}
                              onChange={(event) =>
                                updateForm("status", event.target.value)
                              }
                            >
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                              <option value="maintenance_hold">
                                Maintenance hold
                              </option>
                            </Select>
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
                              placeholder="Optional"
                            />
                            <FieldDescription>
                              Leave blank for owner-occupied or vacant units.
                            </FieldDescription>
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
                              placeholder="tenant@example.com"
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
                            placeholder="+60 19-222 3344"
                          />
                        </FieldContent>
                      </Field>
                    </div>

                    <SheetFooter className="border-t border-border/70 bg-background">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsAddUnitOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit">Create unit</Button>
                    </SheetFooter>
                  </form>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <FieldGroup className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.8fr)_minmax(0,0.8fr)]">
            <Field>
              <FieldLabel>Search unit or owner</FieldLabel>
              <FieldContent>
                <Input placeholder="A-12-03, Daniel Lim, Tower B" />
                <FieldDescription>
                  Search by unit number, owner name, tenant name, or email.
                </FieldDescription>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>Block or building</FieldLabel>
              <FieldContent>
                <Input placeholder="Tower A" />
                <FieldDescription>
                  Keep the registry scoped to a block during operations.
                </FieldDescription>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>Classification</FieldLabel>
              <FieldContent>
                <Input placeholder="healthy, on_installment" />
                <FieldDescription>
                  Filter units by collection state before taking action.
                </FieldDescription>
              </FieldContent>
            </Field>
          </FieldGroup>

          <Separator />

          <div className="space-y-4">
            {units.map((unit) => (
              <div
                key={unit.unitNumber}
                className="rounded-2xl border border-border/70 bg-card p-5"
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <div>
                        <p className="text-base font-semibold">
                          {unit.unitNumber}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {unit.block} · {unit.type}
                        </p>
                      </div>
                      <Badge variant={unitStatusVariant(unit.status)}>
                        {unit.status.replaceAll("_", " ")}
                      </Badge>
                      <Badge variant={classificationVariant(unit.classification)}>
                        {unit.classification.replaceAll("_", " ")}
                      </Badge>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10 rounded-xl">
                          <AvatarImage alt={unit.owner} />
                          <AvatarFallback className="rounded-xl">
                            {initials(unit.owner)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{unit.owner}</p>
                          <p className="text-sm text-muted-foreground">
                            Owner · {unit.phone}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {unit.email}
                          </p>
                        </div>
                      </div>
                      <div className="rounded-xl bg-muted/30 p-3">
                        <p className="text-sm font-medium">{unit.occupancy}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Tenant: {unit.tenant}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Outstanding balance: {unit.outstanding}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex min-w-56 flex-col items-start gap-3 xl:items-end">
                    <p className="text-sm text-muted-foreground">
                      {unit.updatedAt}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm">
                        View ledger
                      </Button>
                      <Button size="sm">Edit unit</Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Operational checks</CardTitle>
          <CardDescription>
            Unit setup quality directly affects billing, notices, and resident
            payment flows.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {[
            "Require unique unit numbers inside each residence and block.",
            "Keep owner phone and email complete before monthly charge runs.",
            "Review vacant or under-review units before collection escalation.",
          ].map((item) => (
            <div
              key={item}
              className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-4 text-sm leading-6 text-muted-foreground"
            >
              {item}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
