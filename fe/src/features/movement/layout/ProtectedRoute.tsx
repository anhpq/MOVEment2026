import { Button, Result, Spin, Typography } from 'antd'
import { useEffect, useState, type PropsWithChildren } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import {useTranslation} from 'react-i18next'
import { AppFrame } from './AppFrame'
import { useMovementStore } from '../store'
import type { Role } from '../types'
import {isAuthFailure} from '../api'
import { fetchPlayerDatabase } from '../playerData'
import {getSessionPrincipalKey} from '../sessionIdentity'

type ProtectedRouteProps = Readonly<PropsWithChildren<{
  allow?: Role[]
  fullscreen?: boolean
}>>

export function ProtectedRoute({ children, allow, fullscreen = false }: ProtectedRouteProps) {
  const navigate = useNavigate()
  const {i18n, t} = useTranslation()
  const session = useMovementStore((state) => state.session)
  const dataSessionKey = useMovementStore((state) => state.dataSessionKey)
  const teams = useMovementStore((state) => state.teams)
  const teamStations = useMovementStore((state) => state.teamStations)
  const loadDatabase = useMovementStore((state) => state.loadDatabase)
  const logout = useMovementStore((state) => state.logout)
  const [retryKey, setRetryKey] = useState(0)
  const [loadError, setLoadError] = useState(false)

  const hasPlayerData =
    session?.role !== 'user' ||
    !session.teamId ||
    (dataSessionKey === getSessionPrincipalKey(session) &&
      teams.some((team) => team.id === session.teamId) &&
      Object.hasOwn(teamStations, session.teamId))

  useEffect(() => {
    if (!session || session.role !== 'user' || hasPlayerData) {
      return
    }

    let cancelled = false

    const language = i18n.language === 'en' ? 'en' : 'vi'

    void fetchPlayerDatabase(language)
      .then((seed) => {
        if (!cancelled) {
          loadDatabase(seed)
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          if (isAuthFailure(error)) {
            logout()
          } else {
            setLoadError(true)
          }
        }
      })

    return () => {
      cancelled = true
    }
  }, [hasPlayerData, i18n.language, loadDatabase, logout, retryKey, session])

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (allow && !allow.includes(session.role)) {
    const homePath = session.role === 'admin' ? '/teams' : '/team/v2'
    const homeLabel =
      session.role === 'admin' ? t('route.backToTeams') : t('route.backToGame')
    return (
      <AppFrame>
        <Result
          status="403"
          title={t('route.accessDeniedTitle')}
          subTitle={t('route.accessDeniedDescription')}
          extra={<Button onClick={() => navigate(homePath)}>{homeLabel}</Button>}
        />
      </AppFrame>
    )
  }

  if (session.role === 'user' && !hasPlayerData) {
    const loadingContent = loadError ? (
      <Result
        status="error"
        title={t("stationData.loadFailedTitle")}
        subTitle={t("stationData.loadFailedDescription")}
        extra={
          <Button
            type="primary"
            onClick={() => {
              setLoadError(false)
              setRetryKey((value) => value + 1)
            }}
          >
            {t("route.retry")}
          </Button>
        }
      />
    ) : (
      <div style={{ minHeight: 320, display: 'grid', placeItems: 'center' }}>
        <Spin size="large" description={t("stationData.loading")}>
          <Typography.Text aria-hidden style={{ opacity: 0 }}>
            {t("route.loading")}
          </Typography.Text>
        </Spin>
      </div>
    )

    if (fullscreen) {
      return loadingContent
    }

    return (
      <AppFrame>
        {loadingContent}
      </AppFrame>
    )
  }

  if (fullscreen) {
    return children
  }

  return <AppFrame>{children}</AppFrame>
}
