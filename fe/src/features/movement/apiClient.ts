import type {Session} from "./types"

const SESSION_STORAGE_KEY = 'movement-session'

export class ApiError extends Error {
  readonly status: number
  readonly method: string
  readonly url: string

  constructor(
    message: string,
    status: number,
    method: string,
    url: string,
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.method = method
    this.url = url
  }
}

export function isAuthFailure(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 401 || error.status === 403)
}

function normalizeApiBaseUrl(value: string | undefined): string {
  return value?.trim().replace(/\/+$/, '') ?? ''
}

function getConfiguredApiBaseUrl(): string {
  return normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL)
}

function isHttpsPage(): boolean {
  return typeof window !== 'undefined' && window.location.protocol === 'https:'
}

function buildApiUrl(path: string): string {
  const apiBaseUrl = getConfiguredApiBaseUrl()

  if (!apiBaseUrl) {
    return path
  }

  if (isHttpsPage() && apiBaseUrl.startsWith('http://')) {
    throw new Error(
      'The API is configured with insecure HTTP while the app is served over HTTPS. Use a same-origin /api reverse proxy or an HTTPS API URL.',
    )
  }

  return `${apiBaseUrl}${path}`
}

function getFriendlyErrorMessage(status: number): string {
  if (status === 0) {
    return 'Cannot reach the API. Check your network connection and try again.'
  }
  if (status === 401 || status === 403) {
    return 'Your login is invalid or your session has expired.'
  }
  if (status === 404) {
    return 'The requested service is unavailable. Please try again later.'
  }
  if (status === 405) {
    return 'The API request was sent to the wrong service. Please contact the event operator.'
  }
  if (status >= 500) {
    return 'The server is having trouble. Please try again shortly.'
  }
  return 'The request could not be completed. Please try again.'
}

function getContentType(response: Response): string {
  return response.headers.get('content-type')?.toLowerCase() ?? ''
}

function looksLikeMarkup(text: string): boolean {
  const value = text.trim().toLowerCase()
  return (
    value.startsWith('<!doctype html') ||
    value.startsWith('<html') ||
    value.startsWith('<?xml') ||
    value.startsWith('<error')
  )
}

function readErrorMessageFromJson(value: unknown): string | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const record = value as Record<string, unknown>
  const message = record.message
  if (Array.isArray(message)) {
    return message.filter((item) => typeof item === 'string').join('; ') || null
  }
  if (typeof message === 'string') {
    return message
  }
  if (typeof record.error === 'string') {
    return record.error
  }

  return null
}

async function readApiErrorMessage(response: Response) {
  const fallback = getFriendlyErrorMessage(response.status)
  const contentType = getContentType(response)
  const text = await response.text()

  if (contentType.includes('application/json')) {
    try {
      return readErrorMessageFromJson(JSON.parse(text)) ?? fallback
    } catch {
      return fallback
    }
  }

  if (contentType.includes('html') || contentType.includes('xml') || looksLikeMarkup(text)) {
    return fallback
  }

  return text.trim() || response.statusText || fallback
}

function getStoredSession(): Session | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY)
    if (!raw) {
      return null
    }

    const session = JSON.parse(raw) as Session
    if (!session.expiresAt) {
      window.localStorage.removeItem(SESSION_STORAGE_KEY)
      return null
    }

    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      window.localStorage.removeItem(SESSION_STORAGE_KEY)
      return null
    }

    return session
  } catch {
    window.localStorage.removeItem(SESSION_STORAGE_KEY)
    return null
  }
}

function getAccessToken(): string | undefined {
  return getStoredSession()?.accessToken
}

async function fetchApi(path: string, options: RequestInit): Promise<Response> {
  const method = options.method ?? 'GET'
  const url = buildApiUrl(path)

  try {
    return await fetch(url, {
      ...options,
      credentials: 'include',
    })
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : getFriendlyErrorMessage(0)
    throw new ApiError(message, 0, method, url)
  }
}

export async function apiRequest<T>(path: string, options: RequestInit): Promise<T> {
  const method = options.method ?? 'GET'
  const url = buildApiUrl(path)
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')

  const token = getAccessToken()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetchApi(path, {
    ...options,
    headers,
  })

  if (!response.ok) {
    throw new ApiError(
      await readApiErrorMessage(response),
      response.status,
      method,
      url,
    )
  }

  return response.json()
}

export function apiGet<T>(path: string): Promise<T> {
  return apiRequest<T>(path, {method: 'GET'})
}

export function apiPost<T>(path: string, body: unknown): Promise<T> {
  return apiRequest<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return apiRequest<T>(path, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export function apiDelete<T>(path: string): Promise<T> {
  return apiRequest<T>(path, {method: 'DELETE'})
}

export async function apiDownloadBlob(path: string): Promise<Blob> {
  const file = await apiDownloadFile(path)
  return file.blob
}

export async function apiDownloadFile(
  path: string,
  fallbackFileName = 'download',
): Promise<{blob: Blob; fileName: string}> {
  const method = 'GET'
  const url = buildApiUrl(path)
  const token = getAccessToken()
  const response = await fetchApi(path, {
    method,
    headers: token ? {Authorization: `Bearer ${token}`} : {},
  })

  if (!response.ok) {
    throw new ApiError(
      await readApiErrorMessage(response),
      response.status,
      method,
      url,
    )
  }

  return {
    blob: await response.blob(),
    fileName: parseContentDispositionFileName(
      response.headers.get('Content-Disposition'),
    ) ?? fallbackFileName,
  }
}

function parseContentDispositionFileName(value: string | null) {
  if (!value) {
    return null
  }
  const encodedMatch = /filename\*=UTF-8''([^;]+)/i.exec(value)
  if (encodedMatch?.[1]) {
    try {
      return decodeURIComponent(encodedMatch[1])
    } catch {
      return encodedMatch[1]
    }
  }
  const quotedMatch = /filename="([^"]+)"/i.exec(value)
  if (quotedMatch?.[1]) {
    return quotedMatch[1]
  }
  const plainMatch = /filename=([^;]+)/i.exec(value)
  return plainMatch?.[1]?.trim() ?? null
}
