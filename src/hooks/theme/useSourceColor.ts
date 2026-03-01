import { useCallback } from 'react'

import { useSettings } from '@flow/reader/state'

import { useThemeSync } from './useThemeSync'

export function useSourceColor() {
  const [{ theme }, setSettings] = useSettings()
  const { saveToRemote } = useThemeSync()

  const setSourceColor = useCallback(
    (source: string) => {
      setSettings((prev) => ({
        ...prev,
        theme: {
          ...prev.theme,
          source,
        },
      }))
      saveToRemote({ sourceColor: source })
    },
    [setSettings, saveToRemote],
  )

  return { sourceColor: theme?.source ?? '#0ea5e9', setSourceColor }
}
