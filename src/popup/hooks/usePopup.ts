import { useState, useEffect } from 'react'

export function usePopup() {
  const [pending, setPending] = useState(0)

  useEffect(() => {
    const handler = (msg: any) => {
      if (msg?.type === 'pendingCount') {
        setPending(msg.count)
      }
      // 'macros-updated' is handled by the store subscription, so no action is needed here.
    }

    chrome.runtime.onMessage.addListener(handler)

    return () => {
      chrome.runtime.onMessage.removeListener(handler)
    }
  }, [])

  return { pending }
}