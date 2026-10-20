import { cva } from "class-variance-authority";

import { cn } from "@/shared/lib/cn";

/*
 * Groo Accordion — 구조는 SEED Accordion(rootage accordion.json · accordion-item.json, 2026-10-10). 수치 원본은 groo-design
 * specs/components/accordion.yaml(값은 src/shared/ds/spec/accordion.json). groo-design recipes/shadcn/components/ui/accordion.tsx 를
 * 첫 판으로 가져왔다 — 이 파일은 변형 정의 · 상수, 컴포넌트는 accordion.tsx 다(컴포넌트 파일은 컴포넌트만 내보낸다 — 빠른 새로 고침).
 * 트리거의 짜임(accordionTrigger*)은 Collapsible 이 같은 모양으로 쓴다.
 *
 * 트리거는 두 층이다 — 바탕 층(button::before: 누름 · 호버 바탕, 줄지 않는다)과 콘텐츠 층(앞 아이콘 · 본문 · 꺾쇠). 누르거나 올리면 바탕이
 * 좌우 6 들어와 모서리 10 이 되고(SEED), 누르는 동안 콘텐츠 층만 2px 거리로 준다(기초 Feedback v104 — 기준 max(높이, 폭 ÷ 4, 24) 를
 * 누르는 순간 재서 --press-basis 로). 호버는 마우스 있는 기기에서만(v106). 바탕은 불투명한 bg-layer-default-pressed — 시트 · 대화상자 위도 같다.
 * 트리거 위아래 16 · 좌우 24(spacing-global-gutter), 앞 아이콘 22 · 본문 · 꺾쇠 20 사이 12, 제목 t5 16 / 22 · 500 · fg-neutral, 설명 t3 13 / 18 · 500 ·
 * fg-neutral-subtle(제목 아래 2). 제목만이면 54, 설명이 있으면 74 — 제목 · 설명은 늘 줄을 바꾼다(단어 단위, 말줄임 없음 — v114).
 * 꺾쇠는 lucide chevron-down 20 · fg-neutral-subtle — 펼치면 180° 돈다. 막힘은 앞 아이콘 · 제목 · 설명 · 꺾쇠가 모두 fg-disabled(흐리게 하지 않는다).
 * 키보드 포커스에만 트리거 안쪽 2px 링 — inline 은 각진 링, separated 는 항목 모서리를 따라 14.
 */

/** 누르는 순간 기준 길이 max(높이, 폭 ÷ 4, 24) 를 --press-basis 로(Button · List 와 같은 식) — 콘텐츠 층이 물려받는다 */
export function measurePress(el: HTMLElement) {
  el.style.setProperty(
    "--press-basis",
    String(Math.max(el.offsetHeight, el.offsetWidth / 4, 24)),
  );
}

// 단추 — 줄 전체가 누르는 자리. 포커스 링은 안쪽 2px(outline-none 을 같이 두지 않는다 — Tailwind v4 의 outline-none 은
// --tw-outline-style 을 none 으로 남겨 focus-visible:outline-2 를 지운다). 바탕 층은 단추 안의 span(accordionBackgroundVariants)이다 —
// 가상 요소는 검사기가 읽지 못해 층에 직접 그린다.
// 누름 색은 --trigger-pressed(기본 bg-layer-default-pressed — Collapsible 경고 상자는 bg-warning-weak-pressed).
// 높이 — 위아래 16 + 제목 22 = 54, 설명이 있으면 + 2 + 18 = 74(스펙 trigger.minHeight 가 두 값이다 — 간격 토큰에 없어 값 그대로).
// 링의 모서리 — 링(2px)이 단추 안쪽 끝에 붙어 단추 모서리가 곧 링 바깥 모서리다
export const accordionTriggerVariants = cva(
  [
    "group/accordion-trigger relative flex w-full cursor-pointer appearance-none border-0 bg-transparent p-0 text-left font-sans",
    "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-stroke-focus-ring",
    "disabled:cursor-not-allowed",
  ],
  {
    variants: {
      ring: {
        square: "rounded-none",
        r3_5: "rounded-r3_5",
        r2_5: "rounded-r2_5",
      },
      pressed: {
        layer: "[--trigger-pressed:var(--color-bg-layer-default-pressed)]",
        warning: "[--trigger-pressed:var(--color-bg-warning-weak-pressed)]",
      },
      tall: { true: "min-h-[74px]", false: "min-h-[54px]" },
    },
    defaultVariants: { ring: "square", pressed: "layer", tall: false },
  },
);

