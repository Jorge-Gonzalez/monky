// Whether the primary pointer is a finger rather than a mouse. Selection needs to know:
// without modifier keys an unmodified tap has to toggle, or a second tap would throw the
// first selection away and multi-select would be unreachable. See `selectionIntent`.
import { useEffect, useState } from 'react'

const QUERY = '(pointer: coarse)'

const read = () =>
  typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(QUERY).matches : false

export function useCoarsePointer(): boolean {
  const [coarse, setCoarse] = useState(read)

  // A tablet with a keyboard attached, or a detached one, changes this mid-session.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia(QUERY)
    const onChange = () => setCoarse(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return coarse
}
