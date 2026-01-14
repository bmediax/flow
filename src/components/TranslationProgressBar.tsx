'use client'

import { useEffect } from 'react'
import { useActiveTranslation } from '../state'

export function TranslationProgressBar() {
  const [activeTranslation] = useActiveTranslation()

  const percentage = activeTranslation
    ? (activeTranslation.progress.current / activeTranslation.progress.total) *
      100
    : 0

  // Update page title with translation progress
  useEffect(() => {
    if (activeTranslation) {
      document.title = `${Math.round(percentage)}% - Translating`
    } else {
      document.title = 'Reader'
    }

    // Cleanup: reset title when component unmounts
    return () => {
      document.title = 'Reader'
    }
  }, [activeTranslation, percentage])

  if (!activeTranslation) {
    return null
  }

  const { progress, bookTitle } = activeTranslation

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="bg-surface-container px-4 py-1 text-center typescale-body-small">
        <span className="text-on-surface">
          Translating &ldquo;{bookTitle}&rdquo; - {Math.round(percentage)}% (
          {progress.currentSection})
        </span>
      </div>
      <div className="h-1 w-full bg-surface-container">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
