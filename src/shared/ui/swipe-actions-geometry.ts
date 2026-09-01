/*
 * SwipeActions 기하·판정 — porest-design specs/components/swipe-actions.md SoT.
 *
 * 컴포넌트 파일에서 분리한 이유 둘.
 * 1. `react-refresh/only-export-components` — 컴포넌트 .tsx 에서 상수·함수를 export 하면
 *    lint 에러가 는다(button-variants.ts 가 같은 이유로 분리돼 있다).
 * 2. 이 레포에는 테스트 러너가 없다. 순수 함수로 빼 두면 `node --experimental-strip-types`
 *    로 수치를 직접 확인할 수 있다 — 제스처는 못 돌려 봐도 기하는 돌려 볼 수 있다.
 */

/** 원형 배지 지름. 행 높이 안에 배지 + 라벨이 함께 들어가는 최대치(spec Sizes). */
export const SWIPE_BADGE_SIZE = 36;

/** 배지 안 아이콘. */
export const SWIPE_ICON_SIZE = 18;

/** 행 내용과 첫 액션 사이. 바짝 붙으면 배지가 행에 얹힌 것처럼 보인다. */
export const SWIPE_GAP_LEAD = 20;

/** 액션끼리 사이(= --spacing-md). 배지 둘이 붙으면 하나의 알약처럼 뭉쳐 보인다. */
export const SWIPE_GAP_BETWEEN = 12;

/** 배지와 라벨 사이. */
export const SWIPE_LABEL_GAP = 2;

/** 슬롯 최소 높이 — WCAG 2.5.5(AAA, 44×44)를 밑돌지 않게. */
export const SWIPE_MIN_HEIGHT = 56;

/** 닫힌 상태에서 이 비율 이상 밀면 열린 채로 스냅한다(spec Behavior). */
export const SWIPE_OPEN_THRESHOLD = 0.4;

/**
 * 열린 상태에서 **되돌려 민** 거리가 이 비율 이상이면 닫는다.
 *
 * spec Behavior '열린 상태에서 되돌려 밀기' 가 여는 임계(0.4)를 닫는 쪽에 그대로 걸지
 * 말라고 명시한다 — 두 범위가 맞물려 아예 열리지 않는다. 값은 구현체 위임.
 */
export const SWIPE_CLOSE_THRESHOLD = 0.25;

/** 이보다 짧은 이동은 탭으로 본다 — 축을 판정하지 않는다(spec 제스처 판정). */
export const SWIPE_DEAD_ZONE = 8;

/** 가로로 확정하는 기울기. 45°(1배)면 세로로 훑는 중 스크롤이 끊긴다. */
export const SWIPE_AXIS_RATIO = 1.5;

/**
 * 액션 하나가 차지하는 폭 — 배지 + 그 **앞** 간격.
 *
 * 간격을 앞에만 둔다. 뒤에도 두면 마지막 배지와 트레이 끝이 벌어져 덜 열린 것처럼 보인다.
 */
export const swipeSlotWidth = (index: number) =>
  SWIPE_BADGE_SIZE + (index === 0 ? SWIPE_GAP_LEAD : SWIPE_GAP_BETWEEN);

/** 트레이 전체 폭 — 1개 56 / 2개 104 / 3개 152. */
export const swipeTrayWidth = (count: number) =>
  Array.from({ length: count }, (_, i) => swipeSlotWidth(i)).reduce(
    (a, b) => a + b,
    0,
  );

export type SwipeAxis = "none" | "x" | "y";

/**
 * 데드존을 넘은 뒤 어느 축의 제스처인지 확정한다.
 *
 * 세로로 확정되면 그 제스처는 끝까지 세로다 — 판정이 도중에 바뀌면 행이 스크롤 중에 흔들린다.
 */
export const resolveAxis = (dx: number, dy: number): SwipeAxis => {
  if (Math.hypot(dx, dy) < SWIPE_DEAD_ZONE) return "none";
  return Math.abs(dx) > Math.abs(dy) * SWIPE_AXIS_RATIO ? "x" : "y";
};

/**
 * 드래그 거리(트레이가 드러나는 쪽이 양수) → 실제 오프셋.
 *
 * 트레이 폭에서 하드 스톱한다. 끝까지 밀어도 액션이 실행되지 않으므로 그 너머로 더 가는
 * 이동에는 의미가 없고, 저항을 주면 "더 밀면 뭔가 있다" 는 잘못된 기대만 만든다.
 */
export const clampOffset = (dragged: number, tray: number) =>
  Math.max(0, Math.min(dragged, tray));

/** 닫힌 상태에서 손을 뗐을 때 열 것인가. */
export const shouldSnapOpen = (offset: number, tray: number) =>
  offset >= tray * SWIPE_OPEN_THRESHOLD;

/** 열린 상태에서 손을 뗐을 때 닫을 것인가 — 여는 임계와 **다른 값**을 쓴다. */
export const shouldSnapClose = (offset: number, tray: number) =>
  tray - offset >= tray * SWIPE_CLOSE_THRESHOLD;
