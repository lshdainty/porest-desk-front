import type {
  QuantityPickerLayout,
  QuantityPickerSize,
} from "./quantity-picker";

/*
 * Groo Quantity Picker 의 모양 — 크기 · 폭. 수치 원본은 groo-design specs/components/quantity-picker.yaml
 * (값은 src/shared/ds/spec/quantity-picker.json). 컴포넌트와 규칙은 quantity-picker.tsx 머리 주석이다
 * (컴포넌트 파일은 컴포넌트만 내보낸다 — 빠른 새로 고침).
 */

// 상자 — 안쪽 1px 테두리(오류는 2px, 내용이 밀리지 않는다). 크기마다 높이 · 모서리
export const QUANTITY_ROOT =
  "relative inline-flex shrink-0 items-center bg-bg-layer-default font-sans shadow-[inset_0_0_0_1px_var(--color-stroke-neutral-weak)] data-[invalid]:shadow-[inset_0_0_0_2px_var(--color-stroke-critical-solid)]";
export const QUANTITY_ROOT_SIZE: Record<QuantityPickerSize, string> = {
  small: "min-h-[36px] rounded-r2",
  medium: "min-h-[40px] rounded-r2",
  large: "min-h-[52px] rounded-r3",
  responsive: "min-h-[52px] rounded-r3 lg:min-h-[40px] lg:rounded-r2",
};
// hug — 내용 폭(Field 같은 세로 Flex 안에서도 늘어나지 않는다) · fill — 부모 Flex 의 남은 폭
export const QUANTITY_ROOT_LAYOUT: Record<QuantityPickerLayout, string> = {
  hug: "w-fit",
  fill: "grow",
};

// 버튼 — 정사각 · 투명. 누르는 자리 44(::before — 보이는 상자보다 작을 때만 넓힌다, 52 는 그대로).
// 끝 · 읽기 전용(aria-disabled) · 막힘(disabled)은 바탕 · 축소 없이 아이콘만 fg-disabled. 로딩(aria-busy)은 누름 바탕 + 원
export const QUANTITY_BUTTON = [
  "relative inline-flex shrink-0 cursor-pointer items-center justify-center bg-transparent text-fg-neutral",
  "before:absolute before:left-1/2 before:top-1/2 before:h-full before:min-h-[44px] before:w-full before:min-w-[44px] before:-translate-x-1/2 before:-translate-y-1/2 before:content-['']",
  "[transition:background-color_var(--motion-duration-color-transition)_var(--motion-ease-easing),scale_var(--motion-duration-pressed-scale)_var(--motion-ease-pressed-scale)]",
  "hover:bg-bg-layer-default-pressed active:bg-bg-layer-default-pressed active:[scale:calc(1-2/var(--press-basis))] motion-reduce:active:[scale:1]",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focus-ring",
  "aria-disabled:cursor-not-allowed aria-disabled:text-fg-disabled aria-disabled:hover:bg-transparent aria-disabled:active:bg-transparent aria-disabled:active:[scale:1]",
  "disabled:cursor-not-allowed disabled:text-fg-disabled disabled:hover:bg-transparent disabled:active:bg-transparent disabled:active:[scale:1]",
  "aria-busy:cursor-progress aria-busy:bg-bg-layer-default-pressed aria-busy:hover:bg-bg-layer-default-pressed aria-busy:active:[scale:1]",
  // 로딩 원 — 두께 2 · 트랙 gray-500 · 호 fg-neutral(크기는 크기마다 --progress-size)
  "[--progress-thickness:2px] [--progress-track:var(--color-gray-500)] [--progress-range:var(--color-fg-neutral)]",
].join(" ");
// 아이콘 16 · 18 · 22(임의 값 — 스펙 JSON icon.size 와 같다, 토큰에 없다)
export const QUANTITY_BUTTON_SIZE: Record<QuantityPickerSize, string> = {
  small:
    "size-[36px] rounded-r2 [--press-basis:36] [--progress-size:16px] [&>svg]:size-[16px]",
  medium:
    "size-[40px] rounded-r2 [--press-basis:40] [--progress-size:18px] [&>svg]:size-[18px]",
  large:
    "size-[52px] rounded-r3 [--press-basis:52] [--progress-size:22px] [&>svg]:size-[22px]",
  responsive:
    "size-[52px] rounded-r3 [--press-basis:52] [--progress-size:22px] [&>svg]:size-[22px] lg:size-[40px] lg:rounded-r2 lg:[--press-basis:40] lg:[--progress-size:18px] lg:[&>svg]:size-[18px]",
};

// 선 — 1px × 16, 장식
export const QUANTITY_DIVIDER = "h-x4 w-px shrink-0 bg-stroke-neutral-subtle";

// 값 칸 — 보기만(누르기 · 초점 · 치기 없음). 숨긴 자리 글과 지금 값을 한 칸(격자 1 × 1)에 겹쳐 가장 넓은 글의 폭을 잡는다
export const QUANTITY_VALUE =
  "pointer-events-none grid shrink-0 grow select-none items-center justify-center px-x2 text-center font-medium tabular-nums text-fg-neutral data-[disabled]:text-fg-disabled";
export const QUANTITY_VALUE_SIZE: Record<QuantityPickerSize, string> = {
  small: "text-t5",
  medium: "text-t5",
  large: "text-t6",
  responsive: "text-t6 lg:text-t5",
};
export const QUANTITY_VALUE_PLACEHOLDER =
  "invisible col-start-1 row-start-1 whitespace-nowrap text-center";
export const QUANTITY_VALUE_TEXT =
  "col-start-1 row-start-1 whitespace-nowrap text-center";
