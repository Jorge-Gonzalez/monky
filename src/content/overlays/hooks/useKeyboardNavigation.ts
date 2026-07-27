import { useEffect } from 'react'

interface KeyboardNavigationOptions {
  isActive: boolean
  /** Which arrow pair moves the selection. */
  axis: 'vertical' | 'horizontal'
  onSelect: () => void
  onClose: () => void
  onNavigatePrev: () => void
  onNavigateNext: () => void
  /** Tab: 'cycle' advances the selection (Shift reverses); a callback runs instead; omitted leaves Tab native. */
  onTab?: 'cycle' | (() => void)
}

export function useKeyboardNavigation({
  isActive,
  axis,
  onSelect,
  onClose,
  onNavigatePrev,
  onNavigateNext,
  onTab,
}: KeyboardNavigationOptions) {
  useEffect(() => {
    if (!isActive) return

    const [prevKey, nextKey] = axis === 'vertical' ? ['ArrowUp', 'ArrowDown'] : ['ArrowLeft', 'ArrowRight']

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          e.preventDefault()
          onClose()
          break
        case nextKey:
          e.preventDefault()
          onNavigateNext()
          break
        case prevKey:
          e.preventDefault()
          onNavigatePrev()
          break
        case 'Enter':
          e.preventDefault()
          onSelect()
          break
        case 'Tab':
          if (onTab === 'cycle') {
            e.preventDefault();
            (e.shiftKey ? onNavigatePrev : onNavigateNext)()
          } else if (onTab) {
            e.preventDefault()
            onTab()
          }
          break
      }
    }

    // Listen on the main document only. On Google Docs, showAll mode steals focus
    // from the iframe to a guard element in the main document, so events arrive
    // here naturally and never reach Google Docs' iframe handlers.
    document.addEventListener('keydown', handleKeyDown, true)
    return () => document.removeEventListener('keydown', handleKeyDown, true)
  }, [isActive, axis, onSelect, onClose, onNavigatePrev, onNavigateNext, onTab])
}
