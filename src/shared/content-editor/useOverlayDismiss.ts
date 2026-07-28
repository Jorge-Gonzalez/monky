import type { RefObject } from 'react'
import { useEffect, useRef } from 'react'

/**
 * Closes an overlay when the user clicks outside it or presses Escape.
 *
 * Both listeners use the capture phase to work correctly inside a Shadow DOM:
 *
 * - mousedown on document (capture): fires before the modal-dialog's
 *   bubble-phase stopPropagation; uses composedPath() instead of e.target
 *   because target gets retargeted to the shadow host at the shadow boundary.
 *
 * - keydown on window (capture): fires before any document-level handler
 *   (including the modal keyboard handler), regardless of registration order.
 *   stopPropagation() prevents the modal from also closing on Escape.
 */
export function useOverlayDismiss(
  wrapperRef: RefObject<HTMLElement | null>,
  open: boolean,
  onClose: () => void
): void {
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return

    const handleMouseDown = (e: MouseEvent) => {
      if (wrapperRef.current && !e.composedPath().includes(wrapperRef.current)) {
        onCloseRef.current()
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onCloseRef.current()
      }
    }

    document.addEventListener('mousedown', handleMouseDown, true)
    window.addEventListener('keydown', handleKeyDown, true)

    return () => {
      document.removeEventListener('mousedown', handleMouseDown, true)
      window.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [open, wrapperRef])
}
