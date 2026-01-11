import { useCallback } from 'react'
import useLocalStorageState from 'use-local-storage-state'

import locales from '../../locales'

type Locale = keyof typeof locales

export function useTranslation(scope?: string) {
  const [locale] = useLocalStorageState<Locale>('locale', {
    defaultValue: 'en-US',
  })

  return useCallback(
    (key: string) => {
      return (locales[locale] as Record<string, string>)[
        scope ? `${scope}.${key}` : key
      ] as string
    },
    [locale, scope],
  )
}
