import * as React from "react";

import { cn } from "@/shared/lib/cn";

import {
  aspectRatioVariants,
  type AspectRatioValue,
} from "./aspect-ratio-variants";

/*
 * Porest Aspect Ratio — 구조는 SEED Aspect Ratio(2026-10-04). 수치 원본은 porest-design
 * specs/components/aspect-ratio.yaml(값은 src/shared/ds/spec/aspect-ratio.json).
 * porest-design recipes/shadcn/components/ui/aspect-ratio.tsx 를 첫 판으로 가져왔다(앱 적용 1A).
 * 옛 Aspect Ratio(Radix · 권장 16:9 · 4:3 · 1:1 · 3:4 · 21:9 · 2:1 · 자식이 모서리 · 바탕을 맡음)를 대신한다.
 *
 *   AspectRatio   폭이 정해지면 비율로 높이가 정해지는 상자 하나 — 자식 하나가 상자를 채운다. 그 밖은 div 속성
 *     ratio       "1:1" · "2:1" · "16:9" · "4:3"(기본) · "6:7" · "4:5" · "2:3" · "card"(카드 1.586 — ISO 카드 85.6 × 53.98).
 *                 SEED 의 일곱에 카드 1.586 을 더한 여덟 가지만 받는다 — 옛 3:4 · 21:9 · 아무 숫자는 없다
 *
 * 폭은 부모가 정한다(부모 폭이 0 이면 상자도 0). 높이는 CSS aspect-ratio 로 정해져 내용이 오기 전에 자리를 잡는다 —
 * 내용이 와도 줄이 밀리지 않는다. 모서리 0 · 바탕 · 테두리 · 그림자 · 불러오는 동안 · 대체 그림이 없다. 넘친 자식은 자른다.
 * 자식은 하나 — absolute · inset 0 으로 상자를 채우고, img · video 는 가운데를 남겨 자른다(cover). 지도 · iframe 은 상자 크기 그대로.
 * 역할 · 이름이 없다 — 자식이 말한다(동영상의 aria-label · 자막, 지도의 이름). 누르지 않고 초점이 서지 않는다.
 *
 * 그림(사진 · 카드 그림 · 규정 그림)은 이것이 아니라 Image Frame 이다 — 모서리(폭으로) · 투명 윤곽 · 불러오는 동안의 스켈레톤 ·
 * 대체 그림 · 그림 위 배지를 함께 가진다. Image Frame 은 비율(aspect-ratio-variants.ts 의 aspectRatioVariants)을 그대로 쓴다.
 */

// 상자 — 부모 폭, 모서리 · 바탕 없음, 넘친 자식은 자른다. 자식은 상자를 채우고 img · video 는 cover
const ROOT = [
  "relative block w-full overflow-hidden",
  "*:absolute *:inset-0 *:size-full [&>img]:object-cover [&>video]:object-cover",
].join(" ");

export interface AspectRatioProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 비율 — 기본 "4:3". 여덟 가지만 받는다 */
  ratio?: AspectRatioValue;
}

const AspectRatio = React.forwardRef<HTMLDivElement, AspectRatioProps>(
  ({ ratio = "4:3", className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="aspect-ratio"
      data-ratio={ratio}
      className={cn(ROOT, aspectRatioVariants({ ratio }), className)}
      {...props}
    />
  ),
);
AspectRatio.displayName = "AspectRatio";

export { AspectRatio };
