import { Button, Result, Spin, Typography } from 'antd'
import { useEffect, useState, type PropsWithChildren } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import {useTranslation} from 'react-i18next'
import { AppFrame } from './AppFrame'
import { useMovementStore } from '../store'
import type { Role } from '../types'
import { fetchPlayerDatabase } from '../playerData'

type ProtectedRouteProps = Readonly<PropsWithChildren<{
  allow?: Role[]
  fullscreen?: boolean
}>>

export function ProtectedRoute({ children, allow, fullscreen = false }: ProtectedRouteProps) {
  const navigate = useNavigate()
  const {i18n} = useTranslation()
  const session = useMovementStore((state) => state.session)
  const teams = useMovementStore((state) => state.teams)
  const teamStations = useMovementStore((state) => state.teamStations)
  const loadDatabase = useMovementStore((state) => state.loadDatabase)
  const [retryKey, setRetryKey] = useState(0)
  const [loadError, setLoadError] = useState<string | null>(null)

  const hasPlayerData =
    session?.role !== 'user' ||
    !session.teamId ||
    (teams.some((team) => team.id === session.teamId) &&
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
          setLoadError(
            error instanceof Error ? error.message : 'Cannot load player data',
          )
        }
      })

    return () => {
      cancelled = true
    }
  }, [hasPlayerData, i18n.language, loadDatabase, retryKey, session])

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (allow && !allow.includes(session.role)) {
    const homePath = session.role === 'admin' ? '/teams' : '/stations'
    const homeLabel =
      session.role === 'admin' ? 'Quay về danh sách đội' : 'Quay về danh sách trạm'
    return (
      <AppFrame>
        <Result
          status="403"
          title="Không có quyền truy cập"
          subTitle="Màn hình này chỉ hiển thị cho đúng nhóm quyền được mô tả trong yêu cầu."
          extra={<Button onClick={() => navigate(homePath)}>{homeLabel}</Button>}
        />
      </AppFrame>
    )
  }

  if (session.role === 'user' && !hasPlayerData) {
    const loadingContent = loadError ? (
      <Result
        status="error"
        title="Cannot load team data"
        subTitle={loadError}
        extra={
          <Button
            type="primary"
            onClick={() => {
              setLoadError(null)
              setRetryKey((value) => value + 1)
            }}
          >
            Retry
          </Button>
        }
      />
    ) : (
      <div style={{ minHeight: 320, display: 'grid', placeItems: 'center' }}>
        <Spin size="large" description="Loading team and station data...">
          <Typography.Text aria-hidden style={{ opacity: 0 }}>
            Loading
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
