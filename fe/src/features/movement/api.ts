import type { GameType, StationTrackingMode, SupportedLanguage } from "./types"
import {
  apiDelete,
  apiDownloadFile,
  apiGet,
  apiPatch,
  apiPost,
  apiRequest,
  getStoredSessionPrincipalKey,
  isCompatibilityFallback,
} from "./apiClient"
import {
  runSingleFlight,
  StaleSessionResponseError,
} from "./runtimeCoordinator"

export {
  ApiError,
  getSafeApiErrorTranslationKey,
  isAuthFailure,
  isCompatibilityFallback,
} from "./apiClient"

export type UserLoginResponse = {
  accessToken: string
  expiresAt: string
  user: {
    id: number
    username: string
    role: string
  }
}

export type TeamLoginResponse = {
  accessToken: string
  expiresAt: string
  team: {
    id: number
    name: string
    username: string
    teamColor?: string | null
    color?: string | null
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
        teamColor?: string | null
        color?: string | null
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
    captainName?: string | null
    totalPoints: number
    maxPossiblePoints?: number
    totalPlaySeconds: number
    status?: string
    rank: number | null
    teamColor?: string | null
    color?: string | null
  }
  completedStations: number
  serverNow: string
}

export type PlayerStationResponse = {
  id: string
  name: string
  nameEn?: string
  description: string | null
  descriptionEn?: string | null
  mapX: number | null
  mapY: number | null
  trackingMode: StationTrackingMode
  imageUrls: string[]
  game: {
    id: string
    title: string
    type: GameType
    difficulty: number
    maxPoints: number | null
    scoreEntryMax?: number
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
  scoreEntryMax?: number
  referenceExceeded?: boolean
  attemptNo: number
  game?: PlayerStationResponse['game']
}

export type PlayerCatalogStationResponse = {
  id: string
  name: string
  description: string | null
  mapX: number | null
  mapY: number | null
  trackingMode: StationTrackingMode
  imageCount: number
  game: {
    id: string
    title: string
    type: GameType
    difficulty: number
    maxPoints: number | null
    scoreEntryMax?: number
    clueText: string | null
    mediaUrl: string | null
  } | null
}

export type PlayerCatalogResponse = {
  catalogVersion: string
  stations: PlayerCatalogStationResponse[]
}

export type PlayerStateProgressResponse = Omit<
  PlayerProgressResponse,
  'teamId' | 'game'
>

export type PlayerStateResponse = {
  catalogVersion: string
  serverNow: string
  team: PlayerDashboardResponse['team']
  completedStations: number
  progress: PlayerStateProgressResponse[]
  final: {
    isOpen: boolean
    canSubmit: boolean
    blockedByActiveStation: boolean
    activeStationId: string | null
    finalStartsAt: string
    eventEndTime: string
    notifyBeforeMinutes: number
    secondsUntilFinal: number
    stationCheckInClosed: boolean
    phase: 'NORMAL' | 'NOTICE' | 'STATIONS_CLOSED' | 'FINAL_STARTED'
    pendingScoreStationId: string | null
  }
}

export type PlayerV2RuntimeResponse = {
  runtimeVersion: string
  catalogVersion: string
  totalPoints: number
  rank: number | null
  completedStations: number
  progress: Array<{
    stationId: string
    status: PlayerStateProgressResponse['status']
    checkedInAt?: string
    checkedOutAt?: string
    completedAt?: string
    scoreAchieved: number
    attemptNo: number
  }>
  final: Pick<
    PlayerStateResponse['final'],
    'phase' | 'blockedByActiveStation' | 'pendingScoreStationId' | 'secondsUntilFinal'
  >
}

export type PlayerStationImagesResponse = {
  stationId: string
  imageUrls: string[]
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

export async function getPlayerStations(language: SupportedLanguage = "vi"): Promise<PlayerStationResponse[]> {
  return apiGet<PlayerStationResponse[]>(`/api/player/stations?lang=${encodeURIComponent(language)}`)
}

export async function getPlayerProgress(language: SupportedLanguage = "vi"): Promise<PlayerProgressResponse[]> {
  return apiGet<PlayerProgressResponse[]>(`/api/player/progress?lang=${encodeURIComponent(language)}`)
}

export async function getPlayerCatalog(
  language: SupportedLanguage = 'vi',
): Promise<PlayerCatalogResponse> {
  return apiGet<PlayerCatalogResponse>(
    `/api/player/catalog?lang=${encodeURIComponent(language)}`,
  )
}

export async function getPlayerState(): Promise<PlayerStateResponse> {
  return apiGet<PlayerStateResponse>('/api/player/state')
}

export async function getPlayerV2Runtime(): Promise<PlayerV2RuntimeResponse> {
  return runPlayerRead('player-v2-runtime', () =>
    apiGet<PlayerV2RuntimeResponse>('/api/player/v2/runtime'))
}

export async function getPlayerStationImages(
  stationId: string,
): Promise<PlayerStationImagesResponse> {
  return apiGet<PlayerStationImagesResponse>(
    `/api/player/stations/${encodeURIComponent(stationId)}/images`,
  )
}

export type StationPlayingCountResponse = {
  stationId: string
  playingTeamCount: number
}

export async function getPlayerStationPlayingCounts(): Promise<StationPlayingCountResponse[]> {
  return runPlayerRead('player-playing-counts', () =>
    apiGet<StationPlayingCountResponse[]>('/api/player/stations/playing-counts'))
}

export type PlayerQrActionResponse = {
  action: 'CHECK_IN' | 'CHECK_OUT'
  stationId: string
  requiresScore: boolean
  progress: PlayerProgressResponse
}

export async function submitPlayerQrAction(
  qrToken: string,
): Promise<PlayerQrActionResponse> {
  return apiPost<PlayerQrActionResponse>('/api/player/qr-action', {
    qrToken,
  })
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
  reason?: string,
): Promise<PlayerProgressResponse> {
  return apiPost<PlayerProgressResponse>(`/api/player/stations/${stationId}/score`, {
    score,
    reason,
  })
}

export type AdminStationUpdateInput = {
  name?: string
  nameEn?: string
  description?: string | null
  descriptionEn?: string | null
  trackingMode?: StationTrackingMode
  mapX?: number
  mapY?: number
  gameType?: GameType
  maxPoints?: number | null
  mediaUrl?: string | null
  imageUrls?: string[]
  checkInQrToken?: string
  checkOutQrToken?: string
}

export async function updateAdminStation(
  stationId: string,
  values: AdminStationUpdateInput,
): Promise<PlayerStationResponse & {qrTokens?: AdminStationQrTokenResponse[]}> {
  return apiPatch<PlayerStationResponse & {qrTokens?: AdminStationQrTokenResponse[]}>(`/api/admin/stations/${stationId}`, values)
}

export type AdminTeamResponse = {
  id: number
  name: string
  username: string
  captainName: string
  totalPoints: number
  totalPlaySeconds: number
  teamColor?: string | null
  color?: string | null
  qrLoginUrl?: string
  loginUrl?: string
  qrLoginExpiresAt?: string | null
}

export type AdminProgressMatrixResponse = {
  stations: Array<{
    id: string
    name: string
    nameEn: string
    description: string | null
    descriptionEn: string | null
    mapX: number | null
    mapY: number | null
    trackingMode: StationTrackingMode
    imageUrls: string[]
  games?: Array<{type: GameType; maxPoints: number | null; mediaUrl: string | null}>
  }>
  rows: Array<{
    team: AdminTeamResponse
    cells: Array<null | {
      progressId: number
      stationId: string
      status: PlayerProgressResponse['status']
      scoreAchieved: number
      maxPoints: number | null
      scoreEntryMax?: number
      referenceExceeded?: boolean
      checkedInAt: string | null
      checkedOutAt: string | null
      completedAt: string | null
    }>
  }>
}

export const getAdminProgressMatrix = () =>
  apiGet<AdminProgressMatrixResponse>('/api/admin/progress-matrix')

export type AdminQrStatusSummaryResponse = {
  teams: Array<{
    teamId: number
    status: 'ACTIVE' | 'NONE'
  }>
  stations: Array<{
    stationId: string
    activeCount: number
    status: 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'INACTIVE'
  }>
}

export const getAdminQrStatusSummary = () =>
  apiGet<AdminQrStatusSummaryResponse>('/api/admin/qr-status-summary')

export const createAdminTeam = (values: {
  name: string; username: string; password: string; captainName?: string; teamColor?: string | null
}) => apiPost<AdminTeamResponse>('/api/admin/teams', values)

export type AdminOneTimeTeamQrResponse = AdminQrLoginTokenResponse & {
  rawToken: string
  generatedAt: string
}

export const updateAdminTeam = (teamId: string, values: {
  name?: string; username?: string; password?: string; captainName?: string; qrToken?: string; teamColor?: string | null
}) => apiPatch<AdminTeamResponse & {qrLogin?: AdminOneTimeTeamQrResponse}>(`/api/admin/teams/${teamId}`, values)

export const deleteAdminTeam = (teamId: string) =>
  apiDelete<{success: boolean}>(`/api/admin/teams/${teamId}`)

export type AdminQrLoginTokenResponse = {
  id: number
  teamId: number
  loginUrl?: string
  qrLoginUrl?: string
  rawToken?: string
  expiresAt: string | null
  isActive: boolean
  consumedAt?: string | null
  revokedAt?: string | null
  usageCount: number
  createdAt: string
  lastUsedAt?: string | null
  status: 'ACTIVE' | 'CONSUMED' | 'REVOKED' | 'INACTIVE'
}

export const getAdminTeamQrLoginTokens = (teamId: string) =>
  apiGet<AdminQrLoginTokenResponse[]>(`/api/admin/teams/${teamId}/qr-login-tokens`)

export const generateAdminTeamQrLoginToken = (
  teamId: string,
  values: {expiresInMinutes?: number} = {},
) =>
  apiPost<AdminOneTimeTeamQrResponse>(
    `/api/admin/teams/${teamId}/generate-qr`,
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

export type AdminCreatedStationResponse = {
  id: string
  name: string
  nameEn: string
  imageUrls: string[]
  qrTokens?: AdminStationQrTokenResponse[]
}

export const createAdminStation = (values: {
  id: string; name: string; nameEn: string; description?: string | null; descriptionEn?: string | null
  trackingMode: StationTrackingMode; mapX: number; mapY: number
  gameType: GameType; maxPoints?: number | null; mediaUrl?: string | null; imageUrls?: string[]
}) => apiPost<AdminCreatedStationResponse>('/api/admin/stations', values)

export const deleteAdminStation = (stationId: string) =>
  apiDelete(`/api/admin/stations/${stationId}`)

export type AdminStationQrTokenResponse = {
  id: number
  stationId: string
  purpose: 'CHECK_IN' | 'CHECK_OUT'
  rawToken?: string
  generatedAt?: string
  schemaVersion: string
  isActive?: boolean
  expiresAt?: string | null
  revokedAt?: string | null
  createdAt: string
  updatedAt?: string
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'INACTIVE'
}

export const getAdminStationQrTokens = (stationId: string) =>
  apiGet<AdminStationQrTokenResponse[]>(`/api/admin/stations/${stationId}/qr-tokens`)

export const generateAdminStationQrTokens = (stationId: string) =>
  apiPost<{stationId: string; qrTokens: AdminStationQrTokenResponse[]}>(
    `/api/admin/stations/${stationId}/generate-qr`,
    {},
  )

export const rotateAdminStationQrToken = (
  stationId: string,
  purpose: AdminStationQrTokenResponse['purpose'],
) =>
  apiPost<AdminStationQrTokenResponse>(
    `/api/admin/stations/${stationId}/qr-tokens/${purpose}/rotate`,
    {},
  )

export const revokeAdminStationQrToken = (
  stationId: string,
  purpose: AdminStationQrTokenResponse['purpose'],
) =>
  apiDelete<{success: boolean; stationId: string; purpose: string; revokedAt: string | null}>(
    `/api/admin/stations/${stationId}/qr-tokens/${purpose}`,
  )

export const cancelPlayerStation = (stationId: string) =>
  apiPost(`/api/player/stations/${stationId}/cancel`, {})

export const getLeaderboard = () =>
  apiGet<LeaderboardEntryResponse[]>('/api/leaderboard')

async function runPlayerRead<T>(key: string, request: () => Promise<T>) {
  const principalKey = getStoredSessionPrincipalKey()
  return runSingleFlight(`${key}:${principalKey ?? 'anonymous'}`, async () => {
    const result = await request()
    if (getStoredSessionPrincipalKey() !== principalKey) {
      throw new StaleSessionResponseError()
    }
    return result
  })
}

export const getPlayerLeaderboard = () =>
  runPlayerRead('player-leaderboard', async () => {
    try {
      return await apiGet<LeaderboardEntryResponse[]>('/api/player/leaderboard')
    } catch (error) {
      if (!isCompatibilityFallback(error)) {
        throw error
      }
      return getLeaderboard()
    }
  })

export type FinalResponse = {
  id: number; title: string; clueText: string | null; startsAt: string
  eventEndTime: string; finalStartsAt: string; maxWinners: number; pointsByRank: number[]; isOpen: boolean
  canSubmit: boolean; blockedByActiveStation: boolean; activeStationId: string | null
  teamSubmission: FinalSubmissionResponse | null; wrongAttemptCount: number
  cooldownSeconds: number; nextAttemptAt: string | null; serverNow: string
  answerLength: number | null; notifyBeforeMinutes: number; secondsUntilFinal: number
  stationCheckInClosed: boolean; phase: 'NORMAL' | 'NOTICE' | 'STATIONS_CLOSED' | 'FINAL_STARTED'
  pendingScoreStationId: string | null
}
export type FinalSubmissionResponse = {
  id: number; teamId: number; isCorrect: boolean; winnerRank: number | null
  pointsAwarded: number; submittedAt: string
}
export const getPlayerFinal = () =>
  runPlayerRead('player-final', () => apiGet<FinalResponse>('/api/player/final'))
export const submitFinalAnswer = (answer: string) =>
  apiPost<FinalSubmissionResponse>('/api/player/final/submit', {answer})

export const getAdminDashboard = () => apiGet<Record<string, unknown>>('/api/admin/dashboard')
export type AdminScoreQueueItemResponse = {
  id: number
  teamId: number
  stationId: string
  status: PlayerProgressResponse['status']
  checkedOutAt: string | null
  completedAt: string | null
  scoreAchieved: number
  notes?: string | null
  station: {
    id: string
    name: string
    nameEn?: string | null
    trackingMode: StationTrackingMode
  }
  game: {
    id: string
    type: GameType
    maxPoints: number | null
    scoreEntryMax?: number
  }
  scoreEntryMax?: number
  referenceExceeded?: boolean
  team: AdminTeamResponse
}
export const getAdminScoreQueue = () => apiGet<AdminScoreQueueItemResponse[]>('/api/admin/score-queue')
export const getAdminEventConfig = () => apiGet<Record<string, unknown>>('/api/admin/event-config')
export const updateAdminEventConfig = (values: Record<string, unknown>) =>
  apiPatch('/api/admin/event-config', values)
export const getAdminActivityLogs = () => apiGet<Array<Record<string, unknown>>>('/api/admin/activity-logs')
export type AdminEventPreparationStatus = {
  serverNow: string
  resetCutoff: string
  resetEnabled: boolean
  inventory: {
    teams: number
    activeStations: number
    activeGames: number
    activeTeamQrTokens: number
    activeStationQrTokens: number
    eventConfigRows: number
    activeFinalChallenges: number
    ready: boolean
    issues: string[]
  }
}
export type AdminGameplayResetResponse = {
  teams: number
  progressRows: number
  teamSessions: number
  scoreEvents: number
  finalSubmissions: number
  activityLogs: number
}
export type AdminBulkQrRotationResponse = {
  teams: number
  stations: number
  teamQrTokens: number
  stationQrTokens: number
  revokedTeamSessions: number
}
export const getAdminEventPreparation = () =>
  apiGet<AdminEventPreparationStatus>('/api/admin/event-preparation')
export const resetAdminGameplay = (confirmation: string, backupConfirmed: boolean) =>
  apiPost<AdminGameplayResetResponse>('/api/admin/event-preparation/reset', {confirmation, backupConfirmed})
export const rotateAdminEventPreparationQr = (confirmation: string, backupConfirmed: boolean) =>
  apiPost<AdminBulkQrRotationResponse>('/api/admin/event-preparation/rotate-qr', {confirmation, backupConfirmed})
export const getAdminFinalConfig = () => apiGet<Record<string, unknown>>('/api/admin/final-config')
export const getAdminFinalSubmissions = () => apiGet<Array<Record<string, unknown>>>('/api/admin/final/submissions')
export const updateAdminFinalConfig = (values: Record<string, unknown>) =>
  apiPatch('/api/admin/final-config', values)

export async function downloadAdminSummary() {
  await downloadFile('/api/admin/reports/summary.xlsx', 'movement-summary.xlsx')
}

export async function downloadAdminTeamResults() {
  await downloadFile('/api/admin/reports/team-results.xlsx', 'movement-2026-team-results.xlsx')
}

export type AdminQrCodeExportResponse = {
  fileName: string
  generatedAt: string
  teams: Array<{teamId: number; loginUrl: string}>
  stations: Array<{
    stationId: string
    purpose: 'CHECK_IN' | 'CHECK_OUT'
    rawToken: string
  }>
  repaired: {
    teamIds: number[]
    stationTokens: Array<{
      stationId: string
      purpose: 'CHECK_IN' | 'CHECK_OUT'
    }>
  }
}

export const prepareAdminQrCodeExport = () =>
  apiPost<AdminQrCodeExportResponse>('/api/admin/reports/qr-codes', {})

async function downloadFile(path: string, fallbackFileName: string) {
  const {blob, fileName} = await apiDownloadFile(path, fallbackFileName)
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = fileName
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0)
}
