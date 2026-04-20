import { useEffect, useState } from 'react'

declare global {
  interface Window { __pdHideAmounts?: boolean }
}

export function useHideAmounts(): boolean {
  const [hidden, setHidden] = useState(!!window.__pdHideAmounts)
  useEffect(() => {
    const onChange = (e: Event) => setHidden(!!(e as CustomEvent).detail)
    window.addEventListener('pd-hide-amounts', onChange)
    return () => window.removeEventListener('pd-hide-amounts', onChange)
  }, [])
  return hidden
}

export function togglePdHideAmounts() {
  window.__pdHideAmounts = !window.__pdHideAmounts
  window.dispatchEvent(new CustomEvent('pd-hide-amounts', { detail: window.__pdHideAmounts }))
}
