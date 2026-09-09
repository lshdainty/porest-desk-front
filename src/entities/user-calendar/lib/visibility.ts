import type { UserCalendar } from "../model/types";

/**
 * 이 캘린더를 화면에 보여 주는가 — 목록·필터가 함께 쓰는 **한 가지 규칙**이다.
 *
 * **기본 캘린더는 늘 보인다.** 그 행엔 표시 스위치를 렌더하지 않고 서버도 기본 캘린더
 * 토글을 400 으로 막는다. 그런데도 여기서 `isDefault` 를 보는 건 예전에 꺼 둔 값이
 * 데이터에 남아 있을 수 있어서다 — 일정을 만들 때 캘린더를 안 고르면 서버가 기본
 * 캘린더를 대신 넣는데, 그게 숨겨져 있으면 방금 저장한 일정이 곧바로 안 보인다.
 *
 * 못 찾은 캘린더는 보이는 것으로 친다(`?? true`). 목록에 없는 캘린더를 가리키는 일정을
 * 통째로 숨기면 사라진 것처럼 보이기 때문이다.
 */
export const isCalendarShown = (cal: UserCalendar | undefined): boolean =>
  cal?.isDefault === true || (cal?.isVisible ?? true);
