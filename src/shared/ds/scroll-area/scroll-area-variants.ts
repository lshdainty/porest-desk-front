import { cva } from "class-variance-authority";

/*
 * Groo Scroll Area — 기본 스크롤 + 전역 스크롤바 한 벌(2026-10-10). 수치 원본은 groo-design specs/components/scroll-area.yaml
 * (값은 src/shared/ds/spec/scroll-area.json). groo-design recipes/shadcn/components/ui/scroll-area.tsx 를 첫 판으로 가져왔다 —
 * 이 파일은 변형 정의, 컴포넌트는 scroll-area.tsx 다(컴포넌트 파일은 컴포넌트만 내보낸다 — 빠른 새로 고침).
 *
 * 스크롤은 브라우저 그대로(휠 · 키보드 · 끌기 · 관성)이고 스크롤바 모양은 컴포넌트가 아니라 src/index.css 의 전역 한 벌이다
 * (6px 알약 · 막대 stroke-neutral-solid · 바탕 투명, Firefox 두 줄은 @supports not selector(::-webkit-scrollbar) 안 — 크로미움은
 * scrollbar-width · scrollbar-color 가 걸리면 webkit 6px 을 버린다). 세로 스크롤바는 숨기지 않는다 — 숨기는 것은 가로 줄뿐이다
 * (Scroll Fog row · .scrollbar-hide).
 */
export const scrollAreaVariants = cva(
  [
    "relative min-h-0 min-w-0",
    // 키보드 포커스 링 — 상자 안쪽 2px(바깥 링은 카드 · 시트에 잘린다)
    "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-stroke-focus-ring",
  ],
  {
    variants: {
      // 넘치는 방향만 스크롤 — 한쪽이 auto 면 다른 쪽 visible 은 auto 가 되므로 막는다
      orientation: {
        vertical: "overflow-x-hidden overflow-y-auto",
        horizontal: "overflow-x-auto overflow-y-hidden",
        both: "overflow-auto",
      },
      // 시트 · 대화상자 · 팝오버 안 — 끝에 닿아도 뒤 화면이 따라 스크롤되지 않는다
      contain: { true: "overscroll-contain", false: "" },
    },
    defaultVariants: { orientation: "vertical", contain: false },
  },
);
