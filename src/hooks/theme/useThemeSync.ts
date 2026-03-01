import { useCallback, useRef, useState } from 'react'
import { useAuth } from '../useAuth'

export interface ThemePreferences {
  sourceColor?: string
  background?: number
  colorScheme?: 'light' | 'dark' | 'system'
}

export function useThemeSync() {
  const { isAuthenticated } = useAuth()
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const requestIdRef = useRef(0)

  const saveToRemote = useCallback(
    async (preferences: ThemePreferences) => {
      if (!isAuthenticated) return false

      try {
        setIsSyncing(true)
        setSyncError(null)

        const response = await fetch('/api/user/theme', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(preferences),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Sync failed')
        }

        return true
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown error'
        console.warn('Theme sync failed:', message)
        setSyncError(message)
        return false
      } finally {
        setIsSyncing(false)
      }
    },
    [isAuthenticated]
  )

  const fetchFromRemote = useCallback(async (): Promise<ThemePreferences | null> => {
    if (!isAuthenticated) return null

    const requestId = ++requestIdRef.current

    try {
      const response = await fetch('/api/user/theme')

      if (requestId !== requestIdRef.current) {
        return null
      }

      if (!response.ok) {
        return null
      }

      const data = await response.json()
      return data.preferences ?? null
    } catch (error) {
      console.warn('Failed to fetch remote theme:', error)
      return null
    }
  }, [isAuthenticated])

  return {
    saveToRemote,
    fetchFromRemote,
    isSyncing,
    syncError,
  }
}
