import { useEffect, useState } from 'react'
import { isEn } from '@/shared/lib/porest/format'

/*
 * hide-amounts 코어(상수/훅/토글 함수) — hide-amounts.tsx 에서 분리
 * (Fast Refresh: 컴포넌트 파일은 컴포넌트만 export).
 */

export const HIDE_AMOUNTS_MASK = '\u2022\u2022\u2022\u2022\u2022\u2022'

/**
 * 통화 접두 기호 — 마스킹 금액의 `<MaskAmount>` 안, 숫자(부호 뒤) 바로 앞에 삽입.
 * ko: '' (단위는 접미사 `원`이 `<WonUnit/>` 로 렌더) / en: '₩' (접두사).
 */
export const wonPre = (): string => (isEn() ? '₩' : '')

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
