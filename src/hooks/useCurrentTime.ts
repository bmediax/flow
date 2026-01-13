import { useEffect, useState } from 'react'

type TimeFormat = '12' | '24'

const TIME_FORMAT_KEY = 'flow-time-format'

function getStoredTimeFormat(): TimeFormat {
  if (typeof window === 'undefined') return '12'
  const stored = localStorage.getItem(TIME_FORMAT_KEY)
  return stored === '24' ? '24' : '12'
}

function formatTime(date: Date, format: TimeFormat): string {
  if (format === '24') {
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  } else {
    let hours = date.getHours()
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const ampm = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12 || 12
    return `${hours}:${minutes} ${ampm}`
  }
}

export function useCurrentTime() {
  const [time, setTime] = useState(() => new Date())
  const [format, setFormat] = useState<TimeFormat>(getStoredTimeFormat)

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const toggleFormat = () => {
    setFormat((prev) => {
      const next = prev === '12' ? '24' : '12'
      localStorage.setItem(TIME_FORMAT_KEY, next)
      return next
    })
  }

  return {
    time: formatTime(time, format),
    format,
    toggleFormat,
  }
}
