// 일정 폼의 날짜·시각 칸에 **키보드로** 칠 때 값이 깨지지 않는다 (2026-09-28 QA).
//
// 칸은 키를 누를 때마다 글자를 그대로 넘겼고, 폼은 그걸 완성된 날짜로 믿고 시각을 이어
// 붙여 칸에 되썼다 — 전체 선택 뒤 `2026-09-30` 을 치면 시작일 `2T10:000T0`, 종료일
// `NaN-NaN-Na` 가 되고 그대로 PUT 까지 나갔다. 시작 시각을 칠 때도 미완성 값이 종료 보정에
// 들어가 종료가 NaN 이 됐다가, 다 치면 "시작 + 1시간" 으로 조용히 바뀌었다.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { __resetPointerBlockForTest } from "@/shared/lib/porest/pointer-block";
import type {
  CalendarEvent,
  CalendarEventFormValues,
} from "@/entities/calendar";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
  initReactI18next: { type: "3rdParty", init: () => {} },
}));
vi.mock("@/features/user-calendar", () => ({
  useUserCalendars: () => ({ data: [] }),
}));
vi.mock("@/shared/hooks", () => ({ useIsMobile: () => false }));

const { EventForm } = await import("./EventForm");

/** 9/10 10~11시 일정(시각 있음). */
const timed: CalendarEvent = {
  rowId: 3,
  title: "정기 점검",
  description: null,
  eventType: "PERSONAL",
  color: "#2c70bf",
  startDate: "2026-09-10T10:00:00",
  endDate: "2026-09-10T11:00:00",
  isAllDay: false,
  labelRowId: null,
  labelName: null,
  labelColor: null,
  location: null,
  rrule: null,
  recurrenceId: null,
  isException: false,
  reminders: [],
  calendarRowId: null,
  calendarName: null,
  calendarColor: null,
  createAt: "2026-09-01T00:00:00",
  modifyAt: "2026-09-01T00:00:00",
};

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  __resetPointerBlockForTest();
  if (!globalThis.ResizeObserver) {
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
  const proto = Element.prototype as unknown as Record<string, unknown>;
  proto.hasPointerCapture ??= () => false;
  proto.setPointerCapture ??= () => {};
  proto.releasePointerCapture ??= () => {};
  proto.scrollIntoView ??= () => {};
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const setter = Object.getOwnPropertyDescriptor(
  HTMLInputElement.prototype,
  "value",
)!.set!;

/** 전체 선택 뒤 치는 것과 같다 — 첫 글자가 값을 갈아 끼우고, 이후는 보이는 값 뒤에 붙는다. */
function typeInto(el: HTMLInputElement, text: string) {
  [...text].forEach((ch, i) => {
    act(() => {
      setter.call(el, i === 0 ? ch : el.value + ch);
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
  });
}

const blur = (el: HTMLElement) =>
  act(() => el.dispatchEvent(new FocusEvent("focusout", { bubbles: true })));

/** 시작일·종료일 / 시작·종료 시각 칸 — 화면 순서대로 둘씩 있다. */
const dates = () =>
  [
    ...document.body.querySelectorAll<HTMLInputElement>(
      'input[placeholder="yyyy-mm-dd"]',
    ),
  ] as [HTMLInputElement, HTMLInputElement];
const times = () =>
  [
    ...document.body.querySelectorAll<HTMLInputElement>(
      'input[placeholder="HH:MM"]',
    ),
  ] as [HTMLInputElement, HTMLInputElement];

async function submit(
  target: CalendarEvent,
  before: () => void,
): Promise<CalendarEventFormValues> {
  let sent: CalendarEventFormValues | null = null;
  act(() =>
    root.render(
      <EventForm
        event={target}
        onSubmit={(v) => {
          sent = v;
        }}
        onClose={() => {}}
      />,
    ),
  );
  before();
  const save = [...document.body.querySelectorAll("button")].find(
    (b) => b.textContent?.trim() === "save",
  );
  if (!save) throw new Error("저장 버튼을 찾지 못했다");
  await act(async () => {
    save.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  if (!sent) throw new Error("onSubmit 이 불리지 않았다");
  return sent;
}

describe("일정 폼 — 키보드로 친 날짜·시각", () => {
  it("시작일을 쳐 넣으면 그 날짜가 들어가고, 시각·종료가 깨지지 않는다", async () => {
    const sent = await submit(timed, () => {
      typeInto(dates()[0], "2026-09-30");
      expect(dates()[0].value).toBe("2026-09-30");
      expect(times()[0].value).toBe("10:00");
      // 종료(9/10 11시)가 새 시작보다 앞이라 시작 + 1시간으로 따라온다
      expect(dates()[1].value).toBe("2026-09-30");
      expect(times()[1].value).toBe("11:00");
    });
    expect(sent.startDate).toBe("2026-09-30T10:00");
    expect(sent.endDate).toBe("2026-09-30T11:00");
  });

  it("시작 시각을 쳐도 종료는 그대로다 — NaN 을 거쳐 시작 + 1시간이 되지 않는다", async () => {
    const sent = await submit(
      { ...timed, endDate: "2026-09-10T18:00:00" },
      () => {
        typeInto(times()[0], "11:30");
        expect(times()[1].value).toBe("18:00");
        expect(dates()[1].value).toBe("2026-09-10");
      },
    );
    expect(sent.startDate).toBe("2026-09-10T11:30");
    expect(sent.endDate).toBe("2026-09-10T18:00");
  });

  it("다 치지 않고 칸을 떠나면 원래 날짜로 돌아가고, 저장도 원래 값이다", async () => {
    const sent = await submit(timed, () => {
      typeInto(dates()[0], "2026-0");
      expect(dates()[0].value).toBe("2026-0");
      blur(dates()[0]);
      expect(dates()[0].value).toBe("2026-09-10");
    });
    expect(sent.startDate).toBe("2026-09-10T10:00");
    expect(sent.endDate).toBe("2026-09-10T11:00");
  });

  it("종일 일정도 — 시작일을 쳐 넣으면 종료가 따라온다", async () => {
    const sent = await submit(
      {
        ...timed,
        isAllDay: true,
        startDate: "2026-09-10T00:00:00",
        endDate: "2026-09-10T23:59:59",
      },
      () => {
        typeInto(dates()[0], "2026-09-30");
        expect(dates()[1].value).toBe("2026-09-30");
      },
    );
    expect(sent.startDate).toBe("2026-09-30");
    expect(sent.endDate).toBe("2026-09-30");
  });
});
