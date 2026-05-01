export type EntityStatus = 'active' | 'inactive'
export type ResidenceStatus = 'active' | 'inactive'
export type UserRole =
  | 'super_admin'
  | 'residence_admin'
  | 'finance_admin'
  | 'resident'
export type UnitUserRelationshipType = 'owner' | 'tenant' | 'representative'
export type ImportStatus =
  | 'uploaded'
  | 'validated'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
export type ImportType =
  | 'units'
  | 'opening_balances'
  | 'historical_payments'
  | 'monthly_charges'

export type Residence = {
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

export type Block = {
  id: number
  residence_id: number
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export type Unit = {
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
  status: EntityStatus
  created_at: string
  updated_at: string
}

export type User = {
  id: number
  residence_id: number
  name: string
  email: string
  phone: string | null
  role: UserRole
  status: EntityStatus
  created_at: string
  updated_at: string
}

export type UnitResidentLink = {
  unit_id: number
  user_id: number
  relationship_type: UnitUserRelationshipType
  resident: User
}

export type ImportErrorItem = {
  id: number
  import_batch_id: number
  row_number: number
  field: string
  error_message: string
  raw_value: string | null
}

export type ImportBatch = {
  id: number
  residence_id: number
  import_type: ImportType
  filename: string
  status: ImportStatus
  total_rows: number
  success_rows: number
  failed_rows: number
  uploaded_by: number
  created_at: string
  completed_at: string | null
  errors: ImportErrorItem[]
}

export type AdminLoginRequest = {
  email: string
  password: string
}

export type AdminLoginResponse = {
  access_token: string
  token_type: string
  expires_in: number
  user: User
}

export type UpdateResidenceInput = Partial<{
  name: string
  address: string
  timezone: string
  currency: string
  billing_cycle_day: number
  status: ResidenceStatus
}>

export type CreateBlockInput = {
  name: string
  description?: string | null
}

export type UpdateBlockInput = Partial<CreateBlockInput>

export type CreateUnitInput = {
  block_id: number
  unit_number: string
  floor?: string | null
  unit_type?: string | null
  owner_name?: string | null
  owner_phone?: string | null
  owner_email?: string | null
  tenant_name?: string | null
  tenant_phone?: string | null
  tenant_email?: string | null
  is_occupied?: boolean
  status?: EntityStatus
}

export type UpdateUnitInput = Partial<CreateUnitInput>

export type UnitListFilters = {
  block_id?: number
  status?: EntityStatus
  is_occupied?: boolean
  search?: string
}

export type CreateResidentAccountInput = {
  name: string
  email: string
  temporary_password: string
  phone?: string | null
}

export type UpdateResidentAccountInput = Partial<{
  name: string
  phone: string | null
  status: EntityStatus
}>

export type LinkResidentInput = {
  user_id: number
  relationship_type: UnitUserRelationshipType
}

export type AdminSession = {
  accessToken: string
  tokenType: string
  expiresAt: string
  user: User
}
