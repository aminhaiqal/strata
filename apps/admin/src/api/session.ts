import type { AdminSession } from './types'

const SESSION_STORAGE_KEY = 'strata.admin.session'

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export function createAdminSessionStore(storage: StorageLike | null = getBrowserStorage()) {
  function get(): AdminSession | null {
    if (!storage) {
      return null
    }

    const rawValue = storage.getItem(SESSION_STORAGE_KEY)
    if (!rawValue) {
      return null
    }

    try {
      return JSON.parse(rawValue) as AdminSession
    } catch {
      storage.removeItem(SESSION_STORAGE_KEY)
      return null
    }
  }

  function set(session: AdminSession): void {
    storage?.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
  }

  function clear(): void {
    storage?.removeItem(SESSION_STORAGE_KEY)
  }

  function getAccessToken(): string | null {
    const session = get()
    if (!session) {
      return null
    }

    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      clear()
      return null
    }

    return session.accessToken
  }

  return {
    get,
    set,
    clear,
    getAccessToken,
  }
}

function getBrowserStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage
}
