import { atom, useAtom, type SetStateAction } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

import { RenditionSpread } from '@flow/epubjs/types/rendition'

export const navbarAtom = atom<boolean>(false)

// Global translation state
export interface TranslationProgress {
  total: number
  current: number
  currentSection: string
}

export interface TranslationJob {
  bookId: string
  bookTitle: string
  progress: TranslationProgress
  startTime: number
}

export const activeTranslationAtom = atom<TranslationJob | null>(null)

export function useActiveTranslation(): [
  TranslationJob | null,
  (update: SetStateAction<TranslationJob | null>) => void,
] {
  return useAtom(activeTranslationAtom)
}

export interface Settings extends TypographyConfiguration {
  theme?: ThemeConfiguration
  enableTextSelectionMenu?: boolean
  ai?: AIConfiguration
}

export type AIProvider = 'anthropic' | 'openai'

export interface AIConfiguration {
  provider?: AIProvider
  apiToken?: string // Encrypted API token
  model?: string
  instructions?: string
  targetLanguage?: string // Target language for translation
}

export const AI_PROVIDERS: Record<
  AIProvider,
  { name: string; models: { id: string; name: string }[] }
> = {
  anthropic: {
    name: 'Anthropic',
    models: [
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku' },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
      { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet' },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' },
    ],
  },
  openai: {
    name: 'OpenAI',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'gpt-4o-mini', name: 'GPT-4o mini' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
      { id: 'gpt-4', name: 'GPT-4' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
    ],
  },
}

export interface TypographyConfiguration {
  fontSize?: string
  fontWeight?: number
  fontFamily?: string
  lineHeight?: number
  spread?: RenditionSpread
  zoom?: number
  containerPadding?: number
  columnSpacing?: number
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
