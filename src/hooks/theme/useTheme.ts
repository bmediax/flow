import { Theme } from '@material/material-color-utilities'
import { atom, useAtomValue, useSetAtom, type PrimitiveAtom } from 'jotai'

const themeAtom = atom<Theme | undefined>(undefined) as PrimitiveAtom<Theme | undefined>

export function useTheme() {
  return useAtomValue(themeAtom)
}

export function useSetTheme() {
  return useSetAtom(themeAtom)
}
