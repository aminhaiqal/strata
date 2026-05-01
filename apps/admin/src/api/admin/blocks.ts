import type { createApiClient } from '../client'
import type { Block, CreateBlockInput, UpdateBlockInput } from '../types'

type ApiClient = ReturnType<typeof createApiClient>

export function createBlockAdminApi(client: ApiClient) {
  return {
    list: () => client.request<Block[]>('/admin/blocks'),
    get: (blockId: number) => client.request<Block>(`/admin/blocks/${blockId}`),
    create: (payload: CreateBlockInput) =>
      client.request<Block>('/admin/blocks', {
        method: 'POST',
        body: payload,
      }),
    update: (blockId: number, payload: UpdateBlockInput) =>
      client.request<Block>(`/admin/blocks/${blockId}`, {
        method: 'PATCH',
        body: payload,
      }),
  }
}
