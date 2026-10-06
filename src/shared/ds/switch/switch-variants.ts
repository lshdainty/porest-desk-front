import { cva } from "class-variance-authority";

/*
 * Porest Switch — 구조는 SEED Switch(2026-09-30). 수치 원본은 porest-design
 * specs/components/switch.yaml(값은 src/shared/ds/spec/switch.json).
 * porest-design recipes/shadcn/components/ui/switch.tsx 를 첫 판으로 가져왔다(앱 적용 1A) — 이 파일은 변형 정의,
 * 컴포넌트는 switch.tsx 다(컴포넌트 파일은 컴포넌트만 내보낸다 — 빠른 새로 고침).
 *
 *   Switchmark  스위치만 — 설정 줄에 끼워 쓴다(누르는 영역은 그 줄 전체가 맡는다, 이름 연결 필수)
 *   Switch      스위치 + 라벨 — 라벨까지 눌리고, 누르는 영역은 44 까지 넓힌다(::before)
 *
 *   size  "16" 26 × 16(라벨 13) · "24" 38 × 24(라벨 14, 기본) · "32" 52 × 32(라벨 16) — 이름은 트랙 높이
 *   tone  neutral(짙은 회색, 기본) · brand(서비스 핵심 흐름에서만)
 *
 * 누르는 순간 적용되는 설정에만 쓴다 — 저장해야 적용되면 Checkbox(사용자 결정).
 * 끄면 엄지가 0.8 로 작아진다 — 색 말고도 자리 · 크기로 켬 · 끔이 갈린다(SEED). 그림자는 없다.
 * 꺼진 트랙은 stroke-neutral-solid(3:1 — v109). 누르면 색은 그대로, 스위치만 세로 2px 축소(v104) —
 * 기준 길이는 max(높이, 폭 ÷ 4, 24) 라 16 · 24 는 24, 32 는 32. 호버도 색이 바뀌지 않는다.
 * 비활성은 전용 색(v106) — 꺼진 채 막히면 옅은 트랙 + 안쪽 선 + 회색 엄지, 켜진 채 막히면 켜진 모양 그대로
 * 회색 채움 + 밝은 엄지(사용자 결정).
 * 라벨을 눌러도 스위치가 줄어들도록 Switch 는 group/switch, 스위치는 그 active 도 받는다.
 */
export const switchmarkVariants = cva(
  [
    "peer relative inline-flex shrink-0 cursor-pointer items-center rounded-full",
    "[transition:background-color_var(--motion-duration-d1)_var(--motion-ease-easing)_20ms,scale_var(--motion-duration-pressed-scale)_var(--motion-ease-pressed-scale)]",
    "active:[scale:calc(1-2/var(--press-basis))] group-active/switch:[scale:calc(1-2/var(--press-basis))] motion-reduce:active:[scale:1] motion-reduce:group-active/switch:[scale:1]",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focus-ring",
    "disabled:cursor-not-allowed disabled:[scale:1]",
    // 끔 — 꺼진 트랙. 켬은 톤에서 채운다
    "bg-stroke-neutral-solid",
    // 막힘 — 끔은 옅은 트랙 + 안쪽 선, 켬은 켜진 모양 그대로 회색 채움
    "disabled:bg-bg-disabled disabled:inset-ring disabled:inset-ring-stroke-neutral-weak",
    "data-[state=checked]:disabled:bg-fg-disabled data-[state=checked]:disabled:inset-ring-0",
  ].join(" "),
  {
    variants: {
      size: {
        "16": "h-4 w-[26px] p-0.5 [--press-basis:24]",
        "24": "h-6 w-[38px] p-0.5 [--press-basis:24]",
        "32": "h-8 w-[52px] p-[3px] [--press-basis:32]",
      },
      tone: {
        neutral: "data-[state=checked]:bg-bg-neutral-inverted",
        brand: "data-[state=checked]:bg-bg-brand-solid",
      },
    },
    defaultVariants: {
      size: "24",
      tone: "neutral",
    },
  },
);

// 엄지 — 끄면 0.8 · 자리 0, 켜면 오른쪽으로 가며 1. 색은 톤에서, 막히면 회색(끔) · 밝은 색(켬)
export const switchmarkThumbVariants = cva(
  [
    // 끔의 자리 0 을 적어 둔다(translate-x-0) — 스펙 translateX 0px, 계산된 값이 none 이 아니라 0px 로 읽힌다
    "pointer-events-none block translate-x-0 scale-[0.8] rounded-full",
    "[transition:translate_var(--motion-duration-d3)_var(--motion-ease-easing),scale_var(--motion-duration-d3)_var(--motion-ease-easing),background-color_var(--motion-duration-d1)_var(--motion-ease-easing)_20ms]",
    "data-[state=checked]:scale-100",
    "data-[disabled]:bg-fg-disabled data-[disabled]:data-[state=checked]:bg-bg-disabled",
  ].join(" "),
  {
    variants: {
      size: {
        "16": "size-3 data-[state=checked]:translate-x-[10px]",
        "24": "size-5 data-[state=checked]:translate-x-[14px]",
        "32": "size-[26px] data-[state=checked]:translate-x-5",
      },
      tone: {
        neutral: "bg-fg-neutral-inverted",
        brand: "bg-static-white",
      },
    },
    defaultVariants: {
      size: "24",
      tone: "neutral",
    },
  },
);

// 한 줄 — 스위치 + 라벨. 누르는 영역은 ::before 로 44 까지
export const switchVariants = cva(
  [
    "group/switch relative inline-flex cursor-pointer select-none items-center self-start",
    "before:absolute before:left-1/2 before:top-1/2 before:h-full before:min-h-11 before:w-full before:min-w-11 before:-translate-x-1/2 before:-translate-y-1/2 before:content-['']",
    "has-[:disabled]:cursor-not-allowed",
  ].join(" "),
  {
    variants: {
      size: {
        "16": "min-h-6 gap-x1_5",
        "24": "min-h-6 gap-x2",
        "32": "min-h-8 gap-x2_5",
      },
    },
    defaultVariants: { size: "24" },
  },
);

export const switchLabelVariants = cva(
  "font-sans font-medium text-fg-neutral peer-disabled:text-fg-disabled",
  {
    variants: {
      size: {
        "16": "text-t3",
        "24": "text-t4",
        "32": "text-t5",
      },
    },
    defaultVariants: { size: "24" },
  },
);
