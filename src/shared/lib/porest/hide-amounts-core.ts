import { useEffect, useState } from 'react'
import { isEn } from '@/shared/lib/porest/format'
import {
  ALL_HIDE_CARDS,
  cardsOfKind,
  cardsOfPage,
  SCREEN_HIDE_CARDS,
  type HideCardKey,
  type HideKind,
  type HidePageKey,
} from '@/shared/lib/porest/hide-amounts-cards'

/*
 * hide-amounts 코어(상수/훅/토글 함수) — hide-amounts.tsx 에서 분리
 * (Fast Refresh: 컴포넌트 파일은 컴포넌트만 export).
 *
 * 가리는 단위는 카드다. 어떤 카드가 있는지는 hide-amounts-cards.ts 에 있다.
 */

export const HIDE_AMOUNTS_MASK = '••••••'

/**
 * 통화 접두 기호 — 마스킹 금액의 `<MaskAmount>` 안, 숫자(부호 뒤) 바로 앞에 삽입.
 * ko: '' (단위는 접미사 `원`이 `<WonUnit/>` 로 렌더) / en: '₩' (접두사).
 */
export const wonPre = (): string => (isEn() ? '₩' : '')

/** 예전 단일 스위치. 값이 있으면 한 번 읽어 카드 전체로 펼치고 지운다. */
const LEGACY_KEY = 'pd-hide'
const STORAGE_KEY = 'pd-hide-cards'
const EVENT = 'pd-hide-amounts'

declare global {
  interface Window { __pdHideCards?: Set<HideCardKey> }
}

function load(): Set<HideCardKey> {
  const valid = new Set<string>(ALL_HIDE_CARDS)
  try {
    // 예전 사용자는 "전부 가림" 상태였다 — 켜져 있었으면 그대로 전부 켠 채로 옮긴다.
    // 안 그러면 업데이트하자마자 금액이 통째로 드러난다.
    const legacy = localStorage.getItem(LEGACY_KEY)
    if (legacy != null) {
      localStorage.removeItem(LEGACY_KEY)
      const on = legacy === 'true' || legacy === '1'
      const migrated = on ? new Set(ALL_HIDE_CARDS) : new Set<HideCardKey>()
      save(migrated)
      return migrated
    }
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return new Set()
    // 새로 생긴 카드(거래 종류 3장)는 저장 배열에 없으므로 자동으로 꺼진 채 시작한다.
    // 켜 주지 않는다 — 사용자가 고른 적 없는 카드를 대신 켜는 셈이고, 화면 카드가 이미
    // 그 자리를 덮고 있어 새는 것도 없다. 필터는 **버리는 방향**이라 기존 설정도 안전하다.
    //
    // 없어진 카드 키는 버린다 — 남겨 두면 영영 못 지우는 유령이 된다.
    return new Set(parsed.filter((k): k is HideCardKey => typeof k === 'string' && valid.has(k)))
  } catch {
    // 사파리 프라이빗 모드 등 localStorage 가 막힌 환경 — 이번 세션만 유지된다.
    return new Set()
  }
}

function save(next: Set<HideCardKey>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]))
  } catch {
    /* 저장 못 해도 화면은 돌아야 한다 */
  }
}

function current(): Set<HideCardKey> {
  if (!window.__pdHideCards) window.__pdHideCards = load()
  return window.__pdHideCards
}

function commit(next: Set<HideCardKey>) {
  window.__pdHideCards = next
  save(next)
  window.dispatchEvent(new CustomEvent(EVENT, { detail: next }))
}

/**
 * 이 카드(들)가 가려져 있는가.
 *
 * <p>카드를 여러 개 넘기면 <b>하나라도 켜져 있으면</b> 가린다. 같은 금액이 두 카드에
 * 걸치는 자리가 있다 — 캘린더 셀은 '캘린더 금액' 이면서 '거래 목록' 의 일별 합계이기도
 * 하다. 한쪽으로 몰아 두면 다른 쪽을 켠 사람에게는 안 가려진다.
 *
 * <p>카드를 지정하지 않으면 <b>하나라도 가려져 있는지</b>를 돌려준다 — 눈 아이콘처럼
 * "지금 뭔가 가려진 상태인가" 만 알면 되는 자리용이다. 실제 금액을 가리는 곳은
 * 반드시 카드를 넘길 것. 안 넘기면 다른 카드를 가렸을 때 같이 가려진다.
 */
