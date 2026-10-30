// 일정을 눌렀을 때의 화면 상태 (I-09b 15 · 16) — 칩은 그 날을 고르고 상세를 열며, 공휴일 칩은 날만 고른다. 지운 일정의 상세는 닫힌다
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { IEvent } from "@/widgets/calendar/model/interfaces";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

const mocks = vi.hoisted(() => ({
  setSelectedDate: vi.fn(),
  mutate: vi.fn(),
}));
vi.mock("@/widgets/calendar/model/calendar-context", () => ({
  useCalendar: () => ({
    selectedDate: new Date(2026, 9, 22),
    setSelectedDate: mocks.setSelectedDate,
    view: "month",
    isBuiltinSourceEnabled: () => true,
    isCalendarVisible: () => true,
  }),
}));
vi.mock("@/widgets/calendar/model/useCalendarEvents", () => ({
  useDeleteEvent: () => ({ mutate: mocks.mutate, isPending: false }),
}));

const { useCalendarScreen } = await import("./use-calendar-screen");
type Screen = ReturnType<typeof useCalendarScreen>;

let container: HTMLDivElement;
let root: Root;
let screen: Screen;
function Probe({ events }: { events: IEvent[] }) {
  screen = useCalendarScreen(events);
  return null;
}

const event = (id: number, over: Partial<IEvent> = {}): IEvent => ({
  id,
  startDate: "2026-10-16T10:00:00",
  endDate: "2026-10-16T11:00:00",
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

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  mocks.setSelectedDate.mockClear();
  mocks.mutate.mockClear();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(<Probe events={[]} />));
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe("일정 누름", () => {
  it("칩을 누르면 그 칩이 놓인 날을 고르고, 그 일정의 상세를 연다 — 연 순간 고른 날을 적어 둔다", () => {
    act(() => screen.openDetail(event(3), undefined, new Date(2026, 9, 16)));
    expect(mocks.setSelectedDate).toHaveBeenCalledTimes(1);
    expect((mocks.setSelectedDate.mock.calls[0]![0] as Date).getDate()).toBe(
      16,
    );
    expect(screen.detail).toEqual({
      ref: { id: 3, day: "2026-10-16" },
      day: "2026-10-16",
    });
  });

  it("패널 줄을 누르면 날은 그대로 두고 지금 고른 날로 상세를 연다", () => {
    act(() => screen.openDetail(event(3)));
    expect(mocks.setSelectedDate).not.toHaveBeenCalled();
    expect(screen.detail?.day).toBe("2026-10-22");
  });

  it("공휴일 칩은 날만 고른다 — 상세가 열리지 않는다", () => {
    act(() =>
      screen.openDetail(
        event(9, { sourceType: "holiday" }),
        undefined,
        new Date(2026, 9, 9),
      ),
    );
    expect(mocks.setSelectedDate).toHaveBeenCalledTimes(1);
    expect(screen.detail).toBeNull();
  });
});

describe("삭제", () => {
  it("반복 일정은 확인창이 모든 회차를 말하게 반복 표식을 든다", () => {
    act(() => screen.requestDelete(event(3, { rrule: "FREQ=WEEKLY" })));
    expect(screen.deleting).toEqual({
      id: 3,
      title: "일정 3",
      recurring: true,
    });
    act(() => screen.requestDelete(event(4)));
    expect(screen.deleting?.recurring).toBe(false);
  });

  it("지운 일정의 상세는 닫힌다 — 다른 일정의 상세는 그대로", () => {
    mocks.mutate.mockImplementation(
      (_id: number, o: { onSuccess: () => void }) => o.onSuccess(),
    );
    act(() => screen.openDetail(event(3)));
    act(() => screen.requestDelete(event(3)));
    act(() => screen.handleConfirmDelete());
    expect(screen.deleting).toBeNull();
    expect(screen.detail).toBeNull();

    act(() => screen.openDetail(event(5)));
    act(() => screen.requestDelete(event(3)));
    act(() => screen.handleConfirmDelete());
    expect(screen.detail?.ref.id).toBe(5);
  });
});
