import * as React from "react";

import { cn } from "@/shared/lib/cn";

import { useScrollFog, type ScrollFogUse } from "./use-scroll-fog";

/*
 * Porest Scroll Fog — 구조는 SEED Scroll Fog(2026-10-03). 수치 원본은 porest-design specs/components/scroll-fog.yaml
 * (값은 src/shared/ds/spec/scroll-fog.json). porest-design recipes/shadcn/components/ui/scroll-fog.tsx 를 첫 판으로 가져왔다(앱 적용 1A).
 * 스크롤되는 영역의 끝을 흐려 뒤에 더 있다는 것을 알린다. 색을 덮는 막이 아니라 스크롤 상자에 거는 투명도 마스크라 어느 바탕
 * (흰 면 · 회색 바탕 · 다크)에서도 같고, 흐린 자리의 칩 · 줄도 그대로 눌린다. 스크롤 위치 · 넘침을 재지 않고 늘 켜 둔다.
 *
 *   ScrollFog     스크롤 상자 — 이 상자가 곧 스크롤 상자다. 높이 · 폭은 부르는 쪽이 className 으로 정하고, 그 밖은 div 속성
 *     use         흐림의 방향 · 깊이와 안쪽 여백 · 스크롤 여유(scroll-padding)를 정한다
 *                 box(기본 — 카드 · 상자 안의 높이를 정한 스크롤. 넘치는 방향의 양 끝 20, 안쪽 여백 · 스크롤 여유 20) ·
 *                 row(칩 필터 바 · 제안 칩 줄 · 가로 카드 줄. 좌우 20, 안쪽 여백 · 스크롤 여유는 화면 여백 24, 스크롤바는 숨긴다) ·
 *                 overlayBody(시트 · 대화상자 · 팝오버의 넘칠 수 있는 본문. 위 20 · 아래 80, 안쪽 여백 · 스크롤 여유도 위 20 · 아래 80) ·
 *                 page(바닥 고정 버튼이 있는 화면 전체 스크롤. overlayBody 와 같은 위 20 · 아래 80 — 바닥 버튼 위에서 끝난다)
 *   useScrollFog  다른 부품의 스크롤 상자에 같은 흐림을 건다(use-scroll-fog.ts) — Dialog · Bottom Sheet · Popover 본문(scrollFog),
 *                 Chip 의 가로 줄, Chip Tabs 목록. 여백 · 스크롤 여유는 그 부품이 둔다
 *
 * box 는 세로가 기본이다. 가로로 넘기는 상자는 overflow-x-auto overflow-y-hidden 을 주면 흐림 · 여백 · 스크롤 여유가 좌우로 간다
 * (상자의 overflow 로 정한다 — 넘쳤는지는 재지 않는다).
 *
 * 마스크 — gradient-fade-mask(알파 0 → 1, 16단계, v104)를 흐린 쪽마다 깊이만큼의 층에 둔다(use-scroll-fog.ts).
 * 깊이만큼 여백 — 흐린 쪽에 깊이 이상의 안쪽 여백을 둬 끝까지 스크롤하면 흐림이 빈 여백 위에 놓인다. 안쪽 여백은 안쪽 감싸개에 둔다
 *   (내용과 함께 스크롤된다 — 흐림 아래에 깔린다). 키보드로 옮긴 요소가 흐림 아래 멈추지 않게 스크롤 여유를 같은 만큼 둔다.
 * 흐림은 장식이다 — 역할 · 이름이 없다. 안에 초점 가는 요소가 없으면 상자에 tabIndex={0} 과 이름(aria-label)을 준다(키보드 스크롤).
 * 부품이 제 안개를 가진 자리(Wheel Picker · Date Picker 이어지는 달)에는 겹쳐 걸지 않는다.
 */

function mergeRefs<T>(...refs: (React.Ref<T> | undefined)[]) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as React.MutableRefObject<T | null>).current = node;
    }
  };
}

// 스크롤 상자 — 자리마다 넘침 · 스크롤 여유. box 는 축(data-fog-axis)을 따른다
const ROOT: Record<ScrollFogUse, string> = {
  box: "overflow-y-auto scroll-py-[20px] data-[fog-axis=x]:scroll-py-0 data-[fog-axis=x]:scroll-px-[20px]",
  row: "overflow-x-auto overflow-y-hidden scroll-px-global-gutter [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
  overlayBody: "overflow-y-auto scroll-pt-[20px] scroll-pb-[80px]",
  page: "overflow-y-auto scroll-pt-[20px] scroll-pb-[80px]",
};

// 안쪽 감싸개 — 흐린 쪽에 깊이 이상의 여백(내용과 함께 스크롤된다). 가로면 내용 폭만큼 넓어져 끝 여백이 내용 끝에 붙는다
const CONTENT: Record<ScrollFogUse, string> = {
  box: "py-[20px] group-data-[fog-axis=x]/scroll-fog:w-max group-data-[fog-axis=x]/scroll-fog:min-w-full group-data-[fog-axis=x]/scroll-fog:px-[20px] group-data-[fog-axis=x]/scroll-fog:py-0",
  row: "w-max min-w-full px-global-gutter",
  overlayBody: "pb-[80px] pt-[20px]",
  page: "pb-[80px] pt-[20px]",
};

export interface ScrollFogProps extends React.HTMLAttributes<HTMLDivElement> {
  /** box(기본) · row(가로 줄) · overlayBody(시트 · 대화상자 · 팝오버 본문) · page(바닥 고정 버튼이 있는 화면) */
  use?: ScrollFogUse;
}

const ScrollFog = React.forwardRef<HTMLDivElement, ScrollFogProps>(
  ({ use = "box", className, children, ...props }, ref) => {
    const own = React.useRef<HTMLDivElement>(null);
    useScrollFog(own, use, className);
    return (
      <div
        ref={mergeRefs(ref, own)}
        data-slot="scroll-fog"
        data-use={use}
        className={cn("group/scroll-fog relative", ROOT[use], className)}
        {...props}
      >
        <div data-slot="scroll-fog-content" className={CONTENT[use]}>
          {children}
        </div>
      </div>
    );
  },
);
ScrollFog.displayName = "ScrollFog";

export { ScrollFog };