export function useHideAmounts(
  card?: HideCardKey | HideCardKey[],
  kind?: HideKind,
): boolean {
  // 배열 리터럴을 그대로 넘기는 호출부가 많다 — 매 렌더 새 배열이라 deps 로 못 쓴다.
  const key = `${Array.isArray(card) ? card.join('|') : card ?? ''}#${kind ?? ''}`
  const read = () => {
    const set = current()
    // 화면 카드와 종류 카드는 합집합이다 — 카드는 "가리기" 스위치라, 켰는데 아무 일도
    // 안 일어나는 조합이 있으면 안 된다. 켜는 방향으로만 넓어지므로 이미 가려진 게
    // 풀리는 경우도 생기지 않는다.
    if (kind && cardsOfKind(kind).some(c => set.has(c))) return true
    if (Array.isArray(card)) return card.some(c => set.has(c))
    if (card) return set.has(card)
    // 카드도 종류도 없는 자리는 "하나라도 가려졌나" — 눈 아이콘용이다.
    // **종류 카드는 세지 않는다.** 세면 지출만 가린 사용자에게 예산·더치페이의 '원'
    // 단위(카드 없이 부르는 자리들)까지 사라진다 — 종류 카드가 안 덮기로 한 화면이다.
    if (kind) return false
    return SCREEN_HIDE_CARDS.some(c => set.has(c))
  }
  const [hidden, setHidden] = useState(read)
  useEffect(() => {
    const onChange = () => setHidden(read())
    window.addEventListener(EVENT, onChange)
    // 훅이 마운트되는 사이 값이 바뀌었을 수 있다.
    onChange()
    return () => window.removeEventListener(EVENT, onChange)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  return hidden
}

/** 페이지 단위 상태 — 전부/일부/없음. 설정 화면의 '페이지 잠그기' 스위치용. */
export function useHidePageState(page: HidePageKey): 'all' | 'some' | 'none' {
  const [, setTick] = useState(0)
  useEffect(() => {
    const onChange = () => setTick(t => t + 1)
    window.addEventListener(EVENT, onChange)
    return () => window.removeEventListener(EVENT, onChange)
  }, [])
  const cards = cardsOfPage(page)
  const on = cards.filter(c => current().has(c)).length
  return on === 0 ? 'none' : on === cards.length ? 'all' : 'some'
}

/** 지금 가려진 카드들 — 설정 화면이 목록을 그릴 때 쓴다. */
export function useHiddenCards(): Set<HideCardKey> {
  const [set, setSet] = useState<Set<HideCardKey>>(() => new Set(current()))
  useEffect(() => {
    const onChange = () => setSet(new Set(current()))
    window.addEventListener(EVENT, onChange)
    onChange()
    return () => window.removeEventListener(EVENT, onChange)
  }, [])
  return set
}

/**
 * 가려진 카드 전체를 이 목록으로 교체 — 설정 화면이 [저장] 으로 한 번에 반영할 때.
 *
 * <p>지금 가려진 것 중 빠지는 카드는 곧 '푸는' 것이다 — 호출 전에 인증을 거칠 것(UI 책임).
 */
export function setHiddenCards(cards: Iterable<HideCardKey>) {
  commit(new Set(cards))
}

export function hideAllCards() {
  setHiddenCards(ALL_HIDE_CARDS)
}

export function revealAllCards() {
  commit(new Set())
}

export function isCardHidden(card: HideCardKey): boolean {
  return current().has(card)
}

export function hiddenCardsNow(): Set<HideCardKey> {
  return new Set(current())
}
