import { useEffect } from 'react'
import { useMovementStore } from '../store'
import type { LocalDatabaseSeed } from '../types'

export function useMovementBootstrap() {
  const loadDatabase = useMovementStore((state) => state.loadDatabase)

  useEffect(() => {
    let isMounted = true

    const bootstrapDatabase = async () => {
      try {
        const response = await fetch('/assets/database.json')
        if (!response.ok) {
          throw new Error(`Failed to load local database: ${response.status}`)
        }

        const seed = (await response.json()) as LocalDatabaseSeed
        if (isMounted) {
          loadDatabase(seed)
        }
      } catch (error) {
        console.warn('Using in-code fallback database seed.', error)
      }
    }

    void bootstrapDatabase()

    return () => {
      isMounted = false
    }
  }, [loadDatabase])
}