import { useEventListener } from '@literal-ui/hooks'
import Dexie from 'dexie'
import { parseCookies, destroyCookie } from 'nookies'
import { useState, useEffect } from 'react'
import useLocalStorageState from 'use-local-storage-state'

import {
  ColorScheme,
  useColorScheme,
  useForceRender,
  useTranslation,
} from '@flow/reader/hooks'
import {
  useSettings,
  AI_PROVIDERS,
  type AIProvider,
} from '@flow/reader/state'
import { dbx, mapToToken, OAUTH_SUCCESS_MESSAGE } from '@flow/reader/sync'
import { encrypt, decrypt } from '@flow/reader/crypto'

import { Button } from '../Button'
import { Checkbox, Select, TextField } from '../Form'
import { Page } from '../Page'

type Locale = 'en-US' | 'zh-CN' | 'ja-JP'

export const Settings: React.FC = () => {
  const { scheme, setScheme } = useColorScheme()
  const [locale, setLocale] = useLocalStorageState<Locale>('locale', {
    defaultValue: 'en-US',
  })
  const [settings, setSettings] = useSettings()
  const t = useTranslation('settings')

  return (
    <Page headline={t('title')}>
      <div className="space-y-6">
        <Item title={t('language')}>
          <Select
            value={locale}
            onChange={(e) => {
              setLocale(e.target.value as Locale)
            }}
          >
            <option value="en-US">English</option>
            <option value="zh-CN">简体中文</option>
            <option value="ja-JP">日本語</option>
          </Select>
        </Item>
        <Item title={t('color_scheme')}>
          <Select
            value={scheme}
            onChange={(e) => {
              setScheme(e.target.value as ColorScheme)
            }}
          >
            <option value="system">{t('color_scheme.system')}</option>
            <option value="light">{t('color_scheme.light')}</option>
            <option value="dark">{t('color_scheme.dark')}</option>
          </Select>
        </Item>
        <Item title={t('text_selection_menu')}>
          <Checkbox
            name={t('text_selection_menu.enable')}
            checked={settings.enableTextSelectionMenu}
            onChange={(e) => {
              setSettings({
                ...settings,
                enableTextSelectionMenu: e.target.checked,
              })
            }}
          />
        </Item>
        <AISettings />
        <Synchronization />
        <Item title={t('cache')}>
          <Button
            variant="secondary"
            onClick={() => {
              window.localStorage.clear()
              Dexie.getDatabaseNames().then((names) => {
                names.forEach((n) => Dexie.delete(n))
              })
            }}
          >
            {t('cache.clear')}
          </Button>
        </Item>
      </div>
    </Page>
  )
}

