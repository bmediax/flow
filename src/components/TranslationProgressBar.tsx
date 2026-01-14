'use client'

import { useActiveTranslation } from '@/state'

export function TranslationProgressBar() {
  const [activeTranslation] = useActiveTranslation()

  if (!activeTranslation) {
    return null
  }

  const { progress, bookTitle } = activeTranslation
  const percentage = (progress.current / progress.total) * 100

  return (
    <div className="fixed left-0 right-0 top-0 z-50">
      <div className="h-1 w-full bg-surface-container">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="bg-surface-container px-4 py-1 text-center typescale-body-small">
        <span className="text-on-surface">
          Translating &ldquo;{bookTitle}&rdquo; - {Math.round(percentage)}% (
          {progress.currentSection})
        </span>
      </div>
    </div>
  )
}
