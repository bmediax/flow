import { useCallback } from 'react'

import { useSettings } from '@flow/reader/state'

import { useThemeSync } from './useThemeSync'

export function useTextColor() {
  const [{ theme }, setSettings] = useSettings()
  const { saveToRemote } = useThemeSync()

  const setTextColor = useCallback(
    (textColor: string | undefined) => {
      setSettings((prev) => ({
        ...prev,
        theme: {
          ...prev.theme,
          textColor,
        },
      }))
      saveToRemote({ textColor: textColor ?? '' })
    },
    [setSettings, saveToRemote],
  )

  return { textColor: theme?.textColor, setTextColor }
}
