// 일정 편집이 **알림을 어떻게 보내는가** 를 고정한다 (QA #109).
//
// 알림은 목록을 통째로 바꾸는 칸이라 계약이 다른 칸과 다르다 —
// **미전달=미변경 · `[]`=전부 해제 · 리스트=교체**(`CalendarEventServiceImpl.syncReminders`).
// 종전엔 0 개일 때 키를 빼서, 알림을 전부 끄고 저장해도 옛 알림이 그대로 울렸다.
// 화면은 다 끈 것처럼 닫히고서.
//
// 반대편도 잠근다 — 고른 알림은 그대로 나가야 한다. 안 그러면 "알림은 늘 빈 배열"
// 같은 잘못된 수정이 통과한다.
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

/** 알림 15분·1일 전이 걸린 일정. */
const event: CalendarEvent = {
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
  reminders: [
    {
      rowId: 1,
      eventRowId: 3,
      reminderType: "PUSH",
      minutesBefore: 15,
      isSent: false,
    },
    {
      rowId: 2,
      eventRowId: 3,
      reminderType: "PUSH",
      minutesBefore: 1440,
      isSent: false,
    },
  ],
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
  // 모달이 닫히면 그 뒤 POINTER_BLOCK_MS 동안 클릭이 삼켜진다(오클릭 방어) — 케이스끼리 옮지 않게 푼다.
  __resetPointerBlockForTest();
  // jsdom 엔 ResizeObserver 가 없다 — radix ToggleGroup(roving focus)이 이걸 부른다.
  if (!globalThis.ResizeObserver) {
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

/**
 * 알림 토글 묶음 — 화면엔 반복 토글도 있어서 `data-state` 만으로는 못 가른다.
 * 라벨(`form.reminder`)이 든 블록으로 좁힌다.
 */
function reminderToggles(): HTMLButtonElement[] {
  const label = [...document.body.querySelectorAll("label")].find((el) =>
    el.textContent?.includes("form.reminder"),
  );
  if (!label?.parentElement) throw new Error("알림 블록을 찾지 못했다");
  return [...label.parentElement.querySelectorAll("button")];
}

/** 그중 켜져 있는 것 — radix 는 선택 상태를 `data-state="on"` 으로 표시한다. */
const onToggles = () =>
  reminderToggles().filter((b) => b.dataset.state === "on");

const click = (el: HTMLElement) =>
  act(() => el.dispatchEvent(new MouseEvent("click", { bubbles: true })));

async function submit(before?: () => void): Promise<CalendarEventFormValues> {
  let sent: CalendarEventFormValues | null = null;
  act(() =>
    root.render(
      <EventForm
        event={event}
        onSubmit={(v) => {
          sent = v;
        }}
        onClose={() => {}}
      />,
    ),
  );
  before?.();
  const save = [...document.body.querySelectorAll("button")].find(
    (b) => b.textContent?.trim() === "save",
  );
  if (!save) throw new Error("저장 버튼을 찾지 못했다");
  // react-hook-form 의 handleSubmit 은 비동기다 — 넘어가면 페이로드가 아직 없다.
  await act(async () => {
    save.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  if (!sent) throw new Error("onSubmit 이 불리지 않았다");
  return sent;
}

describe("알림 (QA #109)", () => {
  it("전부 끄면 빈 배열이 나간다 — 키를 빼면 옛 알림이 남는다", async () => {
    const sent = await submit(() => {
      const on = onToggles();
      expect(on).toHaveLength(2); // 15분 · 1일
      for (const el of on) click(el);
      expect(onToggles()).toHaveLength(0);
    });
    expect(sent.reminderMinutes).toEqual([]);
  });

  it("고른 알림은 그대로 나간다", async () => {
    const sent = await submit();
    expect(sent.reminderMinutes).toEqual([15, 1440]);
  });
});
