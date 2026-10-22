/*
 * Floating Action Button 의 클래스 — 컴포넌트 파일은 컴포넌트만 내보낸다(빠른 새로 고침).
 * 값의 원본은 groo-design specs/components/floating-action-button.yaml(src/shared/ds/spec/floating-action-button.json).
 * 20 은 화면 끝 · 아래에서의 거리(토큰 spacing-x5 와 같다 — 안전 영역을 더하는 식이라 calc 안에 숫자로 적는다).
 */
export const ROOT = [
  "fixed z-(--z-sticky) flex size-[56px] cursor-pointer items-center justify-center rounded-full border-0 p-0",
  // 오른쪽 아래 — 화면 끝 · 아래 끝(또는 바닥 고정 요소 위 끝)에서 20 + 안전 영역
  "right-[calc(20px+env(safe-area-inset-right))] bottom-[calc(20px+env(safe-area-inset-bottom)+var(--fab-offset-bottom,0px))]",
  "bg-bg-brand-solid text-static-white shadow-[var(--shadow-s3)]",
  "[&>svg]:size-[24px] [&>svg]:shrink-0 [&>svg]:[stroke-width:2.5]",
  "[transition:background-color_var(--motion-duration-color-transition)_var(--motion-ease-easing),scale_var(--motion-duration-pressed-scale)_var(--motion-ease-pressed-scale)]",
  "hover:bg-bg-brand-solid-pressed active:bg-bg-brand-solid-pressed",
  "active:[scale:calc(1-2/56)] motion-reduce:active:[scale:1]",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focus-ring",
].join(" ");
