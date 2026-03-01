import { useCallback, useEffect, useMemo } from 'react'

import { compositeColors } from '@flow/reader/color'
import { useSettings } from '@flow/reader/state'

import { useColorScheme } from './useColorScheme'
import { useTheme } from './useTheme'
import { useThemeSync } from './useThemeSync'

export function useBackground() {
  const [{ theme }, setSettings] = useSettings()
  const { dark } = useColorScheme()
  const rawTheme = useTheme()
  const { saveToRemote } = useThemeSync()

  const setBackground = useCallback(
    (background: number) => {
      setSettings((prev) => ({
        ...prev,
        theme: {
          ...prev.theme,
          background,
        },
      }))
      saveToRemote({ background })
    },
    [setSettings, saveToRemote],
  )

  // [-1, 1, 3, 5]
  const level = theme?.background ?? -1

  const background = useMemo(() => {
    if (dark) return 'bg-default'

    if (level > 0) return `bg-surface${level}`

    return 'bg-default'
  }, [dark, level])

  useEffect(() => {
    if (dark === undefined) return
    if (rawTheme === undefined) return

    const surfaceMap: Record<number, number> = {
      1: 0.05,
      2: 0.08,
      3: 0.11,
      4: 0.12,
      5: 0.14,
    }

    const { surface, primary } = rawTheme.schemes.light

    const color = dark
      ? '#24292e'
      : level < 0
      ? '#fff'
      : compositeColors(surface, primary, surfaceMap[level]!)

    document.querySelector('#theme-color')?.setAttribute('content', color)
  }, [dark, level, rawTheme])

  return [background, setBackground] as const
}
