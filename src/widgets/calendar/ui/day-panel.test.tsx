// 그날 패널 · 그날 목록 카드 (I-09 16 · 17)
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
    t: (k: string, o?: { count?: number }) =>
      o?.count != null ? `${k}:${o.count}` : k,
    i18n: { language: "ko" },
  }),
}));

const { DayPanel } = await import("./day-panel");
const { i18n: appI18n } = await import("@/shared/i18n/config");

let container: HTMLDivElement;
let root: Root;

beforeEach(async () => {
  await appI18n.changeLanguage("ko");
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 9, 22, 9, 0, 0));
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.useRealTimers();
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

const render = (
  events: IEvent[],
  loading = false,
  date = new Date(2026, 9, 22),
) => {
  const fns = { onAdd: vi.fn(), onTapEvent: vi.fn() };
  act(() =>
    root.render(
      <DayPanel date={date} events={events} loading={loading} {...fns} />,
    ),
  );
  return fns;
};

describe("그날 패널", () => {
  it('머리 날 · 오늘이면 "오늘" · 일정 수 · "추가"', () => {
    render([event(1), event(2)]);
    const panel = container.querySelector("[data-slot=day-panel]")!;
    expect(panel.querySelector("h2")!.textContent).toContain("10월 22일 (목)");
    expect(panel.querySelector("h2")!.textContent).toContain("panel.today");
    expect(panel.textContent).toContain("panel.count:2");
  });

  it('오늘이 아니면 "오늘" 표시가 없다', () => {
    render([], false, new Date(2026, 9, 23));
    expect(container.querySelector("h2")!.textContent).not.toContain(
      "panel.today",
    );
  });

  it('"추가" 를 누르면 그 날로 폼을 연다', () => {
    const fns = render([]);
    const add = [...container.querySelectorAll("button")].find(
      (b) => b.textContent === "add",
    )!;
    act(() => add.click());
    expect(fns.onAdd).toHaveBeenCalledTimes(1);
  });

  it("빈 날은 해요체 한 줄 안내 · 줄 목록이 없다", () => {
    render([]);
    expect(
      container.querySelector("[data-slot=day-panel-empty]")!.textContent,
    ).toBe("noEvents");
    expect(container.querySelector("[data-slot=list-item]")).toBeNull();
  });

  it("일정 줄을 누르면 상세로 간다 · 공휴일 줄은 보기만 한다", () => {
    const fns = render([
      event(1, { sourceType: "holiday", title: "한글날", isAllDay: true }),
      event(2),
    ]);
    const rows = container.querySelectorAll("[data-slot=list-item]");
    expect(rows).toHaveLength(2);
    expect(rows[0]!.querySelector("button")).toBeNull();
    act(() => rows[1]!.querySelector<HTMLButtonElement>("button")!.click());
    expect(fns.onTapEvent).toHaveBeenCalledTimes(1);
  });

  it("불러오는 중에는 줄 자리만 스켈레톤이다(머리는 그대로)", () => {
    render([], true);
    expect(container.querySelector("h2")).not.toBeNull();
    expect(container.querySelector("[data-slot=day-panel-empty]")).toBeNull();
  });
});
