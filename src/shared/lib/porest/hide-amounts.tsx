import { Activity, useEffect, useState, type ReactNode } from 'react'
import { isEn } from '@/shared/lib/porest/format'

export const HIDE_AMOUNTS_MASK = '••••••'

/**
 * 통화 접두 기호 — 마스킹 금액의 `<MaskAmount>` 안, 숫자(부호 뒤) 바로 앞에 삽입.
 * ko: '' (단위는 접미사 `원`이 `<WonUnit/>` 로 렌더) / en: '₩' (접두사).
 * 예 ko `<MaskAmount>{wonPre()}{KRW(x)}</MaskAmount><WonUnit/>` → "10,000원"
 *    en 동일 코드 → "₩10,000"
 */
export const wonPre = (): string => (isEn() ? '₩' : '')

/**
 * 통화 접미 단위 — 기존 `<HideUnit>원</HideUnit>` 대체.
 * ko: `원`(마스킹 시 숨김, 기존 동일) / en: 없음(접두 ₩ 로 대체됨).
 */
export function WonUnit() {
  return <HideUnit>{isEn() ? '' : '원'}</HideUnit>
}

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
