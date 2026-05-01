import type { createApiClient } from '../client'
import { createBlockAdminApi } from './blocks'
import { createImportAdminApi } from './imports'
import { createResidenceAdminApi } from './residences'
import { createResidentAdminApi } from './residents'
import { createUnitAdminApi } from './units'

type ApiClient = ReturnType<typeof createApiClient>

export function createAdminApi(client: ApiClient) {
  return {
    residences: createResidenceAdminApi(client),
    blocks: createBlockAdminApi(client),
    units: createUnitAdminApi(client),
    residents: createResidentAdminApi(client),
    imports: createImportAdminApi(client),
  }
}
