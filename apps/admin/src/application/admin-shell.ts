import { createAdminApi } from '../api/admin'
import { createAdminAuthApi } from '../api/auth'
import { createApiClient } from '../api/client'
import { createAdminSessionStore } from '../api/session'
import type { AdminLoginRequest, AdminSession, Block, Residence, User } from '../api/types'

export type AdminShellState =
  | { status: 'signed_out' }
  | {
      status: 'ready'
      session: AdminSession
      data: {
        residences: Residence[]
        blocks: Block[]
        residents: User[]
      }
    }

const sessionStore = createAdminSessionStore()
const client = createApiClient({
  getAccessToken: () => sessionStore.getAccessToken(),
})

export const adminAuth = createAdminAuthApi(client, sessionStore)
export const adminApi = createAdminApi(client)

export async function hydrateAdminShell(): Promise<AdminShellState> {
  const session = adminAuth.getSession()
  const accessToken = adminAuth.getAccessToken()

  if (!session || !accessToken) {
    return { status: 'signed_out' }
  }

  const [residences, blocks, residents] = await Promise.all([
    adminApi.residences.list(),
    adminApi.blocks.list(),
    adminApi.residents.list(),
  ])

  return {
    status: 'ready',
    session,
    data: {
      residences,
      blocks,
      residents,
    },
  }
}

export async function loginAdmin(payload: AdminLoginRequest): Promise<AdminShellState> {
  await adminAuth.login(payload)
  return hydrateAdminShell()
}

export function logoutAdmin(): void {
  adminAuth.logout()
}
