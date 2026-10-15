import type { MouseEvent } from "react";
import { cva } from "class-variance-authority";

/*
 * Porest Input Button 의 상자 변형 · 상수 · 작은 헬퍼 — 수치 원본은 porest-design specs/components/input-button.yaml
 * (값은 src/shared/ds/spec/input-button.json). 컴포넌트와 규칙은 input-button.tsx 머리 주석이다
 * (컴포넌트 파일은 컴포넌트만 내보낸다 — 빠른 새로 고침). Select 의 트리거가 같은 상자를 쓰도록 cva 를 따로 내보낸다.
 */

// 상자의 크기 — 높이 · 모서리 · 좌우 여백 · 사이 · 글자, --input-button-icon(앞 · 뒤 아이콘) · --input-button-clear(지우기)
export const inputButtonVariants = cva("font-sans", {
  variants: {
    size: {
      large:
        "min-h-13 gap-x2_5 rounded-r3 px-x4 text-t5 [--input-button-icon:20px] [--input-button-clear:22px]",
      medium:
        "min-h-10 gap-x2 rounded-r2 px-x3_5 text-t4 [--input-button-icon:16px] [--input-button-clear:18px]",
      responsive: [
        "min-h-13 gap-x2_5 rounded-r3 px-x4 text-t5 [--input-button-icon:20px] [--input-button-clear:22px]",
        "lg:min-h-10 lg:gap-x2 lg:rounded-r2 lg:px-x3_5 lg:text-t4 lg:[--input-button-icon:16px] lg:[--input-button-clear:18px]",
      ].join(" "),
    },
  },
  defaultVariants: { size: "responsive" },
});

// 상자의 겉모습 — 버튼에 단다. 테두리는 안쪽 1px(inset shadow), 오류 2px 는 ::after 로 덧그려 내용이 밀리지 않고 색만 100ms 로 나타난다
export const inputButtonSurfaceVariants = cva(
  [
    "bg-transparent shadow-[inset_0_0_0_1px_var(--color-stroke-neutral-weak)]",
    "[transition:background-color_var(--motion-duration-color-transition)_var(--motion-ease-easing)]",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focus-ring",
    "after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:border-2 after:border-solid after:border-transparent after:content-['']",
    "after:[transition:border-color_var(--motion-duration-d2)_var(--motion-ease-easing)]",
  ].join(" "),
  {
    variants: {
      state: {
        enabled: "cursor-pointer active:bg-bg-layer-default-pressed",
        disabled: "cursor-not-allowed bg-bg-disabled",
        readonly: "cursor-default bg-bg-disabled",
      },
      // 마우스 호버의 바탕 — 칸 자신(self · Select 트리거) 또는 상자(group · 지우기 버튼 위에서도 잇는다)
      hover: { self: "", group: "" },
      invalid: { true: "after:border-stroke-critical-solid", false: "" },
    },
    compoundVariants: [
      {
        state: "enabled",
        hover: "self",
        className: "hover:bg-bg-layer-default-pressed",
      },
      {
        state: "enabled",
        hover: "group",
        className: "group-hover/input-button:bg-bg-layer-default-pressed",
      },
    ],
    defaultVariants: { state: "enabled", hover: "self", invalid: false },
  },
);

// 콘텐츠 층 — 앞 아이콘 · 앞 글 · 값 · 지우기 · 뒤 글 · 뒤 아이콘. 누름을 지나 보내고, 버튼(peer)을 누르는 동안만 준다
export const CONTENT =
  "relative flex min-w-0 flex-1 select-none items-center gap-[inherit] pointer-events-none [transition:scale_var(--motion-duration-pressed-scale)_var(--motion-ease-pressed-scale)]";
export const CONTENT_PRESS =
  "peer-active/input-button:[scale:calc(1-2/var(--press-basis))] motion-reduce:peer-active/input-button:[scale:1]";

// 지우기 — 콘텐츠 층 위에서 따로 눌린다. 보이는 22 · 18, 누르는 영역은 ::before 로 24. 누르면 자기만 준다(기준 24 — SEED scaleScope: self)
export const CLEAR = [
  "pointer-events-auto relative flex shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 text-fg-neutral-subtle",
  "[&>svg]:size-[var(--input-button-clear)]",
  "before:absolute before:left-1/2 before:top-1/2 before:size-6 before:-translate-x-1/2 before:-translate-y-1/2 before:content-['']",
  "[--press-basis:24] [transition:scale_var(--motion-duration-pressed-scale)_var(--motion-ease-pressed-scale)] active:[scale:calc(1-2/var(--press-basis))] motion-reduce:active:[scale:1]",
].join(" ");

// 누르는 순간 기준 길이 max(높이, 폭 ÷ 4, 24) 를 --press-basis 로 — 넓은 칸도 세로 2px 만큼만 준다
export function measurePress(el: HTMLElement | null) {
  if (!el) return;
  el.style.setProperty(
    "--press-basis",
    String(Math.max(el.offsetHeight, el.offsetWidth / 4, 24)),
  );
}

// 읽기 전용은 눌러도 · Enter · Space 로도 아무것도 열지 않는다 — onClick(감싼 Trigger 의 열기 포함)을 부르지 않는다
export function swallowClick(e: MouseEvent<HTMLButtonElement>) {
  e.preventDefault();
}
