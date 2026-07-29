import {
  getStoredSessionPrincipalKey,
  readStoredSession,
} from "./sessionIdentity"

const GET_TIMEOUT_MS = 10_000
const MUTATION_TIMEOUT_MS = 20_000
const GET_RETRY_COUNT = 2

export type ApiErrorCode =
  | 'ABORTED'
  | 'AUTH'
  | 'HTTP'
  | 'NETWORK'
  | 'RATE_LIMITED'
  | 'SERVER'
  | 'TIMEOUT'

export class ApiError extends Error {
  readonly status: number
  readonly method: string
  readonly url: string
  readonly code: ApiErrorCode
  readonly reason: string | null
  readonly backendCode: string | null
  readonly requestId: string
  readonly retryable: boolean

  constructor(
    message: string,
    status: number,
    method: string,
    url: string,
    options: {
      code?: ApiErrorCode
      reason?: string | null
      backendCode?: string | null
      requestId?: string
      retryable?: boolean
    } = {},
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.method = method
    this.url = url
    this.code = options.code ?? getApiErrorCode(status)
    this.reason = options.reason ?? null
    this.backendCode = options.backendCode ?? null
    this.requestId = options.requestId ?? ''
    this.retryable = options.retryable ?? isRetryableStatus(status)
  }
}

export function isAuthFailure(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 401 || error.status === 403)
}

export function isCompatibilityFallback(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 404 || error.status === 405)
}

