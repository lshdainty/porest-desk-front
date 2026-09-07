/**
 * 가계부 화면의 보기 모드(달력 / 목록) 기억.
 *
 * 새로고침하거나 다른 화면에 다녀오면 늘 달력으로 돌아갔다(QA #97).
 * URL 쿼리가 아니라 localStorage 에 둔다 — 링크로 공유할 좌표(`month`·`txId`)가 아니라
 * **이 브라우저에서 어떻게 보고 싶은지**라서다. URL 은 새로고침만 견디고, 메뉴로 나갔다
 * 돌아오면 쿼리 없는 주소라 다시 달력이 된다. 통화·금액 가림·테마와 같은 자리다.
 *
 * localStorage 는 **접근 자체가 던진다** — 사파리 프라이빗 모드, 쿠키/사이트 데이터
 * 차단이 그렇다. 읽기·쓰기를 감싸고, 못 읽으면 기본값(달력)으로 그냥 돈다.
 */
export type ViewMode = "calendar" | "list";

const STORAGE_KEY = "pd-expense-view";

/** 저장된 값이 없거나·모르는 값이거나·저장소가 막혀 있으면 달력(종전 기본값). */
export function readViewMode(): ViewMode {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "calendar" || v === "list") return v;
  } catch {
    /* 저장소가 막힌 브라우저 — 이번 세션만 기억한다 */
  }
  return "calendar";
}

export function saveViewMode(mode: ViewMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* 저장 못 해도 화면은 그대로 돌아야 한다 */
  }
}
