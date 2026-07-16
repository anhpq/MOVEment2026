import type { Session } from "./types"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'
const SESSION_STORAGE_KEY = 'movement-session'

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

async function apiRequest<T>(path: string, options: RequestInit): Promise<T> {
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')

  const token = getAccessToken()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || response.statusText)
  }

  return response.json()
}

async function apiGet<T>(path: string): Promise<T> {
  return apiRequest<T>(path, { method: 'GET' })
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  return apiRequest<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export type UserLoginResponse = {
  accessToken: string
  user: {
    id: number
    username: string
    role: string
  }
}

export type TeamLoginResponse = {
  accessToken: string
  team: {
    id: number
    name: string
    username: string
  }
}

export type AuthMeResponse =
  | {
      type: 'USER'
      user: {
        id: number
        username: string
        role: string
      }
    }
  | {
      type: 'TEAM'
      team: {
        id: number
        name: string
        username: string
      }
    }

export async function loginUser(
  username: string,
  password: string,
): Promise<UserLoginResponse> {
  return apiPost<UserLoginResponse>('/api/auth/login', {
    username,
    password,
  })
}

export async function loginTeam(
  username: string,
  password: string,
  deviceLabel: string,
): Promise<TeamLoginResponse> {
  return apiPost<TeamLoginResponse>('/api/auth/team-login', {
    username,
    password,
    deviceLabel,
  })
}

export async function getMe(): Promise<AuthMeResponse> {
  return apiGet<AuthMeResponse>('/api/auth/me')
}

export async function logout(): Promise<{ success: boolean }> {
  return apiPost('/api/auth/logout', {})
}
