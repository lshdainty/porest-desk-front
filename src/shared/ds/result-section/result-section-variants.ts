import { cva } from "class-variance-authority";

/*
 * Groo Result Section 의 묶음 모양 — 축은 없다(크기 · 결과는 result-section.tsx 의 SIZES · KIND_COLOR). 수치 원본은
 * groo-design specs/components/result-section.yaml(값은 src/shared/ds/spec/result-section.json). 컴포넌트와 규칙은
 * result-section.tsx 머리 주석이다(컴포넌트 파일은 컴포넌트만 내보낸다 — 빠른 새로 고침).
 */

// 묶음 — 가운데 · 좌우 48 · 위아래 16. 나타날 때 150ms enter 투명도(모션 줄이기면 없음). duration-* 은 transition-duration 도
// 주므로 transition-none(묶음에는 전환이 없다)
// 카드 안은 좌우 0 — 조상 선택자([data-slot=card] .클래스, 구체성 0,2,0)라 px-x12(0,1,0)를 CSS 순서와 상관없이 이긴다.
// 목록 카드의 바로 아래 자식만 24 — [data-slot=card][data-body=list] > .클래스(0,3,0)라 위의 0 을 순서와 상관없이 이긴다.
// 목록 카드 바로 아래의 기다리는 영역(LoadingRegion — 자리만 잡는 겹)에 바로 둔 것도 24 — 실패 · 비었음(0,4,0).
// 표의 빈 줄처럼 목록 카드 안에서도 한 겹 더 들어가면(칸이 24 를 가진다) 바로 아래 자식이 아니라 0 이다(2026-10-09 사용자 결정 23B)
export const resultSectionVariants = cva(
  [
    "flex grow flex-col items-center justify-center px-x12 py-x4 text-center font-sans transition-none",
    "[[data-slot=card]_&]:px-0 [[data-slot=card][data-body=list]>&]:px-x6 [[data-slot=card][data-body=list]>[data-slot=loading-region]>&]:px-x6",
    "animate-in fade-in-0 duration-[var(--motion-duration-d3)] ease-[var(--motion-ease-enter)] motion-reduce:animate-none",
  ].join(" "),
);
