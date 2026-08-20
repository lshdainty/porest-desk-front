import { Activity, createContext, useContext, type ReactNode } from 'react'
import { isEn } from '@/shared/lib/porest/format'
import { HIDE_AMOUNTS_MASK, useHideAmounts } from '@/shared/lib/porest/hide-amounts-core'
import type { HideCardKey } from '@/shared/lib/porest/hide-amounts-cards'

/**
 * 이 아래 금액들이 어느 카드에 속하는지.
 *
 * <p>카드 하나에 금액이 여러 개 박혀 있는 게 보통이라, 그때마다 `card=` 를 적으면
 * 빠뜨리기 쉽다. 카드 최상단에서 한 번 감싸면 안쪽 `<MaskAmount>` 가 전부 그 카드로
 * 잡힌다. 개별로 다르게 하고 싶을 때만 `card=` 로 덮어쓴다.
 */
const HideCardContext = createContext<HideCardKey | undefined>(undefined)

export function HideCard({ card, children }: { card: HideCardKey; children: ReactNode }) {
  return <HideCardContext.Provider value={card}>{children}</HideCardContext.Provider>
}

/** 감싸는 카드가 있으면 그것, 없으면 넘긴 값. 둘 다 없으면 undefined. */
export function useHideCard(
  card?: HideCardKey | HideCardKey[],
): HideCardKey | HideCardKey[] | undefined {
  const ctx = useContext(HideCardContext)
  return card ?? ctx
}

/**
 * 통화 접미 단위 — 기존 `<HideUnit>원</HideUnit>` 대체.
 * ko: `원`(마스킹 시 숨김, 기존 동일) / en: 없음(접두 ₩ 로 대체됨).
 */
export function WonUnit({ card }: { card?: HideCardKey | HideCardKey[] } = {}) {
  return <HideUnit card={card}>{isEn() ? '' : '원'}</HideUnit>
}

export function MaskAmount({
  children,
  mask = HIDE_AMOUNTS_MASK,
  card,
}: {
  children: ReactNode
  mask?: ReactNode
  card?: HideCardKey | HideCardKey[]
}) {
  const hidden = useHideAmounts(useHideCard(card))
  return (
    <>
      <Activity mode={hidden ? 'hidden' : 'visible'}>{children}</Activity>
      <Activity mode={hidden ? 'visible' : 'hidden'}>{mask}</Activity>
    </>
  )
}

export function HideUnit({
  children,
  card,
}: {
  children: ReactNode
  card?: HideCardKey | HideCardKey[]
}) {
  const hidden = useHideAmounts(useHideCard(card))
  return <Activity mode={hidden ? 'hidden' : 'visible'}>{children}</Activity>
}
