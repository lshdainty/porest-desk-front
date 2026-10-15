import { cva } from "class-variance-authority";

/*
 * Porest Select 의 모양 — 수치 원본은 porest-design specs/components/select.yaml(값은 src/shared/ds/spec/select.json).
 * porest-design recipes/shadcn/components/ui/select.tsx 를 첫 판으로 가져왔다. 이 파일은 모양 정의(클래스 · 상수),
 * 컴포넌트는 select.tsx 다(컴포넌트 파일은 컴포넌트만 내보낸다 — 빠른 새로 고침).
 *
 * 트리거는 Input Button 과 같은 상자다 — 스펙이 "Input Button 과 같은 값" 이라 했다. 레시피는 input-button 의 cva 를 가져다 쓰지만
 * 이 레포의 Input Button 은 아직 없으므로(다른 워크트리에서 만드는 중) 같은 값을 여기에 둔다. Input Button 이 서면 그쪽 cva 로
 * 합칠 수 있다(값이 같다).
 */

// 트리거의 크기 — 높이 · 모서리 · 좌우 여백 · 사이 · 글자, --input-button-icon(앞 아이콘 · 셰브론). large 52 · medium 40 · responsive(1280 에서 바뀐다)
export const selectTriggerSizeVariants = cva("font-sans", {
  variants: {
    size: {
      large:
        "min-h-13 gap-x2_5 rounded-r3 px-x4 text-t5 [--input-button-icon:20px]",
      medium:
        "min-h-10 gap-x2 rounded-r2 px-x3_5 text-t4 [--input-button-icon:16px]",
      responsive: [
        "min-h-13 gap-x2_5 rounded-r3 px-x4 text-t5 [--input-button-icon:20px]",
        "lg:min-h-10 lg:gap-x2 lg:rounded-r2 lg:px-x3_5 lg:text-t4 lg:[--input-button-icon:16px]",
      ].join(" "),
    },
  },
  defaultVariants: { size: "responsive" },
});

// 트리거의 겉모습 — 테두리는 안쪽 1px(inset shadow), 오류 2px 는 ::after 로 덧그려 내용이 밀리지 않고 색만 100ms 로 나타난다.
// 누르면 · 마우스를 올리면 bg-layer-default-pressed, 키보드 포커스에만 링(마우스 · 터치로 눌러서는 없다), 비활성 · 읽기 전용은 회색 바탕
export const selectTriggerSurfaceVariants = cva(
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
        enabled:
          "cursor-pointer hover:bg-bg-layer-default-pressed active:bg-bg-layer-default-pressed",
        disabled: "cursor-not-allowed bg-bg-disabled",
        readonly: "cursor-default bg-bg-disabled",
      },
      invalid: { true: "after:border-stroke-critical-solid", false: "" },
    },
    defaultVariants: { state: "enabled", invalid: false },
  },
);

// 목록 안 크기 — Tailwind 는 소스의 글자 그대로를 읽으므로 세 크기를 다 적는다. large 선택지 46 · medium 39
export const SELECT_SIZES = {
  large: {
    item: "py-x3",
    itemContent: "gap-x3",
    itemIcon: "[&>svg]:size-[22px]",
    itemLabel: "text-t5",
    itemDescription: "text-t3",
    indicator: "size-[14px]",
    groupLabel: "py-x2_5 text-t4 font-medium",
  },
  medium: {
    item: "py-x2_5",
    itemContent: "gap-x2",
    itemIcon: "[&>svg]:size-[18px]",
    itemLabel: "text-t4",
    itemDescription: "text-t2",
    indicator: "size-[12px]",
    groupLabel: "py-x2 text-t3 font-normal",
  },
  responsive: {
    item: "py-x3 lg:py-x2_5",
    itemContent: "gap-x3 lg:gap-x2",
    itemIcon: "[&>svg]:size-[22px] lg:[&>svg]:size-[18px]",
    itemLabel: "text-t5 lg:text-t4",
    itemDescription: "text-t3 lg:text-t2",
    indicator: "size-[14px] lg:size-[12px]",
    groupLabel:
      "py-x2_5 text-t4 font-medium lg:py-x2 lg:text-t3 lg:font-normal",
  },
} as const;

