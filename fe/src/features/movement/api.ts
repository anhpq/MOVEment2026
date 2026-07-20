import type { Session } from "./types"
import type { StationTrackingMode } from "./types"

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

async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return apiRequest<T>(path, {
    method: 'PATCH',
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

export async function loginTeamWithQr(
  qrToken: string,
  deviceLabel: string,
): Promise<TeamLoginResponse> {
  return apiPost<TeamLoginResponse>('/api/auth/team-qr-login', {
    qrToken,
    deviceLabel,
  })
}

export async function getMe(): Promise<AuthMeResponse> {
  return apiGet<AuthMeResponse>('/api/auth/me')
}

export async function logout(): Promise<{ success: boolean }> {
  return apiPost('/api/auth/logout', {})
}

export type PlayerDashboardResponse = {
  team: {
    id: number
    name: string
    username?: string
    totalPoints: number
    totalPlaySeconds: number
    rank: number | null
    color?: string | null
  }
  completedStations: number
  serverNow: string
}

export type PlayerStationResponse = {
  id: string
  name: string
  description: string | null
  mapX: number | null
  mapY: number | null
  trackingMode: StationTrackingMode
  game: {
    id: string
    title: string
    type: string
    difficulty: number
    maxPoints: number
    clueText: string | null
    mediaUrl: string | null
  } | null
  progress: PlayerProgressResponse | null
}

export type PlayerProgressResponse = {
  id: number
  teamId: number
  stationId: string
  status: 'LOCKED' | 'AVAILABLE' | 'CHECKED_IN' | 'PLAYING' | 'COMPLETED'
  checkedInAt: string | null
  checkedOutAt: string | null
  completedAt: string | null
  cancelledAt: string | null
  nextCheckInAllowedAt: string | null
  scoreAchieved: number
  attemptNo: number
  game?: PlayerStationResponse['game']
}

export type LeaderboardEntryResponse = {
  rank: number
  teamId: number
  teamName: string
  totalPoints: number
  completedStations: number
  totalPlaySeconds: number
}

export async function getPlayerDashboard(): Promise<PlayerDashboardResponse> {
  return apiGet<PlayerDashboardResponse>('/api/player/me')
}

async function apiDelete<T>(path: string): Promise<T> {
  return apiRequest<T>(path, {method: 'DELETE'})
}

export async function getPlayerStations(): Promise<PlayerStationResponse[]> {
  return apiGet<PlayerStationResponse[]>('/api/player/stations')
}

export async function getPlayerProgress(): Promise<PlayerProgressResponse[]> {
  return apiGet<PlayerProgressResponse[]>('/api/player/progress')
}

export async function checkInStation(
  stationId: string,
  qrToken: string,
): Promise<PlayerProgressResponse> {
  return apiPost<PlayerProgressResponse>(`/api/player/stations/${stationId}/check-in`, {
    qrToken,
  })
}

export async function checkOutStation(
  stationId: string,
  qrToken: string,
): Promise<PlayerProgressResponse> {
  return apiPost<PlayerProgressResponse>(`/api/player/stations/${stationId}/check-out`, {
    qrToken,
  })
}

export async function submitStationScore(
  stationId: string,
  score: number,
  confirmationCode: string,
  reason?: string,
): Promise<PlayerProgressResponse> {
  return apiPost<PlayerProgressResponse>(`/api/player/stations/${stationId}/score`, {
    score,
    confirmationCode,
    reason,
  })
}

export type AdminStationUpdateInput = {
  name?: string
  description?: string | null
  trackingMode?: StationTrackingMode
  mapX?: number
  mapY?: number
  mediaUrl?: string | null
}

export async function updateAdminStation(
  stationId: string,
  values: AdminStationUpdateInput,
): Promise<PlayerStationResponse> {
  return apiPatch<PlayerStationResponse>(`/api/admin/stations/${stationId}`, values)
}

export type AdminTeamResponse = {
  id: number
  name: string
  username: string
  captainName: string
  totalPoints: number
  totalPlaySeconds: number
}

export type AdminProgressMatrixResponse = {
  stations: Array<{
    id: string
    name: string
    description: string | null
    mapX: number | null
    mapY: number | null
    trackingMode: StationTrackingMode
    games?: Array<{type: string; maxPoints: number; mediaUrl: string | null}>
  }>
  rows: Array<{
    team: AdminTeamResponse
    cells: Array<null | {
      progressId: number
      stationId: string
      status: PlayerProgressResponse['status']
      scoreAchieved: number
      maxPoints: number
      checkedInAt: string | null
      checkedOutAt: string | null
      completedAt: string | null
    }>
  }>
}

export const getAdminProgressMatrix = () =>
  apiGet<AdminProgressMatrixResponse>('/api/admin/progress-matrix')

export const createAdminTeam = (values: {
  name: string; username: string; password: string; captainName?: string
}) => apiPost<AdminTeamResponse>('/api/admin/teams', values)

export const updateAdminTeam = (teamId: string, values: {
  name?: string; username?: string; password?: string; captainName?: string
}) => apiPatch<AdminTeamResponse>(`/api/admin/teams/${teamId}`, values)

export const deleteAdminTeam = (teamId: string) =>
  apiDelete<{success: boolean}>(`/api/admin/teams/${teamId}`)

export const forceAdminProgressStatus = (
  progressId: number,
  status: Exclude<PlayerProgressResponse['status'], 'COMPLETED'>,
  reason: string,
) => apiPatch(`/api/admin/progress/${progressId}/status`, {status, reason})

export const editAdminProgressScore = (
  progressId: number,
  score: number,
  reason: string,
) => apiPatch(`/api/admin/progress/${progressId}/score`, {score, reason})

export const submitAdminProgressScore = (
  progressId: number,
  score: number,
  reason?: string,
) => apiPost(`/api/admin/progress/${progressId}/score`, {score, reason})

export const reopenAdminProgress = (progressId: number, reason: string) =>
  apiPost(`/api/admin/progress/${progressId}/reopen`, {reason})

export const createAdminStation = (values: {
  id: string; name: string; description?: string | null
  trackingMode: StationTrackingMode; mapX: number; mapY: number
  gameType: string; maxPoints: number; mediaUrl?: string | null
}) => apiPost('/api/admin/stations', values)

export const deleteAdminStation = (stationId: string) =>
  apiDelete(`/api/admin/stations/${stationId}`)

export const cancelPlayerStation = (stationId: string) =>
  apiPost(`/api/player/stations/${stationId}/cancel`, {})

export const submitCipherAnswer = (stationId: string, answer: string) =>
  apiPost(`/api/player/stations/${stationId}/submit-cipher`, {answer})

export const getLeaderboard = () =>
  apiGet<LeaderboardEntryResponse[]>('/api/leaderboard')

export type FinalResponse = {
  id: number; title: string; clueText: string | null; startsAt: string
  maxWinners: number; pointsByRank: number[]; isOpen: boolean
  teamSubmission: FinalSubmissionResponse | null; serverNow: string
}
export type FinalSubmissionResponse = {
  id: number; teamId: number; isCorrect: boolean; winnerRank: number | null
  pointsAwarded: number; submittedAt: string
}
export const getPlayerFinal = () => apiGet<FinalResponse>('/api/player/final')
export const submitFinalAnswer = (answer: string) =>
  apiPost<FinalSubmissionResponse>('/api/player/final/submit', {answer})

export const getAdminDashboard = () => apiGet<Record<string, unknown>>('/api/admin/dashboard')
export const getAdminScoreQueue = () => apiGet<Array<Record<string, unknown>>>('/api/admin/score-queue')
export const getAdminEventConfig = () => apiGet<Record<string, unknown>>('/api/admin/event-config')
export const updateAdminEventConfig = (values: Record<string, unknown>) =>
  apiPatch('/api/admin/event-config', values)
export const getAdminActivityLogs = () => apiGet<Array<Record<string, unknown>>>('/api/admin/activity-logs')
export const getAdminFinalConfig = () => apiGet<Record<string, unknown>>('/api/admin/final-config')
export const getAdminFinalSubmissions = () => apiGet<Array<Record<string, unknown>>>('/api/admin/final/submissions')
export const updateAdminFinalConfig = (values: Record<string, unknown>) =>
  apiPatch('/api/admin/final-config', values)

export async function downloadAdminSummary() {
  const token = getAccessToken()
  const response = await fetch(`${API_BASE_URL}/api/admin/reports/summary.xlsx`, {
    headers: token ? {Authorization: `Bearer ${token}`} : {},
  })
  if (!response.ok) throw new Error(await response.text())
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'movement-summary.xlsx'
  link.click()
  URL.revokeObjectURL(url)
}
