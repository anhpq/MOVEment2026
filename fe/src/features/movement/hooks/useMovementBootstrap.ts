import { useEffect } from 'react'
import { useMovementStore } from '../store'
import {fetchAdminDatabase} from '../adminData'

export function useMovementBootstrap() {
  const loadDatabase = useMovementStore((state) => state.loadDatabase)
  const sessionRole = useMovementStore((state) => state.session?.role)

  useEffect(() => {
    if (sessionRole !== 'admin') {
      return
    }

    let isMounted = true

    const bootstrapDatabase = async () => {
      try {
        const seed = await fetchAdminDatabase()
        if (isMounted) {
          loadDatabase(seed)
        }
      } catch (error) {
        console.error('Unable to load admin data from the API.', error)
      }
    }

    void bootstrapDatabase()

    return () => {
      isMounted = false
    }
  }, [loadDatabase, sessionRole])
}
