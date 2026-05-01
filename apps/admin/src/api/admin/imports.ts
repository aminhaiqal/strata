import type { createApiClient } from '../client'
import type { ImportBatch } from '../types'

type ApiClient = ReturnType<typeof createApiClient>

export function createImportAdminApi(client: ApiClient) {
  return {
    importUnits: (file: File) => {
      const formData = new FormData()
      formData.set('file', file)

      return client.request<ImportBatch>('/admin/imports/units', {
        method: 'POST',
        body: formData,
      })
    },
    getBatch: (batchId: number) => client.request<ImportBatch>(`/admin/imports/${batchId}`),
  }
}
