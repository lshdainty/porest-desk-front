import { cva } from "class-variance-authority";

/*
 * Porest Swipe Actions 의 모양 · 판정 — 수치 원본은 porest-design specs/components/swipe-actions.yaml
 * (값은 src/shared/ds/spec/swipe-actions.json). porest-design recipes/shadcn/components/ui/swipe-actions.tsx 를 첫 판으로
 * 가져왔다 — 이 파일은 모양 · 판정 정의, 컴포넌트는 swipe-actions.tsx 다(컴포넌트 파일은 컴포넌트만 내보낸다 — 빠른 새로 고침).
 */

/** 원형 배지 지름(px). 줄 높이 안에 배지 + 라벨이 함께 들어가는 최대치 — 40 은 라벨과 합쳐 넘친다. */
export const SWIPE_BADGE_SIZE = 36;

/** 줄 내용과 첫 동작 사이. 바짝 붙으면 배지가 줄에 얹힌 것처럼 보인다. */
export const SWIPE_GAP_LEAD = 20;

/** 동작끼리 사이. 배지 둘이 붙으면 하나의 알약처럼 뭉쳐 보인다. */
export const SWIPE_GAP_BETWEEN = 12;

/** 칸 최소 높이 — 줄이 56 보다 낮으면 56. */
export const SWIPE_MIN_HEIGHT = 56;

/** 동작은 하나에서 셋까지 — 넷부터는 트레이가 줄 폭을 먹어 무엇을 미는지 안 보인다. */
export const SWIPE_MAX_ACTIONS = 3;

/** 닫힌 상태에서 트레이 폭의 이 비율 이상 밀고 놓으면 열린 채로 자리를 잡는다. */
export const SWIPE_OPEN_THRESHOLD = 0.4;

/** 열린 상태에서 되돌려 민 거리가 트레이 폭의 이 비율 이상이면 닫는다. 여는 문턱(0.4)을 같이 걸면 두 범위가 맞물려 아예 열리지 않는다. */
export const SWIPE_CLOSE_THRESHOLD = 0.25;

/** 이보다 짧은 이동은 누르기로 본다 — 축을 판정하지 않는다(px). */
export const SWIPE_DEAD_ZONE = 8;

/** 가로로 확정하는 기울기 — abs(dx) > abs(dy) × 1.5(≈ 33.7° 이내). 45° 면 세로로 훑는 중 스크롤이 끊긴다. */
export const SWIPE_AXIS_RATIO = 1.5;

/**
 * 동작 하나가 차지하는 폭 — 배지 + 그 앞 간격(첫 칸 56 · 다음부터 48).
 * 간격은 앞에만 둔다. 뒤에도 두면 마지막 배지와 화면 끝이 벌어져 덜 열린 것처럼 보인다.
 */
export const swipeSlotWidth = (index: number) =>
  SWIPE_BADGE_SIZE + (index === 0 ? SWIPE_GAP_LEAD : SWIPE_GAP_BETWEEN);

/** 트레이 전체 폭 — 하나 56 · 둘 104 · 셋 152. */
export const swipeTrayWidth = (count: number) =>
  Array.from({ length: count }, (_, i) => swipeSlotWidth(i)).reduce(
    (a, b) => a + b,
    0,
  );

export type SwipeAxis = "none" | "x" | "y";

/** 데드존을 넘은 뒤 어느 축의 제스처인지 확정한다. */
export const resolveAxis = (dx: number, dy: number): SwipeAxis => {
  if (Math.hypot(dx, dy) < SWIPE_DEAD_ZONE) return "none";
  return Math.abs(dx) > Math.abs(dy) * SWIPE_AXIS_RATIO ? "x" : "y";
};

/** 트레이 폭에서 멈춘다. 반대 방향으로 밀면 0 에 머문다. */
export const clampOffset = (dragged: number, tray: number) =>
  Math.max(0, Math.min(dragged, tray));

/**
 * 놓았을 때 열린 채로 둘지 — 닫혀 있던 줄은 트레이 폭의 40% 이상 밀었으면 열고,
 * 열려 있던 줄은 되돌려 민 거리가 25% 미만이면 열린 채로 둔다.
 */
export const settleOpen = (
  wasOpen: boolean,
  offset: number,
  tray: number,
): boolean =>
  wasOpen
    ? tray - offset < tray * SWIPE_CLOSE_THRESHOLD
    : offset >= tray * SWIPE_OPEN_THRESHOLD;

// 칸(버튼) — 라벨 색 · 글자 · 밝기 · 링. 호버(웹)는 누름과 같다 — 밝기 88% 만, 움직이지 않는다(밀어 둔 트레이와 이중으로 움직이면 어지럽다).
// 막히면 라벨 fg-disabled · 밝기 그대로. 라벨 12 / 700 / 1.3(크기만 t2 — 폭 48 이라 기본 줄 높이면 두 줄에서 넘친다).
export const swipeActionVariants = cva(
  [
    "flex shrink-0 cursor-pointer flex-col items-center justify-center gap-x0_5 self-stretch border-0 bg-transparent font-sans",
    "min-h-14 text-t2 font-bold leading-[1.3]",
    "[transition:filter_var(--motion-duration-color-transition)_var(--motion-ease-easing)]",
    "hover:brightness-[0.88] active:brightness-[0.88]",
    "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-stroke-focus-ring",
    "disabled:cursor-not-allowed disabled:text-fg-disabled disabled:hover:brightness-100 disabled:active:brightness-100",
  ].join(" "),
  {
    variants: {
      // 주 동작도 라벨은 회색 — 색은 배지가 말한다. 위험 라벨만 fg-critical(라이트 · 다크 한 토큰)
      kind: {
        neutral: "text-fg-neutral-muted",
        primary: "text-fg-neutral-muted",
        destructive: "text-fg-critical",
      },
    },
    defaultVariants: { kind: "neutral" },
  },
);

// 원형 배지 — 색은 여기만(트레이는 칠하지 않는다). primary · destructive 는 그 동작의 글자색 + 반전 아이콘(두 모드 모두 줄 바탕과 3:1 이상),
// neutral 은 옅은 바탕 + 안쪽 1px 테두리, 막힌 칸(disabled)은 전용 색 — 흐리게 하지 않는다. 아이콘 18(size-4.5).
// kind × disabled — 막히면 바탕 · 아이콘만 전용 색으로 바뀌고 neutral 의 안쪽 1px stroke-neutral-weak 은 남는다(v106, Q-012-4)
export const swipeBadgeVariants = cva(
  "flex shrink-0 items-center justify-center rounded-full [&>svg]:size-4.5",
  {
    variants: {
      kind: {
        neutral: "shadow-[inset_0_0_0_1px_var(--color-stroke-neutral-weak)]",
        primary: "",
        destructive: "",
      },
      disabled: { true: "bg-bg-disabled text-fg-disabled", false: "" },
    },
    compoundVariants: [
      {
        kind: "neutral",
        disabled: false,
        className: "bg-bg-neutral-weak text-fg-neutral",
      },
      {
        kind: "primary",
        disabled: false,
        className: "bg-fg-informative text-fg-neutral-inverted",
      },
      {
        kind: "destructive",
        disabled: false,
        className: "bg-fg-critical text-fg-neutral-inverted",
      },
    ],
    defaultVariants: { kind: "neutral", disabled: false },
  },
);
