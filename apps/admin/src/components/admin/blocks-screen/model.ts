export type BlockRecord = {
  id: number
  residence_id: number
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export type BlockFormState = {
  name: string
  description: string
}

export const defaultFormState: BlockFormState = {
  name: "",
  description: "",
}

export function blockToForm(block: BlockRecord): BlockFormState {
  return {
    name: block.name,
    description: block.description ?? "",
  }
}

export function toOptionalString(value: string): string | null {
  const trimmedValue = value.trim()
  return trimmedValue ? trimmedValue : null
}

export function buildBlockPayload(form: BlockFormState) {
  return {
    name: form.name.trim(),
    description: toOptionalString(form.description),
  }
}
