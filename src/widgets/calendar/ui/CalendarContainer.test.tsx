// 그날 시트는 폰 · 데스크톱 화면 밖(Container)에서 그린다 (I-09b W5) — 폰에서 수정 중 가로로 돌려 768 이상이 되어도 시트와 쓰던 값이 사라지지 않는다.
import { act, useEffect, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

const mocks = vi.hoisted(() => ({ mobile: true, mounts: 0, unmounts: 0 }));

vi.mock("react-i18next", () => ({
  initReactI18next: { type: "3rdParty", init: () => {} },
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: "ko" } }),
}));
vi.mock("@/shared/ds/snackbar", () => ({
  useSnackbar: () => ({ show: () => {}, dismiss: () => {} }),
}));
vi.mock("@/shared/hooks", () => ({ useIsMobile: () => mocks.mobile }));
vi.mock("@/shared/ui/groo/dialogs", () => ({ ConfirmDialog: () => null }));
vi.mock("./CalendarEventFormHost", () => ({
  CalendarEventFormHost: () => null,
}));
// 화면 상태 — 그날 시트 날짜만 실제로 든다
vi.mock("@/widgets/calendar/model/use-calendar-screen", () => ({
  useCalendarScreen: () => {
    const [dayDate, setDayDate] = useState<Date | null>(null);
    return {
      editingEvent: null,
      setEditingEvent: () => {},
      deleting: null,
      setDeleting: () => {},
      creatingDate: null,
      setCreatingDate: () => {},
      deleteEvent: { isPending: false },
      handleConfirmDelete: () => {},
      dayDate,
      setDayDate,
      dayEvents: [],
      requestDelete: () => {},
    };
  },
}));
vi.mock("@/widgets/calendar/ui/CalendarMobile", () => ({
  CalendarMobile: ({
    screen,
  }: {
    screen: { setDayDate: (d: Date) => void };
  }) => (
    <button
      data-slot="open-day"
      onClick={() => screen.setDayDate(new Date(2026, 9, 22))}
    >
      mobile
    </button>
  ),
}));
vi.mock("@/widgets/calendar/ui/CalendarDesktop", () => ({
  CalendarDesktop: () => <div data-slot="desktop">desktop</div>,
}));
// 시트 — 몇 번 붙고 떨어졌는지만 센다
vi.mock("@/widgets/calendar/ui/event-detail/event-detail-surface", () => ({
  EventDetailSurface: () => {
    useEffect(() => {
      mocks.mounts++;
      return () => {
        mocks.unmounts++;
      };
    }, []);
    return <div data-slot="day-surface" />;
  },
}));

const { CalendarContainer } = await import("./CalendarContainer");

let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  mocks.mobile = true;
  mocks.mounts = 0;
  mocks.unmounts = 0;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const show = () => act(() => root.render(<CalendarContainer events={[]} />));

describe("그날 시트는 폰 화면이 사라져도 남는다 (W5)", () => {
  it("폰에서 연 시트가 768 이상으로 바뀌어도 다시 붙지 않는다 — 쓰던 값이 그대로", () => {
    show();
    act(() =>
      container
        .querySelector<HTMLButtonElement>("[data-slot=open-day]")!
        .click(),
    );
    expect(container.querySelector("[data-slot=day-surface]")).not.toBeNull();
    expect(mocks.mounts).toBe(1);
    mocks.mobile = false;
    show();
    expect(container.querySelector("[data-slot=desktop]")).not.toBeNull();
    expect(container.querySelector("[data-slot=day-surface]")).not.toBeNull();
    expect(mocks.mounts).toBe(1);
    expect(mocks.unmounts).toBe(0);
  });

  it("날을 누르기 전에는 시트가 없다", () => {
    show();
    expect(container.querySelector("[data-slot=day-surface]")).toBeNull();
  });
});
