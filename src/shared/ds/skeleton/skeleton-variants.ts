/*
 * Porest Skeleton — 기다리는 영역의 시간표. 수치 원본은 porest-design specs/components/skeleton.yaml 의 region
 * (값은 src/shared/ds/spec/skeleton.json). porest-design recipes/shadcn/components/ui/skeleton.tsx 를 첫 판으로
 * 가져왔다(앱 적용 1A) — 이 파일은 시간표 상수, 기다린 시간 훅은 use-wait-phase.ts, 컴포넌트는 skeleton.tsx 다
 * (컴포넌트 파일은 컴포넌트만 내보낸다 — 빠른 새로 고침).
 */

// skeleton.yaml 의 region — 1초까지 틀만 · 5초 오래 걸림 글 · 10초 요청 제한(처음 요청부터 다시 시도까지 합쳐) ·
// 저절로 다시 시도는 읽기만 2번, 1초 · 2초 뒤(다시 해도 같은 오류인 4xx 와 쓰기는 다시 보내지 않는다)
export const LOADING_TIMING = {
  showAfter: 1000,
  slowAfter: 5000,
  timeout: 10000,
  retryDelays: [1000, 2000],
} as const;
