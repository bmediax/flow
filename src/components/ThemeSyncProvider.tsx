'use client'

import { useEffect, useRef } from 'react'

import { useAuth } from '@flow/reader/hooks/useAuth'
import { useThemeSync } from '@flow/reader/hooks/theme/useThemeSync'
import { useSettings } from '@flow/reader/state'

export function ThemeSyncProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const { fetchFromRemote } = useThemeSync()
  const [, setSettings] = useSettings()
  const hasSyncedRef = useRef(false)

  useEffect(() => {
    if (isLoading || hasSyncedRef.current) return

    if (!isAuthenticated) {
      hasSyncedRef.current = true
      return
    }

    hasSyncedRef.current = true

    fetchFromRemote().then((remote) => {
      if (!remote) return

      // Apply source color and background
      if (remote.sourceColor || remote.background !== undefined) {
        setSettings((prev) => ({
          ...prev,
          theme: {
            ...prev.theme,
            ...(remote.sourceColor && { source: remote.sourceColor }),
            ...(remote.background !== undefined && { background: remote.background }),
          },
        }))
      }

      // Apply color scheme
      if (remote.colorScheme) {
        localStorage.setItem(
          'literal-color-scheme',
          JSON.stringify(remote.colorScheme)
        )
        // Force re-render of useLocalStorageState by dispatching storage event
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'literal-color-scheme',
          newValue: JSON.stringify(remote.colorScheme),
        }))
      }
    })
  }, [isAuthenticated, isLoading, fetchFromRemote, setSettings])

  return <>{children}</>
}
