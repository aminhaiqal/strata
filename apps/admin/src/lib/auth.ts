export type AdminUser = {
  id: number
  residence_id: number
  name: string
  email: string
  phone: string | null
  role: string
  status: string
  created_at: string
  updated_at: string
}

export type AdminLoginResponse = {
  access_token: string
  token_type: string
  expires_in: number
  user: AdminUser
}

export type AdminSession = {
  accessToken: string
  tokenType: string
  expiresAt: number
  user: AdminUser
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

export class UnauthorizedApiError extends ApiError {
  constructor(message: string) {
    super(message, 401)
    this.name = "UnauthorizedApiError"
  }
}

const ADMIN_SESSION_STORAGE_KEY = "strata.admin.session"

function isSessionShape(value: unknown): value is AdminSession {
  if (!value || typeof value !== "object") {
    return false
  }

  const session = value as Partial<AdminSession>

  return (
    typeof session.accessToken === "string" &&
    typeof session.tokenType === "string" &&
    typeof session.expiresAt === "number" &&
    !!session.user &&
    typeof session.user.name === "string" &&
    typeof session.user.email === "string"
  )
}

export function getApiBaseUrl(): string {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL

  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/$/, "")
  }

  return "http://localhost:8000"
}

export function clearAdminSession(): void {
  window.localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY)
}

export function storeAdminSession(payload: AdminLoginResponse): AdminSession {
  const session: AdminSession = {
    accessToken: payload.access_token,
    tokenType: payload.token_type,
    expiresAt: Date.now() + payload.expires_in * 1000,
    user: payload.user,
  }

  window.localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify(session))

  return session
}

export function readStoredAdminSession(): AdminSession | null {
  const storedSession = window.localStorage.getItem(ADMIN_SESSION_STORAGE_KEY)

  if (!storedSession) {
    return null
  }

  try {
    const parsedSession: unknown = JSON.parse(storedSession)

    if (!isSessionShape(parsedSession)) {
      clearAdminSession()
      return null
    }

    if (parsedSession.expiresAt <= Date.now()) {
      clearAdminSession()
      return null
    }

    return parsedSession
  } catch {
    clearAdminSession()
    return null
  }
}

export function isAdminAuthenticated(): boolean {
  return readStoredAdminSession() !== null
}

function getApiErrorMessage(
  payload: unknown,
  fallbackMessage: string,
): string {
  if (
    payload &&
    typeof payload === "object" &&
    "detail" in payload &&
    typeof payload.detail === "string"
  ) {
    return payload.detail
  }

  return fallbackMessage
}

function buildApiUrl(path: string): string {
  if (/^https?:\/\//.test(path)) {
    return path
  }

  return `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`
}

export async function adminApiFetch(
  path: string,
  {
    auth = true,
    headers,
    ...init
  }: RequestInit & {
    auth?: boolean
  } = {},
): Promise<Response> {
  const requestHeaders = new Headers(headers)

  if (auth) {
    const session = readStoredAdminSession()

    if (!session) {
      throw new UnauthorizedApiError("Admin session is missing or expired.")
    }

    requestHeaders.set("Authorization", `Bearer ${session.accessToken}`)
  }

  let response: Response

  try {
    response = await fetch(buildApiUrl(path), {
      ...init,
      headers: requestHeaders,
    })
  } catch {
    throw new Error("Unable to reach the API. Check the admin API base URL.")
  }

  if (auth && response.status === 401) {
    clearAdminSession()
    throw new UnauthorizedApiError("Admin session is no longer valid.")
  }

  return response
}

export async function adminApiJson<T>(
  path: string,
  init?: RequestInit & {
    auth?: boolean
  },
): Promise<T> {
  const response = await adminApiFetch(path, init)
  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    throw new ApiError(
      getApiErrorMessage(payload, "The API request failed."),
      response.status,
    )
  }

  return payload as T
}

export async function loginAdmin(credentials: {
  email: string
  password: string
}): Promise<AdminSession> {
  const payload = await adminApiJson<AdminLoginResponse>("/auth/admin/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
    auth: false,
  })

  return storeAdminSession(payload)
}
