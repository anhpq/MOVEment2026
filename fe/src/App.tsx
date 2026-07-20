import './App.css'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMovementBootstrap } from './features/movement/hooks/useMovementBootstrap'
import { getMe } from './features/movement/api'
import { useMovementStore } from './features/movement/store'
import { MovementRoutes } from './features/movement/routes'

function App() {
  const session = useMovementStore((state) => state.session)
  const logout = useMovementStore((state) => state.logout)
  const navigate = useNavigate()

  useMovementBootstrap()

  useEffect(() => {
    if (!session?.accessToken) {
      return
    }

    let isMounted = true

    void getMe()
      .then(() => {
        if (!isMounted) return
      })
      .catch(() => {
        if (!isMounted) return
        logout()
        navigate('/login')
      })

    return () => {
      isMounted = false
    }
  }, [session?.accessToken, logout, navigate])

  return <MovementRoutes />
}

export default App
