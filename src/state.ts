import { atom, useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

import { RenditionSpread } from '@flow/epubjs/types/rendition'

export const navbarAtom = atom<boolean>(false)

export interface Settings extends TypographyConfiguration {
  theme?: ThemeConfiguration
  enableTextSelectionMenu?: boolean
}

export interface TypographyConfiguration {
  fontSize?: string
  fontWeight?: number
  fontFamily?: string
  lineHeight?: number
  spread?: RenditionSpread
  zoom?: number
}

interface ThemeConfiguration {
  source?: string
  background?: number
}

export const defaultSettings: Settings = {}

const settingsAtom = atomWithStorage<Settings>('settings', defaultSettings)

export function useSettings() {
  return useAtom(settingsAtom)
}
