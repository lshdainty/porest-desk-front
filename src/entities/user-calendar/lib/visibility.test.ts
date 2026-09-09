// 캘린더 보임 규칙 — 목록·필터가 같이 쓰는 자리라 여기 한 곳에 못 박는다.
//
// **기본 캘린더는 끌 수 없다.** 표시 스위치를 그 행에 렌더하지 않고 서버도 토글을 400 으로
// 막는다. 그래도 이 규칙이 `isDefault` 를 보는 건 예전에 꺼 둔 값이 남아 있을 수 있어서다 —
// 캘린더를 안 고르고 저장하면 서버가 기본 캘린더를 넣는데, 그게 숨겨져 있으면 방금 만든
// 일정이 곧바로 안 보인다. 그 경계를 규칙으로 없앤다.
import { describe, expect, it } from "vitest";
import { isCalendarShown } from "./visibility";
import type { UserCalendar } from "../model/types";

const calendar = (over: Partial<UserCalendar> = {}): UserCalendar => ({
  rowId: 1,
  ownerRowId: 1,
  ownerName: "나",
  calendarName: "업무",
  color: "#2c70bf",
  sortOrder: 1,
  isDefault: false,
  isVisible: true,
  inviteCode: null,
  isShared: false,
  isOwner: true,
  myRole: "OWNER",
  memberCount: 1,
  ...over,
});

describe("캘린더 보임 규칙", () => {
  it("켜 둔 캘린더는 보인다", () => {
    expect(isCalendarShown(calendar({ isVisible: true }))).toBe(true);
  });

  it("끈 캘린더는 안 보인다", () => {
    expect(isCalendarShown(calendar({ isVisible: false }))).toBe(false);
  });

  it("기본 캘린더는 꺼진 값이 남아 있어도 보인다", () => {
    expect(
      isCalendarShown(calendar({ isDefault: true, isVisible: false })),
    ).toBe(true);
  });

  it("isVisible 이 비어 있으면 보이는 것으로 친다", () => {
    const unknown = {
      ...calendar(),
      isVisible: undefined,
    } as unknown as UserCalendar;
    expect(isCalendarShown(unknown)).toBe(true);
  });

  it("못 찾은 캘린더도 보이는 것으로 친다", () => {
    expect(isCalendarShown(undefined)).toBe(true);
  });
});
