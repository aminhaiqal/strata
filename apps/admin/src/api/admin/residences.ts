import type { createApiClient } from '../client'
import type { Residence, UpdateResidenceInput } from '../types'

type ApiClient = ReturnType<typeof createApiClient>

export function createResidenceAdminApi(client: ApiClient) {
  return {
    list: () => client.request<Residence[]>('/admin/residences'),
    get: (residenceId: number) => client.request<Residence>(`/admin/residences/${residenceId}`),
    update: (residenceId: number, payload: UpdateResidenceInput) =>
      client.request<Residence>(`/admin/residences/${residenceId}`, {
        method: 'PATCH',
        body: payload,
      }),
  }
}
