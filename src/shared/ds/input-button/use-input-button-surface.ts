import { useWideSurface } from "@/shared/ds/overlay";

/*
 * 고르는 자리를 무엇으로 열지 — 1280 미만 "sheet"(아래에서 올라오는 시트) · 이상 "popover"(칸 아래 8 에 붙는 팝오버).
 * 칸 크기가 바뀌는 폭(lg)과 같은 경계다(input-button.md "1280 미만은 시트, 이상은 팝오버").
 * 경계 판별은 overlay/ 의 useWideSurface 하나가 맡는다 — Responsive Dialog · Alert Dialog · Bottom Sheet 가 같은 경계를 읽어
 * 대화상자 안의 날짜 칸은 늘 팝오버로, 시트 안의 날짜 칸은 늘 시트로 열린다(dialog.md). 이 훅은 그 판별에 스펙의 이름을 붙인 것이다.
 */
export function useInputButtonSurface(): "sheet" | "popover" {
  return useWideSurface() ? "popover" : "sheet";
}
