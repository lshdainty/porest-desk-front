import { Activity, useEffect, useState, type ReactNode } from 'react'

export const HIDE_AMOUNTS_MASK = '••••••'

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

export function MaskAmount({
  children,
  mask = HIDE_AMOUNTS_MASK,
}: {
  children: ReactNode
  mask?: ReactNode
}) {
  const hidden = useHideAmounts()
  return (
    <>
      <Activity mode={hidden ? 'hidden' : 'visible'}>{children}</Activity>
      <Activity mode={hidden ? 'visible' : 'hidden'}>{mask}</Activity>
    </>
  )
}

export function HideUnit({ children }: { children: ReactNode }) {
  const hidden = useHideAmounts()
  return <Activity mode={hidden ? 'hidden' : 'visible'}>{children}</Activity>
}
