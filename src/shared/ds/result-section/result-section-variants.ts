import { cva } from "class-variance-authority";

/*
 * Porest Result Section 의 묶음 모양 — 축은 없다(크기 · 결과는 result-section.tsx 의 SIZES · KIND_COLOR). 수치 원본은
 * porest-design specs/components/result-section.yaml(값은 src/shared/ds/spec/result-section.json). 컴포넌트와 규칙은
 * result-section.tsx 머리 주석이다(컴포넌트 파일은 컴포넌트만 내보낸다 — 빠른 새로 고침).
 */

// 묶음 — 가운데 · 좌우 48 · 위아래 16. 나타날 때 150ms enter 투명도(모션 줄이기면 없음). duration-* 은 transition-duration 도
// 주므로 transition-none(묶음에는 전환이 없다)
export const resultSectionVariants = cva(
  [
    "flex grow flex-col items-center justify-center px-x12 py-x4 text-center font-sans transition-none",
    "animate-in fade-in-0 duration-[var(--motion-duration-d3)] ease-[var(--motion-ease-enter)] motion-reduce:animate-none",
  ].join(" "),
);
