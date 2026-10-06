import { cva } from "class-variance-authority";

/*
 * Porest Aspect Ratio — 구조는 SEED Aspect Ratio(2026-10-04). 수치 원본은 porest-design
 * specs/components/aspect-ratio.yaml(값은 src/shared/ds/spec/aspect-ratio.json).
 * porest-design recipes/shadcn/components/ui/aspect-ratio.tsx 를 첫 판으로 가져왔다(앱 적용 1A) — 이 파일은 비율 정의,
 * 컴포넌트는 aspect-ratio.tsx 다(컴포넌트 파일은 컴포넌트만 내보낸다 — 빠른 새로 고침).
 *
 * 비율은 Image Frame · Logo Tile 이 그대로 쓴다(aspectRatioVariants).
 */

export type AspectRatioValue =
  "1:1" | "2:1" | "16:9" | "4:3" | "6:7" | "4:5" | "2:3" | "card";

// 비율 — 여덟 가지(aspect-ratio.yaml). Tailwind 는 소스의 글자 그대로를 읽으므로 비율마다 다 적는다
export const aspectRatioVariants = cva("", {
  variants: {
    ratio: {
      "1:1": "aspect-square",
      "2:1": "aspect-[2/1]",
      "16:9": "aspect-[16/9]",
      "4:3": "aspect-[4/3]",
      "6:7": "aspect-[6/7]",
      "4:5": "aspect-[4/5]",
      "2:3": "aspect-[2/3]",
      card: "aspect-[1.586]",
    } satisfies Record<AspectRatioValue, string>,
  },
  defaultVariants: { ratio: "4:3" },
});
