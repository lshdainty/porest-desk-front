import { Activity, type ReactNode } from 'react'
import { isEn } from '@/shared/lib/porest/format'
import { HIDE_AMOUNTS_MASK, useHideAmounts } from '@/shared/lib/porest/hide-amounts-core'

/**
 * 통화 접미 단위 — 기존 `<HideUnit>원</HideUnit>` 대체.
 * ko: `원`(마스킹 시 숨김, 기존 동일) / en: 없음(접두 ₩ 로 대체됨).
 */
export function WonUnit() {
  return <HideUnit>{isEn() ? '' : '원'}</HideUnit>
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