// 바탕 층 — 누름 · 호버 바탕. 콘텐츠 뒤에 깔리고 줄지 않는다. 마우스 있는 기기에서 올리거나(v106) 누르면 좌우 6 들어와 모서리 10 이 된다
export const ACCORDION_BACKGROUND = [
  "pointer-events-none absolute inset-y-0 inset-x-0 rounded-none bg-transparent",
  "[transition:background-color_var(--motion-duration-color-transition)_var(--motion-ease-easing),inset_var(--motion-duration-color-transition)_var(--motion-ease-easing),border-radius_var(--motion-duration-color-transition)_var(--motion-ease-easing)]",
  "[@media(hover:hover)]:group-enabled/accordion-trigger:group-hover/accordion-trigger:inset-x-x1_5 [@media(hover:hover)]:group-enabled/accordion-trigger:group-hover/accordion-trigger:rounded-r2_5 [@media(hover:hover)]:group-enabled/accordion-trigger:group-hover/accordion-trigger:bg-(--trigger-pressed)",
  "group-enabled/accordion-trigger:group-active/accordion-trigger:inset-x-x1_5 group-enabled/accordion-trigger:group-active/accordion-trigger:rounded-r2_5 group-enabled/accordion-trigger:group-active/accordion-trigger:bg-(--trigger-pressed)",
].join(" ");

// 콘텐츠 층 — 앞 아이콘 · 본문 · 꺾쇠. 위아래 16 · 좌우 24(경고 상자 16), 사이 12. 누르는 동안 이 층만 2px 거리 축소
export const accordionTriggerContentVariants = cva(
  [
    "relative flex w-full min-w-0 items-center gap-x3 py-x4",
    "[transition:scale_var(--motion-duration-pressed-scale)_var(--motion-ease-pressed-scale)]",
  ],
  {
    variants: {
      padX: { gutter: "px-global-gutter", x4: "px-x4" },
      press: {
        true: "group-active/accordion-trigger:[scale:calc(1-2/var(--press-basis))] motion-reduce:group-active/accordion-trigger:[scale:1]",
        false: "",
      },
    },
    defaultVariants: { padX: "gutter", press: false },
  },
);

// 상세가 없는 줄 — 같은 위아래 16 · 좌우 24 로 높이(54 · 74)와 글 시작이 트리거와 같다. 누르는 줄이 아니라 바탕이 없고 커서도 그대로다
export const accordionPlainContentVariants = cva("cursor-default", {
  variants: { tall: { true: "min-h-[74px]", false: "min-h-[54px]" } },
  defaultVariants: { tall: false },
});

export const accordionPrefixVariants = (disabled?: boolean) =>
  cn(
    "flex shrink-0 [&>svg]:size-[22px] [&>svg]:shrink-0",
    disabled ? "text-fg-disabled" : "text-fg-neutral",
  );

export const ACCORDION_BODY =
  "flex min-w-0 flex-1 flex-col items-start gap-x0_5";

// 제목 · 설명 — 늘 줄을 바꾼다(단어 단위 — 낱말 사이에서만, 한 줄보다 긴 낱말만 칸 끝에서)
export const accordionTitleVariants = (disabled?: boolean) =>
  cn(
    "font-sans text-t5 font-medium break-keep [overflow-wrap:break-word]",
    disabled ? "text-fg-disabled" : "text-fg-neutral",
  );
export const accordionDescriptionVariants = (disabled?: boolean) =>
  cn(
    "font-sans text-t3 font-medium break-keep [overflow-wrap:break-word]",
    disabled ? "text-fg-disabled" : "text-fg-neutral-subtle",
  );

