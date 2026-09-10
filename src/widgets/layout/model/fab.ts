/**
 * 모바일 캘린더 화면 — 하단 `+` 가 거래가 아니라 일정 폼을 연다.
 *
 * `AppLayout` 의 다른 경로 상수와 달리 여기 있는 건, 이 값이 "어느 화면이냐" 가 아니라
 * "`+` 가 무엇을 여느냐" 를 가르는 유일한 기준이기 때문이다.
 */
export const CALENDAR_PATH = "/desk/calendar";

/** `+` 가 여는 것 — 일정 폼(`event`) 또는 거래 추가 시트(`tx`). */
export type FabTarget = "event" | "tx";

/**
 * 모바일 하단 탭바의 **`+` 가 무엇을 여는가 — 동작과 이름을 한 자리에서 고른다.**
 *
 * 예전엔 동작만 화면별로 갈리고(`AppLayout` 의 `handleAdd`) 이름은 탭바 안에
 * `"거래 추가"` 로 굳어 있었다. 그래서 캘린더에서는 **일정 폼이 열리는데 낭독기는
 * "거래 추가" 라고 읽었다**(QA #159). 둘을 떼어 두면 화면이 하나 늘 때 또 갈린다 —
 * 여는 것과 부르는 이름은 같은 객체에서 나와야 한다.
 *
 * `+` 가 보이는 화면은 money 모드(가계부·자산·통계·예산)와 풀스크린 화면을 뺀
 * 나머지다 — 홈 · 캘린더 · 전체 · 검색 · 카드 상세. 그중 캘린더만 일정을 연다.
 *
 * 반환하는 `labelKey` 는 네임스페이스를 붙인 i18n 키다(`t(["layout","calendar"])`).
 */
export const fabFor = (
  pathname: string,
): { target: FabTarget; labelKey: string } =>
  pathname.startsWith(CALENDAR_PATH)
    ? { target: "event", labelKey: "calendar:addEvent" }
    : { target: "tx", labelKey: "layout:addTransaction" };