export function getSafeApiErrorTranslationKey(
  error: unknown,
  fallbackKey = 'errors.generic',
  authKey = 'errors.sessionExpired',
) {
  if (!(error instanceof ApiError)) {
    return fallbackKey
  }
  if (error.code === 'TIMEOUT') {
    return 'errors.timeout'
  }
  if (error.code === 'NETWORK') {
    return 'errors.network'
  }
  if (error.code === 'AUTH') {
    return authKey
  }
  if (error.code === 'RATE_LIMITED') {
    return 'errors.rateLimited'
  }
  if (error.code === 'SERVER') {
    return 'errors.serviceUnavailable'
  }
  return fallbackKey
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

function readErrorDetailsFromJson(value: unknown) {
  if (!value || typeof value !== 'object') {
    return {reason: null, backendCode: null}
  }

  const record = value as Record<string, unknown>
  const message = record.message
  if (Array.isArray(message)) {
    return {
      reason: message.filter((item) => typeof item === 'string').join('; ') || null,
      backendCode: typeof record.code === 'string' ? record.code : null,
    }
  }
  if (typeof message === 'string') {
    return {
      reason: message,
      backendCode: typeof record.code === 'string' ? record.code : null,
    }
  }
  if (typeof record.error === 'string') {
    return {
      reason: record.error,
      backendCode: typeof record.code === 'string' ? record.code : null,
    }
  }

  return {
    reason: null,
    backendCode: typeof record.code === 'string' ? record.code : null,
  }
}

async function readApiErrorDetails(response: Response) {
  const contentType = getContentType(response)
  const text = await response.text()

  if (contentType.includes('application/json')) {
    try {
      return readErrorDetailsFromJson(JSON.parse(text))
    } catch {
      return {reason: null, backendCode: null}
    }
  }

  if (contentType.includes('html') || contentType.includes('xml') || looksLikeMarkup(text)) {
    return {reason: null, backendCode: null}
  }

  return {reason: text.trim() || null, backendCode: null}
}

function getAccessToken(): string | undefined {
  return readStoredSession()?.accessToken
}

function createRequestId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `mv26-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function getApiErrorCode(status: number): ApiErrorCode {
  if (status === 401 || status === 403) return 'AUTH'
  if (status === 429) return 'RATE_LIMITED'
  if (status >= 500) return 'SERVER'
  if (status === 0) return 'NETWORK'
  return 'HTTP'
}

function isRetryableStatus(status: number) {
  return status === 0 || status === 408 || status === 429 || status >= 500
}

function createTimedSignal(source: AbortSignal | null | undefined, timeoutMs: number) {
  const controller = new AbortController()
  let timedOut = false
  const abortFromSource = () => controller.abort(source?.reason)
  if (source?.aborted) {
    abortFromSource()
  } else {
    source?.addEventListener('abort', abortFromSource, {once: true})
  }
  const timer = window.setTimeout(() => {
    timedOut = true
    controller.abort()
  }, timeoutMs)

  return {
    signal: controller.signal,
    timedOut: () => timedOut,
    cleanup: () => {
      window.clearTimeout(timer)
      source?.removeEventListener('abort', abortFromSource)
    },
  }
}

async function fetchApi(
  path: string,
  options: RequestInit,
  timeoutMs: number,
  requestId: string,
): Promise<Response> {
  const method = options.method ?? 'GET'
  let url: string
  try {
    url = buildApiUrl(path)
  } catch {
    throw new ApiError(getFriendlyErrorMessage(0), 0, method, path, {
      code: 'NETWORK',
      requestId,
      retryable: false,
    })
  }

  const timedSignal = createTimedSignal(options.signal, timeoutMs)

  try {
    return await fetch(url, {
      ...options,
      signal: timedSignal.signal,
      credentials: 'include',
    })
  } catch {
    const wasSourceAbort = Boolean(options.signal?.aborted) && !timedSignal.timedOut()
    throw new ApiError(
      getFriendlyErrorMessage(0),
      0,
      method,
      url,
      {
        code: wasSourceAbort ? 'ABORTED' : timedSignal.timedOut() ? 'TIMEOUT' : 'NETWORK',
        requestId,
        retryable: !wasSourceAbort,
      },
    )
  } finally {
    timedSignal.cleanup()
  }
}

async function waitForRetry(attempt: number, signal?: AbortSignal | null) {
  if (signal?.aborted) {
    return
  }
  await new Promise<void>((resolve) => {
    const timer = window.setTimeout(resolve, 250 * 2 ** attempt)
    signal?.addEventListener('abort', () => {
      window.clearTimeout(timer)
      resolve()
    }, {once: true})
  })
}

async function requestResponse(path: string, options: RequestInit) {
  const method = options.method ?? 'GET'
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')
  const requestId = headers.get('X-Request-ID') || createRequestId()
  headers.set('X-Request-ID', requestId)

  const token = getAccessToken()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const isGet = method.toUpperCase() === 'GET'
  const retryCount = isGet ? GET_RETRY_COUNT : 0
  const timeoutMs = isGet ? GET_TIMEOUT_MS : MUTATION_TIMEOUT_MS
  let attempt = 0
  while (attempt <= retryCount) {
    try {
      const response = await fetchApi(path, {
        ...options,
        headers,
      }, timeoutMs, requestId)

      if (response.ok) {
        return response
      }

      const details = await readApiErrorDetails(response)
      const responseRequestId =
        response.headers.get('x-request-id') ??
        response.headers.get('x-correlation-id') ??
        requestId
      const error = new ApiError(
        getFriendlyErrorMessage(response.status),
        response.status,
        method,
        response.url || path,
        {
          ...details,
          requestId: responseRequestId,
          retryable: isRetryableStatus(response.status),
        },
      )
      if (attempt >= retryCount || !error.retryable) {
        throw error
      }
    } catch (error) {
      if (!(error instanceof ApiError) || attempt >= retryCount || !error.retryable) {
        throw error
      }
    }

    await waitForRetry(attempt, options.signal)
    attempt += 1
  }

  throw new ApiError(getFriendlyErrorMessage(0), 0, method, path, {
    requestId,
  })
}

export async function apiRequest<T>(path: string, options: RequestInit): Promise<T> {
  const response = await requestResponse(path, options)

  if (response.status === 204) {
    return undefined as T
  }
  return response.json() as Promise<T>
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
  const response = await requestResponse(path, {method: 'GET'})

  return {
    blob: await response.blob(),
    fileName: parseContentDispositionFileName(
      response.headers.get('Content-Disposition'),
    ) ?? fallbackFileName,
  }
}

export {getStoredSessionPrincipalKey}

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
