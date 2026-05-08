export type ResidenceStatus = "active" | "inactive"

export type ResidenceRecord = {
  id: number
  name: string
  address: string
  timezone: string
  currency: string
  billing_cycle_day: number
  status: ResidenceStatus
  created_at: string
  updated_at: string
}

export type ResidenceFormState = {
  name: string
  address: string
  timezone: string
  currency: string
  billingCycleDay: string
  status: ResidenceStatus
}

export const defaultFormState: ResidenceFormState = {
  name: "",
  address: "",
  timezone: "Asia/Kuala_Lumpur",
  currency: "MYR",
  billingCycleDay: "1",
  status: "active",
}

export function residenceToForm(
  residence: ResidenceRecord,
): ResidenceFormState {
  return {
    name: residence.name,
    address: residence.address,
    timezone: residence.timezone,
    currency: residence.currency,
    billingCycleDay: String(residence.billing_cycle_day),
    status: residence.status,
  }
}

export function buildResidencePayload(form: ResidenceFormState) {
  return {
    name: form.name.trim(),
    address: form.address.trim(),
    timezone: form.timezone.trim(),
    currency: form.currency.trim().toUpperCase(),
    billing_cycle_day: Number(form.billingCycleDay),
    status: form.status,
  }
}

export function statusVariant(status: ResidenceStatus) {
  return status === "active" ? "success" : "secondary"
}
