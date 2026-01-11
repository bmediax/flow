import { atom, useAtom, useSetAtom, type SetStateAction, type PrimitiveAtom } from 'jotai'

export type Action =
  | 'toc'
  | 'search'
  | 'annotation'
  | 'typography'
  | 'image'
  | 'timeline'
  | 'theme'

export const actionAtom = atom<Action | undefined>(undefined) as PrimitiveAtom<Action | undefined>

export function useSetAction() {
  return useSetAtom(actionAtom)
}

export function useAction(): [
  Action | undefined,
  (update: SetStateAction<Action | undefined>) => void,
] {
  return useAtom(actionAtom)
}