// 꺾쇠 20 — 펼치면 180°(300ms easing, 모션 줄이기면 바로)
export const accordionChevronVariants = cva(
  "size-5 shrink-0 [transition:rotate_var(--motion-duration-d6)_var(--motion-ease-easing)] motion-reduce:transition-none",
  {
    variants: {
      open: { true: "rotate-180", false: "" },
      disabled: {
        true: "text-fg-disabled",
        false: "text-fg-neutral-subtle",
      },
    },
    defaultVariants: { open: false, disabled: false },
  },
);

// 펼친 내용의 글 — 좌우 24 · 아래 16(위 0), text-article-note 14 / 22 · fg-neutral-muted, 줄바꿈 문자를 지킨다
export const ACCORDION_PANEL_TEXT =
  "px-global-gutter pb-x4 pt-0 font-sans text-article-note font-normal text-fg-neutral-muted whitespace-pre-line break-keep [overflow-wrap:break-word]";

// 항목 사이 선 — inline 만(1px · stroke-neutral-subtle · 좌우 24). 첫 항목 위 · 끝 항목 아래에는 긋지 않는다(Divider — 마지막 선 금지).
// 선은 항목 맨 위의 span(ACCORDION_DIVIDER)이고 앞에 형제 항목이 있을 때만 보인다 — 가상 요소는 검사기가 읽지 못해 요소로 그린다.
// separated 는 항목마다 Card 면이라 선이 없고 사이 8
export const accordionVariants = cva("flex flex-col", {
  variants: {
    variant: {
      inline:
        "gap-0 [&>[data-accordion-row]+[data-accordion-row]>[data-slot=accordion-divider]]:block",
      separated: "gap-x2",
    },
  },
  defaultVariants: { variant: "inline" },
});

export const ACCORDION_DIVIDER = "mx-x6 hidden h-px bg-stroke-neutral-subtle";

// 항목 면 — separated 는 Card 면(1px stroke-neutral-weak · 모서리 16 · 그림자 없음). 바탕은 놓인 면 그대로. 누름 바탕 · 펼친 내용을 모서리에서 자른다
export const accordionItemVariants = cva("relative", {
  variants: {
    variant: {
      inline: "",
      separated:
        "overflow-hidden rounded-r4 border border-solid border-stroke-neutral-weak bg-transparent",
    },
  },
  defaultVariants: { variant: "inline" },
});

// 목록 머리 — 시트 · 대화상자에서 아코디언 위 한 줄. 높이 32 · 아래 8 · 제목 t5 · 700(카드 머리와 같은 글) + 오른쪽 모두 펼치기
export const ACCORDION_HEADER =
  "mb-x2 flex min-h-8 items-center justify-between gap-x2";
export const ACCORDION_HEADER_TITLE =
  "min-w-0 font-sans text-t5 font-bold text-fg-neutral break-keep [overflow-wrap:break-word]";

// 모두 펼치기 — Card 머리 동작과 같은 모양: 보이는 상자 32 · 왼쪽 8 · 오른쪽 4 · 모서리 8, 글 t4 · 500 · fg-neutral-subtle + 아이콘 16(글 뒤 2),
// 누르는 영역 44(::before). 누르면 바탕 + 2px 거리 축소
export const ACCORDION_EXPAND_ALL = [
  "relative inline-flex h-8 shrink-0 cursor-pointer items-center gap-x0_5 rounded-r2 border-0 bg-transparent pl-x2 pr-x1",
  "font-sans text-t4 font-medium text-fg-neutral-subtle [&_svg]:size-4 [&_svg]:shrink-0",
  "before:absolute before:left-1/2 before:top-1/2 before:h-11 before:w-full before:min-w-11 before:-translate-x-1/2 before:-translate-y-1/2 before:content-['']",
  "[transition:background-color_var(--motion-duration-color-transition)_var(--motion-ease-easing),scale_var(--motion-duration-pressed-scale)_var(--motion-ease-pressed-scale)]",
  "[@media(hover:hover)]:hover:bg-bg-layer-default-pressed active:bg-bg-layer-default-pressed active:[scale:calc(1-2/var(--press-basis))] motion-reduce:active:[scale:1]",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focus-ring",
].join(" ");
