import type { createApiClient } from './client'
import { createAdminSessionStore } from './session'
import type { AdminLoginRequest, AdminLoginResponse, AdminSession } from './types'

type ApiClient = ReturnType<typeof createApiClient>
type SessionStore = ReturnType<typeof createAdminSessionStore>

export function createAdminAuthApi(client: ApiClient, sessionStore: SessionStore) {
  async function login(payload: AdminLoginRequest): Promise<AdminSession> {
    const response = await client.request<AdminLoginResponse>('/auth/admin/login', {
      method: 'POST',
      body: payload,
    })

    const session = toAdminSession(response)
    sessionStore.set(session)
    return session
  }

  function logout(): void {
    sessionStore.clear()
  }

  function getSession(): AdminSession | null {
    return sessionStore.get()
  }

  function getAccessToken(): string | null {
    return sessionStore.getAccessToken()
  }

  return {
    login,
    logout,
    getSession,
    getAccessToken,
  }
}

function toAdminSession(response: AdminLoginResponse): AdminSession {
  return {
    accessToken: response.access_token,
    tokenType: response.token_type,
    expiresAt: new Date(Date.now() + response.expires_in * 1000).toISOString(),
    user: response.user,
  }
}
