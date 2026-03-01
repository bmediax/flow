import clsx from 'clsx'
import { ComponentProps, useCallback } from 'react'

import { range } from '@flow/internal'
import {
  useAuth,
  useBackground,
  useColorScheme,
  useSourceColor,
  useThemeSync,
  useTranslation,
} from '@flow/reader/hooks'
import { useSettings } from '@flow/reader/state'

import { ColorPicker, Label } from '../Form'
import { PaneViewProps, PaneView, Pane } from '../base'

export const ThemeView: React.FC<PaneViewProps> = (props) => {
  const { scheme, setScheme } = useColorScheme()
  const { sourceColor, setSourceColor } = useSourceColor()
  const [, setBackground] = useBackground()
  const [{ theme }] = useSettings()
  const { isAuthenticated } = useAuth()
  const { saveToRemote, isSyncing } = useThemeSync()
  const t = useTranslation('theme')

  const handleSync = useCallback(async () => {
    await saveToRemote({
      sourceColor,
      background: theme?.background ?? -1,
      colorScheme: scheme,
    })
  }, [saveToRemote, sourceColor, theme?.background, scheme])

  return (
    <PaneView {...props}>
      <Pane headline={t('title')} className="space-y-3 px-5 pt-2 pb-4">
        <div>
          <ColorPicker
            name={t('source_color')}
            defaultValue={sourceColor}
            onChange={(e) => {
              setSourceColor(e.target.value)
            }}
          />
        </div>
        <div>
          <Label name={t('background_color')}></Label>
          <div className="flex gap-2">
            {range(7)
              .filter((i) => !(i % 2))
              .map((i) => i - 1)
              .map((i) => (
                <Background
                  key={i}
                  className={i > 0 ? `bg-surface${i}` : 'bg-white'}
                  onClick={() => {
                    setScheme('light')
                    setBackground(i)
                  }}
                />
              ))}
            <Background
              className="bg-black"
              onClick={() => {
                setScheme('dark')
              }}
            />
          </div>
        </div>
        {isAuthenticated && (
          <div className="pt-2">
            <button
              type="button"
              onClick={handleSync}
              disabled={isSyncing}
              className="bg-primary text-on-primary hover:bg-primary/90 disabled:bg-primary/50 rounded px-3 py-1.5 text-sm font-medium transition-colors"
            >
              {isSyncing ? 'Syncing...' : 'Sync to Cloud'}
            </button>
          </div>
        )}
      </Pane>
    </PaneView>
  )
}

interface BackgroundProps extends ComponentProps<'div'> {}
const Background: React.FC<BackgroundProps> = ({ className, ...props }) => {
  return (
    <div
      className={clsx('border-outline-variant light h-6 w-6 border', className)}
      {...props}
    ></div>
  )
}
