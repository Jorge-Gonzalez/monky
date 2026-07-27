import type { RefObject } from 'react'
import { useEffect } from 'react'

type FocusableElement = HTMLElement & { focus: () => void }

export function useAutoFocus<T extends FocusableElement>(
  inputRef: RefObject<T | null>,
  isActive: boolean
) {
  useEffect(() => {
    if (isActive && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isActive, inputRef])
}