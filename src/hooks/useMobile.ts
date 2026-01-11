import { atom, useAtom, type PrimitiveAtom } from 'jotai'
import { useEffect } from 'react'

export const mobileAtom = atom<boolean | undefined>(undefined) as PrimitiveAtom<boolean | undefined>

let listened = false

export function useMobile() {
  const [mobile, setMobile] = useAtom(mobileAtom)

  useEffect(() => {
    if (listened) return
    listened = true

    const mq = window.matchMedia('(max-width: 640px)')
    setMobile(mq.matches)
    mq.addEventListener('change', (e) => {
      setMobile(e.matches)
    })
  }, [setMobile])

  return mobile
}
