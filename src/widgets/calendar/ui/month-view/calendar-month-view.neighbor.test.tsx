// 이웃 달 칸 — 날짜 숫자만 fg-disabled 이고 일정 · 금액 · 휴일은 이번 달과 같다(03-C 결정 5A, DESIGN State).
// 불투명도(opacity-20 · opacity-50)를 쓰지 않는다.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { IEvent } from "@/widgets/calendar/model/interfaces";
import { DragSelectContext } from "@/widgets/calendar/model/drag-select-context";

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
vi.mock("@/shared/hooks/use-mobile", () => ({ useIsMobile: () => false }));
vi.mock("@/widgets/calendar/model/calendar-context", () => ({
  useCalendar: () => ({
    selectedDate: new Date(2026, 9, 15),
    setSelectedDate: () => {},
    setView: () => {},
  }),
}));
// 일정 추가 폼을 끌고 오는 프로바이더는 통째로 갈음한다 — 여기서 볼 것은 칸이다
vi.mock("@/widgets/calendar/model/drag-select-provider", async () => {
  const { DragSelectContext: Ctx } =
    await import("@/widgets/calendar/model/drag-select-context");
  return {
    DragSelectProvider: ({ children }: { children: React.ReactNode }) => (
      <Ctx.Provider
        value={{
          isDragSelecting: false,
          selectionStart: null,
          selectionEnd: null,
          startSelection: () => {},
          updateSelection: () => {},
          endSelection: () => {},
          isDateInSelection: () => false,
        }}
      >
        {children}
      </Ctx.Provider>
    ),
  };
});
vi.mock("@/shared/lib/groo/hide-amounts-core", () => ({
  useHideAmounts: () => false,
}));

const { CalendarMonthView } = await import("./calendar-month-view");
void DragSelectContext;

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
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

const event = (over: Partial<IEvent>): IEvent => ({
  id: 1,
  startDate: "2026-09-30T00:00:00.000Z",
  endDate: "2026-09-30T23:59:59.000Z",
  title: "팀 점검",
  description: "",
  color: "#2563eb",
  isAllDay: true,
  sourceType: "calendar",
  eventType: null,
  calendarRowId: null,
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

describe("월 격자의 이웃 달 칸", () => {
  it("날짜 숫자만 fg-disabled 이고 칸 안 어디에도 opacity 클래스가 없다 — 일정 · 금액은 이번 달과 같다", () => {
    act(() =>
      root.render(
        <CalendarMonthView
          singleDayEvents={[
            event({}),
            event({
              id: 2,
              sourceType: "expense",
              title: "-12,000",
              expenseAmount: -12000,
              color: "#cc0000",
            }),
          ]}
          multiDayEvents={[]}
        />,
      ),
    );
    const numbers = [
      ...container.querySelectorAll<HTMLButtonElement>(
        "button.rounded-full.size-6",
      ),
    ];
    // 2026-10 은 목요일에 시작해 앞 4칸이 9월, 뒤 칸이 11월이다
    expect(numbers.length).toBeGreaterThanOrEqual(35);
    const neighbors = numbers.filter(
      (b) => b.style.color === "var(--color-fg-disabled)",
    );
    expect(neighbors.length).toBeGreaterThanOrEqual(4);
    expect(neighbors[0]!.textContent).toBe("27");
    // 이번 달 숫자는 fg-disabled 가 아니다
    expect(
      numbers.filter((b) => b.textContent === "15")[0]!.style.color,
    ).not.toBe("var(--color-fg-disabled)");
    // 불투명도 클래스가 한 곳에도 없다
    expect(container.querySelectorAll("[class*='opacity-']")).toHaveLength(0);
    // 이웃 달(9/30) 칸에도 일정 · 금액이 그려진다
    expect(container.textContent).toContain("팀 점검");
    expect(container.textContent).toContain("12,000");
  });
});
