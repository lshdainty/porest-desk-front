import * as React from "react";
import type { VariantProps } from "class-variance-authority";

import { cn } from "@/shared/lib/cn";

import { scrollAreaVariants } from "./scroll-area-variants";

/*
 * Groo Scroll Area — 기본 스크롤 + 전역 스크롤바 한 벌(2026-10-10). 수치 원본은 groo-design specs/components/scroll-area.yaml
 * (값은 src/shared/ds/spec/scroll-area.json). groo-design recipes/shadcn/components/ui/scroll-area.tsx 를 첫 판으로 가져왔다.
 * SEED 에는 Scroll Area · 스크롤바 규칙이 없다(끝 흐림 Scroll Fog 만) — groo 가 정했다. 내용 위에 겹쳐 뜨는 Radix ScrollArea(올리기 전에는
 * 보이지 않는 막대)와 ScrollBar 는 걷었다 — 스크롤은 브라우저 그대로이고 스크롤바 모양은 src/index.css 의 전역 한 벌이다.
 *
 *   ScrollArea   기본 스크롤 상자(div) — orientation "vertical"(기본) · "horizontal" · "both"(넘치는 방향만 overflow: auto) ·
 *                label(주면 role="region" · tabIndex 0 · aria-label — 안에 초점 가는 것이 없으면 준다: 글 · 표 · 일정 칸) ·
 *                contain(overscroll-behavior: contain — 시트 · 대화상자 · 팝오버 안), 나머지는 div 속성. 높이 · 폭은 className 으로
 *
 * 안에 버튼 · 링크 · 칸이 없는 스크롤 상자는 키보드로 닿을 길이 없다 — 상자 자신이 초점을 받고(↑ ↓ · PageUp · PageDown · Home · End),
 * 무엇의 상자인지 이름을 단다. 역할 없는 div 에는 aria-label 을 쓸 수 없어(ARIA 1.2) region 을 함께 둔다. 안에 초점 가는 것이 있으면
 * label 을 주지 않는다 — 그것에 초점이 가면 브라우저가 스크롤한다. 키보드 포커스 링은 상자 안쪽 2px(바깥 링은 카드 · 시트에 잘린다).
 * 시트 · 대화상자 · 팝오버 안의 상자는 contain — 끝에 닿아도 본문 · 뒤 화면이 따라 스크롤되지 않는다.
 * 끝을 흐리는 상자는 Scroll Fog 의 ScrollFog 가 곧 스크롤 상자다(같은 규칙을 div 속성과 className 으로 받는다).
 */

export type ScrollAreaOrientation = NonNullable<
  VariantProps<typeof scrollAreaVariants>["orientation"]
>;

export interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 넘치는 방향 — "vertical"(기본) · "horizontal" · "both" */
  orientation?: ScrollAreaOrientation;
  /** 상자의 이름 — 주면 role="region" · tabIndex 0 · aria-label(안에 초점 가는 것이 없는 상자) */
  label?: string;
  /** overscroll-behavior: contain — 시트 · 대화상자 · 팝오버 안의 상자 */
  contain?: boolean;
}

const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  (
    { orientation = "vertical", label, contain = false, className, ...props },
    ref,
  ) => (
    <div
      ref={ref}
      role={label != null ? "region" : undefined}
      tabIndex={label != null ? 0 : undefined}
      aria-label={label}
      data-slot="scroll-area"
      data-orientation={orientation}
      className={cn(scrollAreaVariants({ orientation, contain }), className)}
      {...props}
    />
  ),
);
ScrollArea.displayName = "ScrollArea";

export { ScrollArea };
