/**
 * 단계의 첫 칸에 초점을 준다(I-17 7 "초점은 2단계 첫 칸") — 열릴 때 · 단계가 바뀔 때.
 * 첫 칸은 글 입력 · 고르기 단추(Select · Input Button) · 라디오 중 문서에서 가장 앞에 있는 것이다.
 * 고르기 단추는 초점만 받고 열리지 않는다.
 */
const FIRST_FIELD =
  "input:not([type=hidden]):not([readonly]):not([disabled]), button[role=combobox]:not([disabled]), button[aria-haspopup]:not([disabled]), [role=radio][data-state=checked], [role=radio]";

export function focusFirstField(root: HTMLElement | null | undefined) {
  root?.querySelector<HTMLElement>(FIRST_FIELD)?.focus({ preventScroll: true });
}
