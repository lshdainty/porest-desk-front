/*
 * Groo Menu Sheet 의 모양 — 수치 원본은 groo-design specs/components/menu-sheet.yaml(값은 src/shared/ds/spec/menu-sheet.json).
 * groo-design recipes/shadcn/components/ui/menu-sheet.tsx 를 첫 판으로 가져왔다 — 이 파일은 모양 정의,
 * 컴포넌트는 menu-sheet.tsx 다(컴포넌트 파일은 컴포넌트만 내보낸다 — 빠른 새로 고침).
 */

export type MenuSheetLayout = "textWithIcon" | "textOnly";

// 시트 — Bottom Sheet 의 바탕 위에 모서리 20 · 위 24(손잡이 자리) · 좌우 화면 여백 · 아래 16 + 안전 영역
export const MENU_SHEET_SURFACE =
  "rounded-t-r5 px-global-gutter pt-x6 pb-[calc(var(--spacing-x4)+env(safe-area-inset-bottom))]";

// 머리 — 가운데, 제목 t6 18 / 24 · 700 · 설명 t4 fg-neutral-muted, 사이 4 · 아래 16
export const MENU_SHEET_HEADER =
  "flex shrink-0 flex-col gap-x1 pb-x4 text-center";
export const MENU_SHEET_TITLE = "m-0 text-t6 font-bold text-fg-neutral";
export const MENU_SHEET_DESCRIPTION =
  "m-0 text-t4 font-normal text-fg-neutral-muted";

// 목록 — 묶음 사이 10. 화면의 90% 를 넘으면 목록만 스크롤한다(머리는 그대로)
export const MENU_SHEET_LIST = "flex min-h-0 flex-col gap-x2_5 overflow-y-auto";

// 묶음 — 옅은 회색 상자 · 모서리 16. 줄의 링은 줄 안쪽이라 상자가 자르지 않는다
export const MENU_SHEET_GROUP =
  "flex shrink-0 flex-col overflow-hidden rounded-r4 bg-bg-neutral-weak";

// 보조 기술용 닫기 — 평소에는 화면에서 숨기고(읽기 프로그램은 읽는다), 키보드 초점이 오면 폭 전체 버튼으로 보인다
export const MENU_SHEET_CLOSE = [
  "absolute -m-px size-px shrink-0 overflow-hidden whitespace-nowrap border-0 p-0 [clip-path:inset(50%)]",
  "cursor-pointer bg-bg-neutral-weak font-sans text-t5 font-medium text-fg-neutral",
  "focus-visible:relative focus-visible:m-0 focus-visible:mt-x2_5 focus-visible:flex focus-visible:h-auto focus-visible:min-h-[52px] focus-visible:w-full",
  "focus-visible:items-center focus-visible:justify-center focus-visible:overflow-visible focus-visible:whitespace-normal focus-visible:[clip-path:none]",
  "focus-visible:rounded-r3 focus-visible:px-x5",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focus-ring",
  "[transition:background-color_var(--motion-duration-color-transition)_var(--motion-ease-easing)] hover:bg-bg-neutral-weak-pressed active:bg-bg-neutral-weak-pressed",
].join(" ");

// 줄 — 최소 52 · 위아래 14 · 좌우 16. 줄 사이 선은 안쪽 아래 1px(묶음의 마지막 줄에는 없다). 호버 · 누름 바탕은 막히지 않은 줄만
export const MENU_SHEET_ITEM = [
  "group/menu-sheet-item relative flex min-h-[52px] w-full shrink-0 cursor-pointer select-none items-center border-0 bg-transparent px-x4 py-x3_5 font-sans",
  "not-last:shadow-[inset_0_-1px_0_0_var(--color-stroke-neutral-weak)]",
  "[transition:background-color_var(--motion-duration-color-transition)_var(--motion-ease-easing)]",
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-stroke-focus-ring",
  "disabled:cursor-not-allowed",
].join(" ");
export const MENU_SHEET_ITEM_ENABLED =
  "hover:bg-bg-neutral-weak-pressed active:bg-bg-neutral-weak-pressed";

// 콘텐츠 층 — 아이콘 22 ↔ 글 14. 누르는 동안만 준다(바탕은 그대로)
export const MENU_SHEET_ITEM_CONTENT =
  "relative flex min-w-0 flex-1 items-center gap-x3_5 [transition:scale_var(--motion-duration-pressed-scale)_var(--motion-ease-pressed-scale)]";
export const MENU_SHEET_ITEM_CONTENT_PRESS =
  "group-active/menu-sheet-item:[scale:calc(1-2/var(--press-basis))] motion-reduce:group-active/menu-sheet-item:[scale:1]";

// 글자색 — 쉴 때 · 호버 · 누름(누름 바탕 위 4.5:1). 막힌 줄은 전용 색 하나
export const MENU_SHEET_TONE = {
  neutral: {
    fg: "text-fg-neutral",
    description:
      "text-fg-neutral-subtle group-hover/menu-sheet-item:text-fg-neutral-muted group-active/menu-sheet-item:text-fg-neutral-muted",
  },
  critical: {
    fg: "text-fg-critical group-hover/menu-sheet-item:text-fg-critical-contrast group-active/menu-sheet-item:text-fg-critical-contrast",
    description:
      "text-fg-neutral-subtle group-hover/menu-sheet-item:text-fg-neutral-muted group-active/menu-sheet-item:text-fg-neutral-muted",
  },
} as const;