const AISettings: React.FC = () => {
  const [settings, setSettings] = useSettings()
  const [apiToken, setApiToken] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const t = useTranslation('settings.ai')

  const provider = (settings.ai?.provider ?? 'anthropic') as AIProvider
  const availableModels = AI_PROVIDERS[provider].models

  // Decrypt API token on mount
  useEffect(() => {
    const loadApiToken = async () => {
      if (settings.ai?.apiToken) {
        const decrypted = await decrypt(settings.ai.apiToken)
        setApiToken(decrypted)
      }
      setIsLoading(false)
    }
    loadApiToken()
  }, [settings.ai?.apiToken])

  const handleProviderChange = (newProvider: AIProvider) => {
    // Reset model when provider changes
    const defaultModel = AI_PROVIDERS[newProvider].models[0].id
    setSettings({
      ...settings,
      ai: {
        ...settings.ai,
        provider: newProvider,
        model: defaultModel,
      },
    })
  }

  const handleApiTokenChange = async (value: string) => {
    setApiToken(value)
    const encrypted = value ? await encrypt(value) : ''
    setSettings({
      ...settings,
      ai: {
        ...settings.ai,
        apiToken: encrypted,
      },
    })
  }

  const handleModelChange = (value: string) => {
    setSettings({
      ...settings,
      ai: {
        ...settings.ai,
        model: value,
      },
    })
  }

  const handleInstructionsChange = (value: string) => {
    setSettings({
      ...settings,
      ai: {
        ...settings.ai,
        instructions: value,
      },
    })
  }

  const handleTargetLanguageChange = (value: string) => {
    setSettings({
      ...settings,
      ai: {
        ...settings.ai,
        targetLanguage: value,
      },
    })
  }

  if (isLoading) {
    return null
  }

  return (
    <Item title={t('title')}>
      <div className="space-y-3">
        <div>
          <label className="typescale-body-medium text-on-surface-variant mb-1 block">
            {t('provider')}
          </label>
          <Select
            value={provider}
            onChange={(e) => handleProviderChange(e.target.value as AIProvider)}
          >
            {Object.entries(AI_PROVIDERS).map(([key, value]) => (
              <option key={key} value={key}>
                {value.name}
              </option>
            ))}
          </Select>
        </div>
        <TextField
          name={t('api_token')}
          type="password"
          value={apiToken}
          onChange={(e) => handleApiTokenChange(e.target.value)}
          placeholder={
            provider === 'anthropic' ? 'sk-ant-...' : 'sk-...'
          }
        />
        <div>
          <label className="typescale-body-medium text-on-surface-variant mb-1 block">
            {t('model')}
          </label>
          <Select
            value={settings.ai?.model ?? availableModels[0].id}
            onChange={(e) => handleModelChange(e.target.value)}
          >
            {availableModels.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </Select>
        </div>
        <TextField
          as="textarea"
          name={t('instructions')}
          value={settings.ai?.instructions ?? ''}
          onChange={(e) => handleInstructionsChange(e.target.value)}
          placeholder={t('instructions_placeholder')}
          className="h-24"
        />
        <div>
          <label className="typescale-body-medium text-on-surface-variant mb-1 block">
            {t('target_language')}
          </label>
          <Select
            value={settings.ai?.targetLanguage ?? 'English'}
            onChange={(e) => handleTargetLanguageChange(e.target.value)}
          >
            <option value="English">English</option>
            <option value="Spanish">Español</option>
            <option value="French">Français</option>
            <option value="German">Deutsch</option>
            <option value="Italian">Italiano</option>
            <option value="Portuguese">Português</option>
            <option value="Russian">Русский</option>
            <option value="Japanese">日本語</option>
            <option value="Korean">한국어</option>
            <option value="Chinese (Simplified)">简体中文</option>
            <option value="Chinese (Traditional)">繁體中文</option>
            <option value="Arabic">العربية</option>
            <option value="Hindi">हिन्दी</option>
            <option value="Dutch">Nederlands</option>
            <option value="Polish">Polski</option>
            <option value="Turkish">Türkçe</option>
            <option value="Vietnamese">Tiếng Việt</option>
            <option value="Thai">ไทย</option>
            <option value="Swedish">Svenska</option>
            <option value="Danish">Dansk</option>
            <option value="Norwegian">Norsk</option>
            <option value="Finnish">Suomi</option>
          </Select>
        </div>
      </div>
    </Item>
  )
}

const Synchronization: React.FC = () => {
  const cookies = parseCookies()
  const refreshToken = cookies[mapToToken['dropbox']]
  const render = useForceRender()
  const t = useTranslation('settings.synchronization')

  useEventListener('message', (e) => {
    if (e.data === OAUTH_SUCCESS_MESSAGE) {
      // init app (generate access token, fetch remote data, etc.)
      window.location.reload()
    }
  })

  return (
    <Item title={t('title')}>
      <Select>
        <option value="dropbox">Dropbox</option>
      </Select>
      <div className="mt-2">
        {refreshToken ? (
          <Button
            variant="secondary"
            onClick={() => {
              destroyCookie(null, mapToToken['dropbox'])
              render()
            }}
          >
            {t('unauthorize')}
          </Button>
        ) : (
          <Button
            onClick={() => {
              const redirectUri =
                window.location.origin + '/api/callback/dropbox'

              dbx.auth
                .getAuthenticationUrl(
                  redirectUri,
                  JSON.stringify({ redirectUri }),
                  'code',
                  'offline',
                )
                .then((url) => {
                  window.open(url as string, '_blank')
                })
            }}
          >
            {t('authorize')}
          </Button>
        )}
      </div>
    </Item>
  )
}

interface PartProps {
  title: string
  children?: React.ReactNode
}
const Item: React.FC<PartProps> = ({ title, children }) => {
  return (
    <div>
      <h3 className="typescale-title-small text-on-surface-variant">{title}</h3>
      <div className="mt-2">{children}</div>
    </div>
  )
}

Settings.displayName = 'settings'
