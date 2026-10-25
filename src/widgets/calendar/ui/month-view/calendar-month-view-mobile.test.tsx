// 폰 월 격자 — 칸 하나가 누르는 자리 하나, 오늘 = 옅은 원 + 700, 이웃 달 숫자 fg-disabled, 일정 다섯 → 칩 둘 + "+3개" (I-09 9 · 10)
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
    t: (k: string, o?: { count?: number; date?: string }) =>
      o?.count != null ? `${k}:${o.count}` : k,
    i18n: { language: "ko" },
  }),
}));
vi.mock("@/widgets/calendar/model/calendar-context", () => ({
  useCalendar: () => ({ selectedDate: new Date(2026, 9, 15) }),
}));

const { CalendarMonthViewMobile } =
  await import("./calendar-month-view-mobile");

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 9, 25, 9, 0, 0));
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const event = (
  id: number,
  day: number,
  over: Partial<IEvent> = {},
): IEvent => ({
  id,
  startDate: `2026-10-${String(day).padStart(2, "0")}T10:00:00`,
  endDate: `2026-10-${String(day).padStart(2, "0")}T11:00:00`,
  title: `일정 ${id}`,
  description: "",
  color: "#2c70bf",
  isAllDay: false,
  sourceType: "calendar",
  eventType: null,
  calendarRowId: 1,
  calendarName: null,
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

const render = (events: IEvent[], onDayClick = vi.fn()) => {
  act(() =>
    root.render(
      <CalendarMonthViewMobile
        singleDayEvents={events}
        multiDayEvents={[]}
        onDayClick={onDayClick}
      />,
    ),
  );
  return onDayClick;
};
const cells = () => [
  ...container.querySelectorAll<HTMLButtonElement>("button[aria-haspopup]"),
];
const numberOf = (b: HTMLElement) =>
  b.querySelector<HTMLElement>("[data-slot=month-day-number]")!;

describe("폰 월 격자", () => {
  it("2026-10 은 5주 — 칸 35 개가 모두 누르는 자리이고 칸 높이는 103 이다", () => {
    render([]);
    expect(cells()).toHaveLength(35);
    expect(cells()[0]!.className).toContain("h-[103px]");
  });

  it('누르는 자리는 칸뿐이다 — 숫자 · 칩 · "+N개" 가 따로 Tab 에 서지 않는다', () => {
    render([1, 2, 3, 4, 5].map((i) => event(i, 22)));
    const focusables = container.querySelectorAll(
      "button, a[href], [tabindex], [role=button]",
    );
    expect(focusables).toHaveLength(35);
    expect(
      container
        .querySelectorAll("[data-slot=month-chip]")[0]!
        .getAttribute("aria-hidden"),
    ).toBe("true");
  });

  it("칸을 누르면 그 날을 알린다", () => {
    const onDay = render([]);
    const c = cells().find((b) => numberOf(b).textContent === "22")!;
    act(() => c.click());
    expect(onDay).toHaveBeenCalledTimes(1);
    expect((onDay.mock.calls[0]![0] as Date).getDate()).toBe(22);
  });

  it("오늘은 옅은 원(bg-neutral-weak) + 700, 브랜드 채움 아님", () => {
    render([]);
    const today = container.querySelector<HTMLElement>(
      "[data-today] [data-slot=month-day-number]",
    )!;
    expect(today.textContent).toBe("25");
    expect(today.className).toContain("bg-bg-neutral-weak");
    expect(today.className).toContain("font-bold");
    expect(today.className).not.toContain("bg-bg-brand");
  });

  it("이웃 달 숫자는 fg-disabled, 일요일 · 공휴일은 fg-critical, 토요일은 fg-brand", () => {
    render([]);
    const nums = cells().map(numberOf);
    expect(nums[0]!.textContent).toBe("27");
    expect(nums[0]!.className).toContain("text-fg-disabled");
    expect(nums[0]!.className).not.toContain("opacity");
    const sun = nums.find((n) => n.textContent === "4")!;
    expect(sun.className).toContain("text-fg-critical");
    const sat = nums.find((n) => n.textContent === "10")!;
    expect(sat.className).toContain("text-fg-brand");
  });

  it('22일 일정 다섯 → 칩 둘 + "+3개"', () => {
    render([1, 2, 3, 4, 5].map((i) => event(i, 22)));
    const c = cells().find((b) => numberOf(b).textContent === "22")!;
    expect(c.querySelectorAll("[data-slot=month-chip]")).toHaveLength(2);
    expect(c.querySelector("[data-slot=month-more]")!.textContent).toBe(
      "monthView.moreCount:3",
    );
  });

  it("칩 색은 chart-{색}-weak · -contrast 토큰이다", () => {
    render([event(1, 22)]);
    const chip = container.querySelector<HTMLElement>(
      "[data-slot=month-chip]",
    )!;
    expect(chip.style.background).toContain("--color-chart-blue-weak");
    expect(chip.style.color).toContain("--color-chart-blue-contrast");
  });

  it("칸 이름이 날짜와 일정 수를 말한다", () => {
    render([event(1, 22), event(2, 22)]);
    const c = cells().find((b) => numberOf(b).textContent === "22")!;
    expect(c.getAttribute("aria-label")).toContain("monthView.cellLabel:2");
  });

  it("요일 줄은 화면을 스크롤해도 고정이고 격자만 흐른다", () => {
    render([]);
    const head = container.querySelector(
      "[data-slot=calendar-month-grid] > div",
    )!;
    expect(head.className).toContain("sticky");
    expect(head.className).toContain("top-x13"); // 달 줄(52) 바로 아래
  });
});
