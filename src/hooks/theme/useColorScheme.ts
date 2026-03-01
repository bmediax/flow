import { useMediaQuery } from '@literal-ui/hooks'
import { useCallback, useEffect } from 'react'
import useLocalStorageState from 'use-local-storage-state'

import { useThemeSync } from './useThemeSync'

export type ColorScheme = 'light' | 'dark' | 'system'

export function useColorScheme() {
  const [scheme, setSchemeLocal] = useLocalStorageState<ColorScheme>(
    'literal-color-scheme',
    { defaultValue: 'system' },
  )
  const { saveToRemote } = useThemeSync()

  const setScheme = useCallback(
    (newScheme: ColorScheme) => {
      setSchemeLocal(newScheme)
      saveToRemote({ colorScheme: newScheme })
    },
    [setSchemeLocal, saveToRemote],
  )

  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)')
  const dark = scheme === 'dark' || (scheme === 'system' && prefersDark)

  useEffect(() => {
    if (dark !== undefined) {
      document.documentElement.classList.toggle('dark', dark)
    }
  }, [dark])

  return { scheme, dark, setScheme }
}