// 트리거의 콘텐츠 층 — 앞 아이콘 · 값 · 셰브론. 트리거를 누르는 동안만 준다(테두리 · 바탕은 그대로)
export const TRIGGER_CONTENT =
  "relative flex min-w-0 flex-1 items-center gap-[inherit] [transition:scale_var(--motion-duration-pressed-scale)_var(--motion-ease-pressed-scale)]";
export const TRIGGER_CONTENT_PRESS =
  "group-active/select-trigger:[scale:calc(1-2/var(--press-basis))] motion-reduce:group-active/select-trigger:[scale:1]";

// 셰브론 — 열 때 150ms · 닫을 때 100ms 로 돈다(바뀐 쪽의 transition 이 걸린다)
export const CHEVRON_OPEN =
  "rotate-180 [transition:rotate_var(--motion-duration-d3)_var(--motion-ease-easing)]";
export const CHEVRON_CLOSED =
  "rotate-0 [transition:rotate_var(--motion-duration-d2)_var(--motion-ease-easing)]";

// 목록 — 트리거 폭 · 모서리 20 · 떠 있는 바탕 + s3 · z-floating 200. 열 때 150ms enter · 닫을 때 100ms exit 로 0.95 ↔ 1 · 투명도,
// 붙은 쪽에서 커진다(모션 줄이기면 투명도만). 길이는 --tw-animation-duration 으로 준다(duration-* 는 transition-duration 도 바꾼다)
export const SELECT_CONTENT = [
  "z-(--z-floating) w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-r5 bg-bg-layer-floating font-sans shadow-[var(--shadow-s3)] outline-none",
  "origin-[var(--radix-popover-content-transform-origin)]",
  "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:[--tw-animation-duration:var(--motion-duration-d3)] data-[state=open]:ease-[var(--motion-ease-enter)] motion-safe:data-[state=open]:zoom-in-95",
  "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:[--tw-animation-duration:var(--motion-duration-d2)] data-[state=closed]:ease-[var(--motion-ease-exit)] motion-safe:data-[state=closed]:zoom-out-95",
].join(" ");

// 스크롤 자리 — 위아래 8 · 묶음 사이 8. 높이는 min(480, max(200, 남은 화면)) — 자리를 재기 전에는 480. 480 은 listMaxHeight 가 바꾼다
export const SELECT_SCROLL =
  "relative flex max-h-[min(var(--select-list-max-height,480px),max(200px,var(--radix-popover-content-available-height,480px)))] flex-col gap-x2 overflow-y-auto py-x2";

// 묶음 — 둘째 묶음부터 위에 1px 선(좌우 16 들임 · 아래 8). 위쪽 8 은 스크롤 자리의 gap — 묶음 사이 8 + 1 + 8 = 17
export const SELECT_GROUP =
  "flex flex-col [[data-select-group]+&]:before:mx-x4 [[data-select-group]+&]:before:mb-x2 [[data-select-group]+&]:before:h-px [[data-select-group]+&]:before:bg-stroke-neutral-subtle [[data-select-group]+&]:before:content-['']";

// 선택지 — 줄은 그대로, 알약(바탕 층)이 좌우 8 들어오며 칠해지고 콘텐츠 층만 누르는 동안 준다
export const SELECT_ITEM =
  "group/select-item relative flex cursor-pointer select-none items-center px-x4 scroll-my-x2";
export const SELECT_PILL =
  "pointer-events-none absolute inset-y-0 rounded-r3 [transition:background-color_var(--motion-duration-color-transition)_var(--motion-ease-easing),inset_var(--motion-duration-color-transition)_var(--motion-ease-easing)]";
export const SELECT_PILL_OFF = "inset-x-0 bg-transparent";
export const SELECT_PILL_ON = "inset-x-x2 bg-bg-layer-floating-pressed";
export const SELECT_PILL_PRESS =
  "group-active/select-item:inset-x-x2 group-active/select-item:bg-bg-layer-floating-pressed";
export const SELECT_ITEM_CONTENT =
  "relative flex min-w-0 flex-1 items-center [transition:scale_var(--motion-duration-pressed-scale)_var(--motion-ease-pressed-scale)]";
export const SELECT_ITEM_CONTENT_PRESS =
  "group-active/select-item:[scale:calc(1-2/var(--press-basis))] motion-reduce:group-active/select-item:[scale:1]";
