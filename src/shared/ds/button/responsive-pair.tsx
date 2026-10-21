import * as React from "react";
import { cn } from "@/shared/lib/utils";
import { RESPONSIVE_PAIR } from "./button-variants";

/**
 * ResponsivePair — 짝 버튼(보조 · 주 순서로 둔다). 어느 한 라벨이 짝 폭의 절반을 넘으면 둘 다 세로로 쌓고
 * 주 버튼이 위로 가며, 라벨은 한 줄을 지킨다(groo-design button.md "긴 라벨" · SEED ResponsivePair ·
 * 2026-10-21 사용자 결정 I-01 결정 6A). 판정은 CSS 가 한다 — 줄바꿈 거꾸로(flex-wrap-reverse) + 버튼마다
 * 반 폭 바탕(basis) + 글 폭보다 줄지 않음(min-w-max). 시트 · 확인창 바닥도 이 부품을 쓴다.
 */
const ResponsivePair = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="responsive-pair"
    className={cn(RESPONSIVE_PAIR, className)}
    {...props}
  />
));
ResponsivePair.displayName = "ResponsivePair";

export { ResponsivePair };
