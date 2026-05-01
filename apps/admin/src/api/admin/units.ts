import type { createApiClient } from '../client'
import type { CreateUnitInput, Unit, UnitListFilters, UpdateUnitInput } from '../types'

type ApiClient = ReturnType<typeof createApiClient>

export function createUnitAdminApi(client: ApiClient) {
  return {
    list: (filters: UnitListFilters = {}) =>
      client.request<Unit[]>('/admin/units', {
        query: filters,
      }),
    get: (unitId: number) => client.request<Unit>(`/admin/units/${unitId}`),
    create: (payload: CreateUnitInput) =>
      client.request<Unit>('/admin/units', {
        method: 'POST',
        body: payload,
      }),
    update: (unitId: number, payload: UpdateUnitInput) =>
      client.request<Unit>(`/admin/units/${unitId}`, {
        method: 'PATCH',
        body: payload,
      }),
  }
}
