import * as React from "react";
import { Slot } from "@radix-ui/react-slot";

import { cn } from "@/shared/lib/cn";

import { useScrollAutoHide } from "./use-scroll-auto-hide";

/*
 * Porest Scroll Auto Hide — SEED Breeze ScrollAutoHide · Apache-2.0(2026-10-10). 수치 원본은 porest-design
 * specs/components/scroll-auto-hide.yaml(값은 src/shared/ds/spec/scroll-auto-hide.json). porest-design
 * recipes/shadcn/components/ui/scroll-auto-hide.tsx 를 첫 판으로 가져왔다. 동작(1:1 · 50% 스냅 · 모션 줄이기 · 초점)은
 * use-scroll-auto-hide.ts 에 있다.
 *
 *   ScrollAutoHide   숨는 영역 — scrollContainerRef(스크롤 상자의 ref — 필수) · asChild(자식 하나를 루트로), 나머지는 div 속성.
 *                    바탕 · z-index 는 className 으로 쓰는 쪽이 정한다(원장 머리는 bg-bg-layer-default · z-2 — 스크롤 상자 안의 겹침 값,
 *                    층 토큰이 아니다). 스크롤 상자 맨 위에 둔다(sticky · top 0 은 부품이 건다)
 *
 * 스크롤 상자 맨 위에 붙은 영역이 아래로 스크롤하면 그 거리만큼 위로 숨고, 위로 스크롤하면 같은 거리만큼 드러난다. 스크롤이 끝나면
 * 영역 높이의 50% 를 기준으로 다 숨거나 다 드러난다(200ms motion-ease-enter). 높이를 바꾸지 않고 translate3d 로만 옮기므로 루트의
 * transform 은 이 일에 쓴다 — 다른 transform 은 자식에 건다. 모션 줄이기면 자동 숨김을 끈다. 숨은 영역 안으로 키보드 초점이 오면 바로
 * 다 드러낸다. 숨겨도 aria-hidden · inert 를 걸지 않는다(초점이 오면 드러나므로 — 스펙 Accessibility "ARIA"). 상단 바 · Line Tabs ·
 * 시트 머리는 숨기지 않는다.
 *
 * 레시피와 다른 자리 — 동작은 훅(useScrollAutoHide)으로 나눴고, 두 ref 를 잇는 useMemo 를 걷었다(React Compiler).
 */

type ScrollAutoHideOwnProps = {
  /** 스크롤을 감지할 상자의 ref — 숨는 영역은 이 상자 안 맨 위에 둔다 */
  scrollContainerRef: React.RefObject<HTMLElement | null>;
};

type ScrollAutoHideAsChildProps = ScrollAutoHideOwnProps &
  Omit<React.HTMLAttributes<HTMLElement>, "children"> & {
    asChild: true;
    children: React.ReactElement;
  };

type ScrollAutoHideDefaultProps = ScrollAutoHideOwnProps &
  React.HTMLAttributes<HTMLDivElement> & {
    asChild?: false;
  };

export type ScrollAutoHideProps =
  ScrollAutoHideAsChildProps | ScrollAutoHideDefaultProps;

function mergeRefs<T>(...refs: (React.Ref<T> | undefined)[]) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as React.MutableRefObject<T | null>).current = node;
    }
  };
}

const ScrollAutoHide = React.forwardRef<HTMLElement, ScrollAutoHideProps>(
  function ScrollAutoHide(
    { asChild, scrollContainerRef, className, ...props },
    forwardedRef,
  ) {
    const rootRef = React.useRef<HTMLElement>(null);
    useScrollAutoHide(rootRef, scrollContainerRef);

    const Component = asChild ? Slot : "div";

    // asChild 면 자식의 data-slot 을 덮지 않는다 — 자리 표시는 data-scroll-auto-hide 로
    return (
      <Component
        {...props}
        {...(asChild ? {} : { "data-slot": "scroll-auto-hide" })}
        data-scroll-auto-hide=""
        ref={mergeRefs(forwardedRef, rootRef)}
        className={cn("sticky top-0", className)}
      />
    );
  },
);

ScrollAutoHide.displayName = "ScrollAutoHide";

export { ScrollAutoHide };
