import './App.css'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMovementBootstrap } from './features/movement/hooks/useMovementBootstrap'
import { usePlayerStatePolling } from './features/movement/hooks/usePlayerStatePolling'
import { getMe, isAuthFailure, type AuthMeResponse } from './features/movement/api'
import { useMovementStore } from './features/movement/store'
import { MovementRoutes } from './features/movement/routes'
import {
  isSessionExpired,
  parseStoredSession,
  SESSION_STORAGE_KEY,
} from './features/movement/sessionIdentity'
import type {Session} from './features/movement/types'

function authMatchesSession(auth: AuthMeResponse, session: Session) {
  if (session.role === 'user') {
    return auth.type === 'TEAM' && String(auth.team.id) === session.teamId
  }
  return auth.type === 'USER' && auth.user.username === session.username
}

function App() {
  const session = useMovementStore((state) => state.session)
  const logout = useMovementStore((state) => state.logout)
  const syncSession = useMovementStore((state) => state.syncSession)
  const navigate = useNavigate()

  useMovementBootstrap()
  usePlayerStatePolling()

  useEffect(() => {
    if (!session?.accessToken) {
      return
    }

    let isMounted = true

    const validatedSession = session
    void getMe()
      .then((auth) => {
        if (!isMounted) return
        if (!authMatchesSession(auth, validatedSession)) {
          logout()
          navigate('/login')
        }
      })
      .catch((error: unknown) => {
        if (!isMounted) return
        if (isAuthFailure(error)) {
          logout()
          navigate('/login')
        }
      })

    return () => {
      isMounted = false
    }
  }, [session, logout, navigate])

  useEffect(() => {
    if (!session) {
      return
    }

    if (isSessionExpired(session)) {
      logout()
      navigate('/login')
      return
    }

    const expiresAt = new Date(session.expiresAt).getTime()
    const timer = window.setTimeout(() => {
      logout()
      navigate('/login')
    }, Math.max(0, expiresAt - Date.now()))
    return () => window.clearTimeout(timer)
  }, [logout, navigate, session])

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.storageArea !== window.localStorage || event.key !== SESSION_STORAGE_KEY) {
        return
      }
      syncSession(parseStoredSession(event.newValue))
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [syncSession])

  return <MovementRoutes />
}

export default App
