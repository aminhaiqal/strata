export type BlockRecord = {
  id: number
  residence_id: number
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export type UnitStatus = "active" | "inactive"

export type UnitRecord = {
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

export type UnitFormState = {
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

export type UnitFilters = {
  search: string
  blockId: string
  status: "all" | UnitStatus
  occupancy: "all" | "true" | "false"
}

export const defaultFormState: UnitFormState = {
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

export const defaultFilters: UnitFilters = {
  search: "",
  blockId: "",
  status: "all",
  occupancy: "all",
}

export function toOptionalString(value: string): string | null {
  const trimmedValue = value.trim()
  return trimmedValue ? trimmedValue : null
}

export function buildUnitPayload(form: UnitFormState) {
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

export function unitToForm(unit: UnitRecord): UnitFormState {
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

export function unitStatusVariant(status: UnitStatus) {
  if (status === "active") {
    return "success"
  }

  return "secondary"
}

export function occupancyVariant(isOccupied: boolean) {
  return isOccupied ? "default" : "outline"
}

export function getOccupancyLabel(
  unit: Pick<UnitRecord, "is_occupied" | "tenant_name">,
) {
  if (!unit.is_occupied) {
    return "Vacant"
  }

  return unit.tenant_name ? "Tenanted" : "Occupied"
}
