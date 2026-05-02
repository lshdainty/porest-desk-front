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

function setPdHideAmounts(next: boolean) {
  window.__pdHideAmounts = next
  window.dispatchEvent(new CustomEvent('pd-hide-amounts', { detail: next }))
}

export function enablePdHideAmounts() {
  setPdHideAmounts(true)
}

export function disablePdHideAmounts() {
  setPdHideAmounts(false)
}

/**
 * 토글 (인증 우회). hide 켜기는 자유, 해제는 비밀번호 인증을 원하면
 * UI 측에서 useHideAmountsUnlock hook 으로 분기 호출할 것.
 */
export function togglePdHideAmounts() {
  setPdHideAmounts(!window.__pdHideAmounts)
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
