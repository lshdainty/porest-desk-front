// 그날 시트 (I-09 11) — 바닥 "일정 추가", 줄 사이 선 · 꺾쇠 없음, 공휴일 줄은 누르지 못함, 빈 날은 해요체 한 줄
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { IEvent } from "@/widgets/calendar/model/interfaces";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

vi.mock("react-i18next", () => ({
  initReactI18next: { type: "3rdParty", init: () => {} },
  useTranslation: () => ({
    t: (k: string) => k,
    i18n: { language: "ko" },
  }),
}));

const { DayEventsDialog } = await import("./DayEventsDialog");
const { i18n: appI18n } = await import("@/shared/i18n/config");

let container: HTMLDivElement;
let root: Root;

beforeEach(async () => {
  await appI18n.changeLanguage("ko");
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(async () => {
  act(() => root.unmount());
  container.remove();
  document.body.removeAttribute("style");
  await new Promise((r) => setTimeout(r, 50));
});

const event = (id: number, over: Partial<IEvent> = {}): IEvent => ({
  id,
  startDate: "2026-10-22T10:00:00",
  endDate: "2026-10-22T11:00:00",
  title: `일정 ${id}`,
  description: "",
  color: "#2c70bf",
  isAllDay: false,
  sourceType: "calendar",
  eventType: null,
  calendarRowId: 1,
  calendarName: "내 캘린더",
  calendarColor: null,
  labelRowId: null,
  labelName: null,
  labelColor: null,
  location: null,
  rrule: null,
  recurrenceId: null,
  reminders: [],
  ...over,
});

const render = (events: IEvent[], over: Record<string, () => void> = {}) => {
  const fns = {
    onClose: vi.fn(),
    onAdd: vi.fn(),
    onTapEvent: vi.fn(),
    ...over,
  };
  act(() =>
    root.render(
      <DayEventsDialog date={new Date(2026, 9, 22)} events={events} {...fns} />,
    ),
  );
  return fns;
};
const sheet = () =>
  document.querySelector<HTMLElement>("[data-slot=bottom-sheet-content]")!;

describe("그날 시트", () => {
  it('제목은 "M월 d일 (요)", 오늘이어도 "· 오늘" 을 붙이지 않는다', () => {
    render([event(1)]);
    const title = sheet().querySelector("[data-slot=bottom-sheet-title]")!;
    expect(title.textContent).toBe("10월 22일 (목)");
  });

  it('바닥의 "일정 추가" 버튼이 폼을 연다 — 머리 아래 "N건" · [+] 줄은 없다', () => {
    const fns = render([event(1)]);
    const add = [...sheet().querySelectorAll("button")].find(
      (b) => b.textContent === "addEvent",
    )!;
    expect(add.closest("[data-slot=bottom-sheet-footer]")).not.toBeNull();
    act(() => add.click());
    expect(fns.onAdd).toHaveBeenCalledTimes(1);
    expect(sheet().textContent).not.toContain("dayEvents.count");
  });

  it("줄 사이 선도 꺾쇠도 없다", () => {
    render([event(1), event(2), event(3)]);
    expect(sheet().querySelector("[data-slot=list-divider]")).toBeNull();
    expect(sheet().innerHTML).not.toContain("border-t");
    expect(sheet().querySelector("[data-slot=list-suffix] svg")).toBeNull();
  });

  it("공휴일 줄은 보기만 하고 일정 줄은 누르면 상세로 간다", () => {
    const fns = render([
      event(1, { sourceType: "holiday", title: "한글날", isAllDay: true }),
      event(2),
    ]);
    const rows = [...sheet().querySelectorAll("[data-slot=list-item]")];
    expect(rows).toHaveLength(2);
    // 공휴일이 먼저, 보기만 하는 줄(누르는 버튼 없음)
    expect(rows[0]!.textContent).toContain("한글날");
    expect(rows[0]!.querySelector("button")).toBeNull();
    act(() => rows[1]!.querySelector<HTMLButtonElement>("button")!.click());
    expect(fns.onTapEvent).toHaveBeenCalledTimes(1);
  });

  it("줄 목록은 시트 본문 좌우 여백(24)을 넘어 화면 끝까지 닿는 상자에 담긴다", () => {
    render([event(1)]);
    expect(
      sheet().querySelector("[data-slot=day-sheet-list]")!.className,
    ).toContain("-mx-x6");
  });

  it("긴 제목 · 설명은 줄을 바꿔 다 보인다(말줄임 없음)", () => {
    render([event(1, { title: "아".repeat(50) })]);
    expect(sheet().innerHTML).not.toContain("truncate");
    expect(sheet().textContent).toContain("아".repeat(50));
  });

  it("일정 없는 날은 본문에 한 줄 안내, 바닥 버튼은 그대로", () => {
    render([]);
    expect(
      sheet().querySelector("[data-slot=day-sheet-empty]")!.textContent,
    ).toBe("noEvents");
    expect(
      sheet().querySelector("[data-slot=bottom-sheet-footer]"),
    ).not.toBeNull();
  });
});
