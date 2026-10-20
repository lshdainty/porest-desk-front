import type { KeyboardEvent } from "react";

/**
 * 이 keydown 을 "Enter 로 저장" 으로 볼 것인가.
 *
 * 내역 추가 시트는 `<form>` 이 아니라 Enter 를 눌러도 아무 일이 없었다(QA #132).
 * 회원가입·할 일 빠른 추가는 Enter 로 저장돼 같은 앱 안에서 기대가 갈렸다.
 * 브라우저의 암묵적 제출(implicit submission)을 흉내 내되, `<form>` 이 공짜로 주던
 * **거르기**를 여기서 손으로 한다.
 *
 * 거르는 것:
 * - **조합 중인 Enter.** 한글을 치다 누르는 첫 Enter 는 글자를 확정하는 키다. 크롬·
 *   사파리는 그때 `key` 를 `"Process"` 로 주고(아래 Enter 검사에서 걸린다), 파이어폭스는
 *   `"Enter"` 에 `isComposing: true` 를 준다. 이걸 안 거르면 "스타벅스" 를 확정하려던
 *   Enter 가 거래를 저장한다.
 * - **여러 줄 칸·버튼.** `<textarea>` 의 Enter 는 줄바꿈이고 버튼의 Enter 는 그 버튼을
 *   누르는 키다. `<input>` 중에서도 체크박스·파일처럼 글을 치는 칸이 아닌 것은 뺀다.
 * - **포털 안에서 온 키.** 중첩 대화상자·셀렉트·달력은 React 트리로만 이어져 있어
 *   이벤트가 여기까지 올라오는데, DOM 으로는 우리 밖이다. 그 안의 검색 칸에서 Enter 로
 *   항목을 고르는 순간 시트까지 저장되면 안 된다 — `contains` 로 가른다.
 * - **이미 처리된 키**(`defaultPrevented`)와 조합키(Shift·Ctrl·Alt·Meta).
 *
 * **연타 가드는 이 함수가 아니라 저장 쪽에 있어야 한다.** 빠른 추가가 Enter 연타로 같은
 * 할 일을 여러 건 만든 게 #122 다 — 여기서 참을 돌려주더라도 호출부의 저장 함수는
 * "이미 나가 있으면 무시" 를 자기 안에 들고 있어야 한다.
 */
export function isEnterSave(e: KeyboardEvent<HTMLElement>): boolean {
  if (e.key !== "Enter") return false;
  if (e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) return false;
  if (e.defaultPrevented) return false;
  if (e.nativeEvent.isComposing) return false;
  const target = e.target;
  if (!(target instanceof HTMLInputElement)) return false;
  if (NON_TEXT_INPUT_TYPES.has(target.type)) return false;
  if (target.disabled || target.readOnly) return false;
  return e.currentTarget.contains(target);
}

/** 글을 치는 칸이 아닌 `<input>` — Enter 가 이미 다른 뜻을 가진 자리다. */
const NON_TEXT_INPUT_TYPES = new Set([
  "button",
  "checkbox",
  "file",
  "image",
  "radio",
  "reset",
  "submit",
]);
