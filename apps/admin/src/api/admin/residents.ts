import type { createApiClient } from '../client'
import type {
  CreateResidentAccountInput,
  LinkResidentInput,
  UnitResidentLink,
  UpdateResidentAccountInput,
  User,
} from '../types'

type ApiClient = ReturnType<typeof createApiClient>

export function createResidentAdminApi(client: ApiClient) {
  return {
    list: () => client.request<User[]>('/admin/residents'),
    create: (payload: CreateResidentAccountInput) =>
      client.request<User>('/admin/residents', {
        method: 'POST',
        body: payload,
      }),
    update: (userId: number, payload: UpdateResidentAccountInput) =>
      client.request<User>(`/admin/residents/${userId}`, {
        method: 'PATCH',
        body: payload,
      }),
    listByUnit: (unitId: number) =>
      client.request<UnitResidentLink[]>(`/admin/units/${unitId}/residents`),
    linkToUnit: (unitId: number, payload: LinkResidentInput) =>
      client.request<UnitResidentLink>(`/admin/units/${unitId}/residents`, {
        method: 'POST',
        body: payload,
      }),
    unlinkFromUnit: (unitId: number, userId: number) =>
      client.request<void>(`/admin/units/${unitId}/residents/${userId}`, {
        method: 'DELETE',
      }),
  }
}
