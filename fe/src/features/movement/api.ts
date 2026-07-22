import type { StationTrackingMode } from "./types"
import {
  apiDelete,
  apiDownloadBlob,
  apiGet,
  apiPatch,
  apiPost,
  apiRequest,
} from "./apiClient"

export {ApiError, isAuthFailure} from "./apiClient"

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

export async function loginWithQrToken(
  token: string,
  deviceLabel: string,
  signal?: AbortSignal,
): Promise<TeamLoginResponse> {
  return apiRequest<TeamLoginResponse>('/api/auth/qr-login', {
    method: 'POST',
    body: JSON.stringify({
      token,
      deviceLabel,
    }),
    signal,
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
  qrLoginUrl?: string
  loginUrl?: string
  qrLoginExpiresAt?: string
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

export type AdminQrLoginTokenResponse = {
  id: number
  teamId: number
  loginUrl?: string
  qrLoginUrl?: string
  expiresAt: string
  isActive: boolean
  consumedAt?: string | null
  revokedAt?: string | null
  usageCount: number
  createdAt: string
  lastUsedAt?: string | null
  status: 'ACTIVE' | 'EXPIRED' | 'CONSUMED' | 'REVOKED' | 'INACTIVE'
}

export const getAdminTeamQrLoginTokens = (teamId: string) =>
  apiGet<AdminQrLoginTokenResponse[]>(`/api/admin/teams/${teamId}/qr-login-tokens`)

export const generateAdminTeamQrLoginToken = (
  teamId: string,
  values: {expiresInMinutes?: number} = {},
) =>
  apiPost<AdminQrLoginTokenResponse>(
    `/api/admin/teams/${teamId}/qr-login-tokens`,
    values,
  )

export const rotateAdminTeamQrLoginToken = (
  teamId: string,
  values: {expiresInMinutes?: number} = {},
) =>
  apiPost<AdminQrLoginTokenResponse>(
    `/api/admin/teams/${teamId}/qr-login/rotate`,
    values,
  )

export const revokeAdminQrLoginToken = (tokenId: number) =>
  apiPost<{success: boolean; id: number; teamId: number; revokedAt: string | null}>(
    `/api/admin/qr-login-tokens/${tokenId}/revoke`,
    {},
  )

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
  eventEndTime: string; maxWinners: number; pointsByRank: number[]; isOpen: boolean
  canSubmit: boolean; blockedByActiveStation: boolean; activeStationId: string | null
  teamSubmission: FinalSubmissionResponse | null; wrongAttemptCount: number
  cooldownSeconds: number; nextAttemptAt: string | null; serverNow: string
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
  const blob = await apiDownloadBlob('/api/admin/reports/summary.xlsx')
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = 'movement-summary.xlsx'
  link.click()
  URL.revokeObjectURL(objectUrl)
}
