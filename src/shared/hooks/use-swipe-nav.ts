import * as React from 'react'
import { resolveAxis, type SwipeAxis } from '@/shared/ui/swipe-actions-geometry'

/*
 * 좌우로 밀어서 이전/다음으로 넘기는 제스처 — 탭 전환용.
 *
 * 축 판정은 SwipeActions 와 같은 규약을 쓴다(`resolveAxis`: 데드존 8, 가로 확정 기울기 1.5).
 * 판정을 따로 두면 같은 화면에서 행 스와이프와 탭 스와이프가 서로 다른 각도에서 걸려
 * 사용자는 "될 때도 있고 안 될 때도 있다" 로 느낀다.
 *
 * 세로로 확정되면 그 제스처는 끝까지 세로다 — 통계 본문은 세로 스크롤이 주된 동작이라
 * 도중에 가로로 바뀌면 스크롤이 끊긴다.
 */

/** 넘김을 확정하는 가로 이동 — 컨테이너 폭 대비 비율. */
export const SWIPE_NAV_COMMIT_RATIO = 0.2

/**
 * 비율만 쓰면 좁은 화면에서 너무 쉽게 넘어간다(390px 의 20% = 78px 이지만
 * 더 좁은 기기·분할 화면에선 40px 대까지 내려간다). 최소 이동을 함께 건다.
 */
export const SWIPE_NAV_MIN_DISTANCE = 56

/** 손을 뗐을 때 넘길 것인가. */
export const shouldCommitSwipeNav = (dx: number, width: number) =>
  Math.abs(dx) >= Math.max(SWIPE_NAV_MIN_DISTANCE, width * SWIPE_NAV_COMMIT_RATIO)

interface Options {
  /** 오른쪽으로 밀었을 때(= 이전으로). 없으면 그 방향은 무시. */
  onPrev?: () => void
  /** 왼쪽으로 밀었을 때(= 다음으로). 없으면 그 방향은 무시. */
  onNext?: () => void
  /** false 면 핸들러가 아무것도 하지 않는다(데스크톱 등). */
  enabled?: boolean
}

/**
 * `handlers` 와 `style` 을 돌려준다. **둘 다 붙여야 동작한다.**
 *
 * ```tsx
 * const swipe = useSwipeNav({ onPrev, onNext })
 * <div style={{ padding: 20, ...swipe.style }} {...swipe.handlers}>
 * ```
 *
 * `style` 을 따로 돌려주는 이유 — `touch-action: pan-y` 가 없으면 **아무 일도 안 일어난다.**
 * 기본값 `auto` 에서는 브라우저가 가로 팬을 스크롤로 가져가고, 그 순간 포인터 스트림에
 * `pointercancel` 이 날아와 pointerup 이 오지 않는다(첫 구현이 이래서 조용히 안 먹었다).
 * `pan-y` 는 세로 스크롤은 브라우저에 맡기고 가로만 앱이 가져간다.
 * 핸들러에 묻어 들어가면 사용처의 style 을 덮어쓰므로 갈라서 돌려준다.
 *
 * 가로로 확정된 뒤에도 preventDefault 는 하지 않는다: 통계 본문에는 가로로 스크롤될
 * 요소가 없고, 막으면 포인터 캡처가 걸린 자식(차트 툴팁 등)의 이벤트까지 죽는다.
 */
export function useSwipeNav({ onPrev, onNext, enabled = true }: Options) {
  const start = React.useRef<{ x: number; y: number; w: number } | null>(null)
  const axis = React.useRef<SwipeAxis>('none')

  const onPointerDown = (e: React.PointerEvent<HTMLElement>) => {
    if (!enabled || e.pointerType === 'mouse') return
    start.current = {
      x: e.clientX,
      y: e.clientY,
      w: e.currentTarget.clientWidth,
    }
    axis.current = 'none'
  }

  const onPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const s = start.current
    if (!s || axis.current !== 'none') return
    axis.current = resolveAxis(e.clientX - s.x, e.clientY - s.y)
  }

  const finish = (e: React.PointerEvent<HTMLElement>) => {
    const s = start.current
    start.current = null
    if (!s || axis.current !== 'x') return
    const dx = e.clientX - s.x
    if (!shouldCommitSwipeNav(dx, s.w)) return
    if (dx < 0) onNext?.()
    else onPrev?.()
  }

  const cancel = () => {
    start.current = null
    axis.current = 'none'
  }

  return {
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: finish,
      onPointerCancel: cancel,
    },
    // 세로 스크롤은 브라우저, 가로는 우리 — 이게 없으면 pointercancel 로 끊긴다.
    style: { touchAction: 'pan-y' } as const,
  }
}
