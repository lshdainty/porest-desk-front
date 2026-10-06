import type { ComponentType } from "react";

/**
 * 컴포넌트 라이브러리(src/shared/ds) 등록부 — 개발 전용 카탈로그(/dev/ds)가 그린다.
 *
 * 묶음 차례는 만드는 순서다. porest-design 레시피끼리 가져다 쓰는 관계로 정했다
 * (Button ← Progress Circle, Chip ← Field · Scroll Fog, Dialog ← Alert Dialog · Bottom Sheet …).
 * 묶음은 porest-design 에서 스펙을 정할 때 묶은 단위와 같다.
 *
 * spec 은 porest-design specs/components/<이름>.md 의 이름이고, 값은 src/shared/ds/spec/<이름>.json 이다.
 * 컴포넌트 폴더도 같은 이름이다(src/shared/ds/<이름>/).
 *
 * 데모는 그 폴더의 <이름>.demo.tsx 가 내보내는 컴포넌트 하나다 — 스펙의 변형 · 크기 · 상태를 모두 그린 화면.
 * 파일을 두면 저절로 붙는다(아래 DEMOS) — 이 파일은 고치지 않는다.
 */
export type DsEntry = {
  name: string;
  spec: string;
  demo?: ComponentType;
};

const DEMOS = import.meta.glob<Record<string, ComponentType>>(
  "../*/*.demo.tsx",
  { eager: true },
);
const demoFor = (spec: string) => {
  const mod = DEMOS[`../${spec}/${spec}.demo.tsx`];
  return mod ? Object.values(mod)[0] : undefined;
};

export type DsFamily = {
  id: string;
  title: string;
  entries: DsEntry[];
};

const FAMILIES: DsFamily[] = [
  {
    id: "button",
    title: "1 버튼",
    entries: [
      { name: "Progress Circle", spec: "progress-circle" },
      { name: "Button", spec: "button" },
    ],
  },
  {
    id: "loading",
    title: "2 로딩",
    entries: [
      { name: "Skeleton", spec: "skeleton" },
      { name: "Progress", spec: "progress" },
      { name: "Scroll Fog", spec: "scroll-fog" },
      { name: "Content Placeholder", spec: "content-placeholder" },
    ],
  },
  {
    id: "display",
    title: "3 표시",
    entries: [
      { name: "Badge", spec: "badge" },
      { name: "Notification Badge", spec: "notification-badge" },
      { name: "Tag Group", spec: "tag-group" },
      { name: "Avatar", spec: "avatar" },
      { name: "Divider", spec: "divider" },
    ],
  },
  {
    id: "text-field",
    title: "4 텍스트 필드",
    entries: [
      { name: "Field", spec: "field" },
      { name: "Input", spec: "input" },
      { name: "Textarea", spec: "textarea" },
    ],
  },
  {
    id: "selection",
    title: "5 선택 컨트롤",
    entries: [
      { name: "Checkbox", spec: "checkbox" },
      { name: "Radio", spec: "radio-group" },
      { name: "Switch", spec: "switch" },
    ],
  },
  {
    id: "pickers",
    title: "6 고르는 칸",
    entries: [
      { name: "Input Button", spec: "input-button" },
      { name: "Select", spec: "select" },
      { name: "Select Box", spec: "select-box" },
    ],
  },
  {
    id: "chips-tabs",
    title: "7 칩 · 탭",
    entries: [
      { name: "Chip", spec: "chip" },
      { name: "Tabs", spec: "tabs" },
      { name: "Segmented Control", spec: "segmented-control" },
    ],
  },
  {
    id: "overlays",
    title: "8 겹침",
    entries: [
      { name: "Alert Dialog", spec: "alert-dialog" },
      { name: "Bottom Sheet", spec: "bottom-sheet" },
      { name: "Dialog", spec: "dialog" },
      { name: "Popover", spec: "popover" },
    ],
  },
  {
    id: "menus",
    title: "9 메뉴",
    entries: [
      { name: "Menu Sheet", spec: "menu-sheet" },
      { name: "Menu", spec: "menu" },
      { name: "Help Bubble", spec: "help-bubble" },
      { name: "Tooltip", spec: "tooltip" },
    ],
  },
  {
    id: "date-time",
    title: "10 날짜 · 시각",
    entries: [
      { name: "Wheel Picker", spec: "wheel-picker" },
      { name: "Time Picker", spec: "time-picker" },
      { name: "Date Picker", spec: "date-picker" },
    ],
  },
  {
    id: "feedback",
    title: "11 피드백",
    entries: [
      { name: "Snackbar", spec: "snackbar" },
      { name: "Callout", spec: "callout" },
      { name: "Page Banner", spec: "page-banner" },
      { name: "Result Section", spec: "result-section" },
    ],
  },
  {
    id: "image",
    title: "12 이미지",
    entries: [
      { name: "Aspect Ratio", spec: "aspect-ratio" },
      { name: "Image Frame", spec: "image-frame" },
      { name: "Logo Tile", spec: "logo-tile" },
    ],
  },
  {
    id: "list",
    title: "13 목록",
    entries: [{ name: "List", spec: "list" }],
  },
];

export const DS_FAMILIES: DsFamily[] = FAMILIES.map((family) => ({
  ...family,
  entries: family.entries.map((entry) => ({
    ...entry,
    demo: demoFor(entry.spec),
  })),
}));

/** 역할 색 — 카탈로그 첫 화면의 색 판. 화면 · 컴포넌트는 이 이름만 부른다(DESIGN.md v102). */
export const DS_ROLE_SWATCHES: { group: string; names: string[] }[] = [
  {
    group: "글자",
    names: [
      "fg-neutral",
      "fg-neutral-muted",
      "fg-neutral-subtle",
      "fg-placeholder",
      "fg-disabled",
      "fg-brand",
      "fg-critical",
      "fg-positive",
      "fg-warning",
      "fg-informative",
    ],
  },
  {
    group: "배경",
    names: [
      "bg-layer-basement",
      "bg-layer-default",
      "bg-layer-floating",
      "bg-neutral-weak",
      "bg-neutral-inverted",
      "bg-brand-solid",
      "bg-brand-weak",
      "bg-critical-solid",
      "bg-critical-weak",
      "bg-positive-weak",
    ],
  },
  {
    group: "선",
    names: [
      "stroke-neutral-subtle",
      "stroke-neutral-weak",
      "stroke-neutral-solid",
      "stroke-focus-ring",
      "stroke-brand-solid",
    ],
  },
];
