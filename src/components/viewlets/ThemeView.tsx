import clsx from 'clsx'
import { ComponentProps } from 'react'

import { range } from '@flow/internal'
import {
  useBackground,
  useColorScheme,
  useSourceColor,
  useTextColor,
  useTranslation,
} from '@flow/reader/hooks'

import { ColorPicker, Label } from '../Form'
import { PaneViewProps, PaneView, Pane } from '../base'

export const ThemeView: React.FC<PaneViewProps> = (props) => {
  const { setScheme } = useColorScheme()
  const { sourceColor, setSourceColor } = useSourceColor()
  const { textColor, setTextColor } = useTextColor()
  const [, setBackground] = useBackground()
  const t = useTranslation('theme')

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
        <div className="flex items-end gap-3">
          <ColorPicker
            name={t('text_color')}
            value={textColor ?? '#000000'}
            onChange={(e) => {
              setTextColor(e.target.value)
            }}
          />
          {textColor && (
            <button
              type="button"
              className="text-on-surface-variant typescale-body-small mb-1.5 underline"
              onClick={() => setTextColor(undefined)}
            >
              {t('text_color_reset')}
            </button>
          )}
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
