export type QueryValue = string | number | boolean | null | undefined

export class ApiError extends Error {
  readonly status: number
  readonly detail: unknown

  constructor(message: string, status: number, detail: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: BodyInit | object | null
  query?: Record<string, QueryValue>
  headers?: HeadersInit
  signal?: AbortSignal
}

type ApiClientOptions = {
  baseUrl?: string
  getAccessToken?: () => string | null
}

const DEFAULT_API_BASE_URL = 'http://127.0.0.1:8000'

export function createApiClient(options: ApiClientOptions = {}) {
  const baseUrl = normalizeBaseUrl(
    options.baseUrl ?? import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL,
  )

  async function request<T>(path: string, requestOptions: RequestOptions = {}): Promise<T> {
    const url = buildUrl(baseUrl, path, requestOptions.query)
    const headers = new Headers(requestOptions.headers)
    const token = options.getAccessToken?.()

    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }

    const body = serializeBody(requestOptions.body, headers)
    const response = await fetch(url, {
      method: requestOptions.method ?? 'GET',
      headers,
      body,
      signal: requestOptions.signal,
    })

    if (!response.ok) {
      throw await buildApiError(response)
    }

    if (response.status === 204) {
      return undefined as T
    }

    return (await response.json()) as T
  }

  return { request }
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
}

function buildUrl(baseUrl: string, path: string, query?: Record<string, QueryValue>): string {
  const url = new URL(path.startsWith('/') ? path : `/${path}`, baseUrl)

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === null || value === undefined || value === '') {
        continue
      }

      url.searchParams.set(key, String(value))
    }
  }

  return url.toString()
}

function serializeBody(body: RequestOptions['body'], headers: Headers): BodyInit | undefined {
  if (body === null || body === undefined) {
    return undefined
  }

  if (
    body instanceof FormData ||
    body instanceof URLSearchParams ||
    body instanceof Blob ||
    body instanceof ArrayBuffer
  ) {
    return body
  }

  headers.set('Content-Type', 'application/json')
  return JSON.stringify(body)
}

async function buildApiError(response: Response): Promise<ApiError> {
  const contentType = response.headers.get('content-type') ?? ''
  const payload = contentType.includes('application/json')
    ? await response.json().catch(() => null)
    : await response.text().catch(() => '')

  const detail =
    payload && typeof payload === 'object' && 'detail' in payload
      ? payload.detail
      : payload

  const message =
    typeof detail === 'string' && detail.trim().length > 0
      ? detail
      : `Request failed with status ${response.status}`

  return new ApiError(message, response.status, detail)
}
