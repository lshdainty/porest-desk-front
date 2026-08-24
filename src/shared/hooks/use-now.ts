import { useCallback, useSyncExternalStore } from 'react'

/** 상대시각 기본 해상도 — "n분 전" 이 최소 단위라 1분마다만 다시 그리면 충분하다. */
const DEFAULT_INTERVAL_MS = 60_000

/**
 * 벽시계 눈금으로 내림한 '지금'.
 *
 * 인스턴스가 언제 마운트됐든 같은 눈금 안이면 같은 숫자가 나오게 만드는 장치다.
 * `Date.now()` 를 그대로 쓰면 값이 마운트 위상에 묶여, 벨과 알림 페이지가 45초 어긋나
 * 뜬 것만으로 같은 알림이 "59분 전" 과 "1시간 전" 으로 갈린다.
 */
const alignedNow = (intervalMs: number): number =>
  Math.floor(Date.now() / intervalMs) * intervalMs

type Clock = {
  value: number
  timer: ReturnType<typeof setInterval> | null
  onVisibility: (() => void) | null
  listeners: Set<() => void>
}

/**
 * 해상도별 시계 한 개. **모듈 스코프**라 같은 [intervalMs] 를 쓰는 호출부는 하나를 나눠 쓴다.
 *
 * 훅 안에 `useState` + `setInterval` 을 두면 호출부마다 타이머가 따로 돌아 "같은 기준을
 * 본다" 가 성립하지 않는다. 정렬만으로도 대부분 같은 값이 나오지만, 두 타이머가 눈금
 * 경계를 사이에 두고 엇갈려 발화하면 그 틈(최대 샘플링 주기)만큼은 여전히 갈린다.
 * 그래서 값을 한 곳에 두고 구독자 전체를 같은 커밋에서 깨운다.
 */
const clocks = new Map<number, Clock>()

const getClock = (intervalMs: number): Clock => {
  const found = clocks.get(intervalMs)
  if (found) return found
  const created: Clock = { value: alignedNow(intervalMs), timer: null, onVisibility: null, listeners: new Set() }
  clocks.set(intervalMs, created)
  return created
}

/** 눈금이 실제로 넘어갔을 때만 구독자를 깨운다 — 헛틱은 리렌더를 만들지 않는다. */
const tick = (clock: Clock, intervalMs: number): void => {
  const next = alignedNow(intervalMs)
  if (next === clock.value) return
  clock.value = next
  clock.listeners.forEach(l => l())
}

const subscribe = (intervalMs: number, onChange: () => void): (() => void) => {
  const clock = getClock(intervalMs)
  clock.listeners.add(onChange)
  if (clock.timer === null) {
    // 구독자가 0 이던 동안 타이머가 멎어 값이 굳어 있다 — 켜면서 먼저 맞춘다.
    tick(clock, intervalMs)
    // 인터벌은 눈금 경계에 맞춰 발화하지 않으므로(구독 시점부터 센다) 해상도의 절반으로
    // 샘플링해, 눈금이 넘어간 걸 늦게 알아채는 폭을 줄인다.
    clock.timer = setInterval(() => { tick(clock, intervalMs) }, Math.max(1, Math.floor(intervalMs / 2)))
    // 탭이 백그라운드면 브라우저가 타이머를 늦춘다 — 돌아오는 순간 한 번 더 맞춘다.
    clock.onVisibility = () => {
      if (document.visibilityState === 'visible') tick(clock, intervalMs)
    }
    document.addEventListener('visibilitychange', clock.onVisibility)
  }
  return () => {
    clock.listeners.delete(onChange)
    if (clock.listeners.size > 0 || clock.timer === null) return
    clearInterval(clock.timer)
    clock.timer = null
    if (clock.onVisibility) document.removeEventListener('visibilitychange', clock.onVisibility)
    clock.onVisibility = null
  }
}

/**
 * 흐르는 "지금" — [intervalMs] 눈금으로 정렬된 현재 시각(ms).
 *
 * <p>상대시각("3분 전")을 그리는 화면에는 기준점이 필요한데, 렌더 중에 `Date.now()` 를
 * 부르면 같은 입력이 렌더마다 다른 값을 내 순수하지 않다(react-hooks/purity).
 * 그렇다고 react-query 의 `dataUpdatedAt` 으로 대신하면 시계가 **목록을 받아 온 순간**에
 * 멈춘다 — 알림 벨은 영구 레이아웃에 붙어 언마운트되지 않고 `refetchInterval` 도 없어,
 * 포커스 복귀·SSE·읽음 처리가 없으면 그 값이 몇 시간이고 그대로다. 10:00 에 온 알림이
 * 12:00 에 벨을 열어도 "방금" 으로 보인다.
 *
 * <p>그래서 기준점 자체를 흘린다. 여러 화면이 **같은 기준**을 보는 근거는 두 겹이다 —
 * 값이 모듈 스코프 시계 하나에 있고([clocks]), 그 값이 벽시계 눈금으로 정렬돼 있다
 * ([alignedNow]). 훅을 공유한다는 사실만으로는 근거가 안 된다 — `useState` 와
 * `setInterval` 은 호출부마다 독립이라, 예전 구현에서는 벨과 알림 페이지가 마운트
 * 시점 차이만큼 최대 [intervalMs] 어긋난 값을 봤다(실제로 그랬다).
 */
export function useNow(intervalMs: number = DEFAULT_INTERVAL_MS): number {
  // 구독 함수의 정체성이 렌더마다 바뀌면 React 가 매 렌더 재구독한다 — 타이머가 꺼졌다
  // 켜지기를 반복하므로 [intervalMs] 에만 묶는다.
  const subscribeToClock = useCallback(
    (onChange: () => void) => subscribe(intervalMs, onChange),
    [intervalMs],
  )
  const getSnapshot = useCallback(() => getClock(intervalMs).value, [intervalMs])
  return useSyncExternalStore(subscribeToClock, getSnapshot)
}
