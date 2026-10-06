import { cva } from "class-variance-authority";

/*
 * Porest Radio — 구조는 SEED Radio(2026-09-30). 수치 원본은 porest-design
 * specs/components/radio-group.yaml(값은 src/shared/ds/spec/radio-group.json).
 * porest-design recipes/shadcn/components/ui/radio-group.tsx 를 첫 판으로 가져왔다(앱 적용 1A) — 이 파일은 변형 정의,
 * 컴포넌트는 radio-group.tsx 다(컴포넌트 파일은 컴포넌트만 내보낸다 — 빠른 새로 고침).
 *
 *   Radiomark   동그라미만 — 라벨이 따로 서는 자리에 넣어 쓴다(누르는 영역은 그 줄 전체가 맡는다, 라벨 연결 필수)
 *   Radio       동그라미 + 라벨 — 라벨까지 눌리고, 누르는 영역은 44 까지 넓힌다(::before)
 *   RadioGroup  묶음 — 세로로 쌓고 줄 사이 12. 가로 배치는 두지 않는다(가로로 짧게 고르면 Segmented · Chip)
 *
 *   size   medium 20(점 8 · 라벨 14 · 줄 32, 기본) · large 24(점 10 · 라벨 16 · 줄 36)
 *   tone   neutral(짙은 회색, 기본) · brand(서비스 핵심 흐름에서만)
 *   weight regular(기본) · bold(강조)
 *
 * 선택 안 된 동그라미의 테두리는 stroke-neutral-solid(3:1 — v109). 선택은 테두리 없이 채운 원 + 가운데 점(SEED).
 * 호버 = 누름 색(v106), 누르면 동그라미만 세로 2px 축소(v104) — 기준 길이는 max(20·24, 24) = 24.
 * 비활성은 전용 색(v106) — 선택도 채운 원 그대로 색만 바꾼다(Checkbox 와 같다, 사용자 결정).
 * 오류는 동그라미를 바꾸지 않는다 — 묶음 아래 글. 설명 · 딸린 입력이 붙는 선택은 Radio 가 아니라 Select Box(사용자 결정).
 * 점은 늘 그려 두고(forceMount) 색만 바꾼다 — 채움과 함께 색으로 전환된다.
 * 라벨을 눌러도 동그라미가 반응하도록 Radio 는 group/radio, 동그라미는 그 hover · active 도 받는다.
 * 줄 사이 12 는 누르는 영역 때문이다 — 줄 32 · 36 에 더해 44 · 48 마다 한 줄이라 이웃 줄과 44 영역이 겹치지 않는다
 * (SEED 의 4 로는 한 줄이 36 · 40 만 받는다, 사용자 결정). Radio 줄은 내용만큼만 차지한다(self-start) — 직접 짠 줄은 묶음 폭을 쓴다.
 */
export const radiomarkVariants = cva(
  [
    "peer relative inline-grid shrink-0 cursor-pointer place-items-center rounded-full",
    "[transition:background-color_var(--motion-duration-color-transition)_var(--motion-ease-easing),border-color_var(--motion-duration-color-transition)_var(--motion-ease-easing),scale_var(--motion-duration-pressed-scale)_var(--motion-ease-pressed-scale)]",
    "active:[scale:calc(1-2/var(--press-basis))] group-active/radio:[scale:calc(1-2/var(--press-basis))] motion-reduce:active:[scale:1] motion-reduce:group-active/radio:[scale:1]",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focus-ring",
    "disabled:cursor-not-allowed disabled:[scale:1]",
    // 선택 안 됨 — 테두리 원. 호버 · 누름은 누름 바탕
    "border border-stroke-neutral-solid bg-transparent hover:bg-bg-layer-default-pressed active:bg-bg-layer-default-pressed group-hover/radio:bg-bg-layer-default-pressed group-active/radio:bg-bg-layer-default-pressed",
    "disabled:border-stroke-neutral-weak disabled:bg-bg-disabled",
    // 선택 — 테두리 없이 채운 원(톤에서). 비활성은 채움 그대로 색만
    "data-[state=checked]:border-0 data-[state=checked]:disabled:bg-bg-disabled",
  ].join(" "),
  {
    variants: {
      size: {
        medium: "size-5 [--press-basis:24]",
        large: "size-6 [--press-basis:24]",
      },
      tone: {
        neutral:
          "data-[state=checked]:bg-bg-neutral-inverted data-[state=checked]:hover:bg-bg-neutral-inverted-pressed data-[state=checked]:active:bg-bg-neutral-inverted-pressed data-[state=checked]:group-hover/radio:bg-bg-neutral-inverted-pressed data-[state=checked]:group-active/radio:bg-bg-neutral-inverted-pressed",
        brand:
          "data-[state=checked]:bg-bg-brand-solid data-[state=checked]:hover:bg-bg-brand-solid-pressed data-[state=checked]:active:bg-bg-brand-solid-pressed data-[state=checked]:group-hover/radio:bg-bg-brand-solid-pressed data-[state=checked]:group-active/radio:bg-bg-brand-solid-pressed",
      },
    },
    defaultVariants: {
      size: "medium",
      tone: "neutral",
    },
  },
);

// 가운데 점 — 선택 안 됨에는 투명, 선택이면 톤 색, 막히면 fg-disabled
export const radiomarkDotVariants = cva(
  "pointer-events-none block rounded-full bg-transparent [transition:background-color_var(--motion-duration-color-transition)_var(--motion-ease-easing)] data-[disabled]:data-[state=checked]:bg-fg-disabled",
  {
    variants: {
      size: {
        medium: "size-2",
        large: "size-2.5",
      },
      tone: {
        neutral: "data-[state=checked]:bg-fg-neutral-inverted",
        brand: "data-[state=checked]:bg-static-white",
      },
    },
    defaultVariants: {
      size: "medium",
      tone: "neutral",
    },
  },
);

// 한 줄 — 동그라미 + 라벨. 누르는 영역은 ::before 로 44 까지
export const radioVariants = cva(
  [
    "group/radio relative inline-flex cursor-pointer select-none items-center gap-x2 self-start",
    "before:absolute before:left-1/2 before:top-1/2 before:h-full before:min-h-11 before:w-full before:min-w-11 before:-translate-x-1/2 before:-translate-y-1/2 before:content-['']",
    "has-[:disabled]:cursor-not-allowed",
  ].join(" "),
  {
    variants: {
      size: {
        medium: "min-h-8",
        large: "min-h-9",
      },
    },
    defaultVariants: { size: "medium" },
  },
);

export const radioLabelVariants = cva(
  "font-sans text-fg-neutral peer-disabled:text-fg-disabled",
  {
    variants: {
      size: {
        medium: "text-t4",
        large: "text-t5",
      },
      weight: {
        regular: "font-normal",
        bold: "font-bold",
      },
    },
    defaultVariants: { size: "medium", weight: "regular" },
  },
);
