// 일정 폼을 여는 자리 하나 (I-09 36) · 빠른 추가 (I-09 33 · 34, 사용자 결정 Q1-B)
//   · 1280 이상 + quick 이면 가운데 작은 대화상자(칸 넷 · [자세히][저장])가 먼저 뜬다 — 팝오버가 아니다
//   · "자세히" 는 쓴 값을 들고 일정 폼 대화상자로 간다
//   · 1280 미만은 빠른 추가 없이 곧바로 일정 폼 시트
//   · 저장 본문은 일정 폼과 같은 모양이다
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { __resetPointerBlockForTest } from "@/shared/lib/groo/pointer-block";
import {
  click,
  field,
  lastButton,
  setValue,
  setupFormDom,
} from "./event-form/test-utils";
import type {
  CalendarEvent,
  CalendarEventFormValues,
} from "@/entities/calendar";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

const created = vi.hoisted(() => [] as Record<string, unknown>[]);
const fail = vi.hoisted(() => ({ create: false, update: false }));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
  initReactI18next: { type: "3rdParty", init: () => {} },
}));
// 목록은 매 렌더 같은 배열이어야 한다 — 서버 상태(react-query)가 그렇다
const calendars = vi.hoisted(() => [
  {
    rowId: 1,
    ownerRowId: 1,
    ownerName: "나",
    calendarName: "업무",
    color: "#2c70bf",
    sortOrder: 1,
    isDefault: true,
    isVisible: true,
    inviteCode: null,
    isShared: false,
    isOwner: true,
    myRole: "OWNER",
    memberCount: 1,
  },
]);
vi.mock("@/features/user-calendar", () => ({
  useUserCalendars: () => ({ data: calendars }),
}));
vi.mock("@/features/event-label", () => ({
  useEventLabels: () => ({ data: [] }),
}));
vi.mock("@/widgets/calendar/model/useCalendarEvents", () => ({
  useCreateEvent: () => ({
    mutate: (v: CalendarEventFormValues) => created.push({ ...v }),
    isPending: false,
    isError: fail.create,
  }),
  useUpdateEvent: () => ({
    mutate: () => {},
    isPending: false,
    isError: fail.update,
  }),
}));

const { CalendarEventFormHost } = await import("./CalendarEventFormHost");

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  __resetPointerBlockForTest();
  created.length = 0;
  fail.create = false;
  fail.update = false;
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

let closed = 0;
const show = (quick: boolean, event?: CalendarEvent) =>
  act(() =>
    root.render(
      <CalendarEventFormHost
        selectedDate={new Date(2026, 9, 22)}
        event={event}
        quick={quick}
        onClose={() => closed++}
      />,
    ),
  );

const quickTitle = () =>
  document.querySelector<HTMLInputElement>("[data-slot=quick-add-title]");
const surface = () =>
  document
    .querySelector(
      "[data-slot=dialog-content], [data-slot=bottom-sheet-content]",
    )
    ?.getAttribute("data-slot");

describe("빠른 추가 → 자세히", () => {
  it("1280 이상 + quick 이면 빠른 추가 대화상자가 먼저 뜬다", () => {
    setupFormDom(true);
    show(true);
    expect(quickTitle()).not.toBeNull();
    expect(surface()).toBe("dialog-content");
    // 칸은 제목 · 날짜 · 종일 · 캘린더 — 장소 · 설명 칸은 없다
    expect(document.querySelector("[name=location]")).toBeNull();
  });

  it("quick 이 아니면 곧바로 일정 폼 대화상자다", () => {
    setupFormDom(true);
    show(false);
    expect(quickTitle()).toBeNull();
    expect(field("title")).toBeTruthy();
  });

  it("1280 미만은 quick 이어도 빠른 추가 없이 일정 폼 시트다", () => {
    setupFormDom(false);
    show(true);
    expect(quickTitle()).toBeNull();
    expect(surface()).toBe("bottom-sheet-content");
  });

  it("[저장] 은 일정 폼과 같은 본문을 낸다 — 종일 · 그 날 · 기본 캘린더", () => {
    setupFormDom(true);
    show(true);
    setValue(quickTitle()!, "치과");
    click(lastButton("save"));
    expect(created).toHaveLength(1);
    expect(created[0]).toMatchObject({
      title: "치과",
      isAllDay: true,
      startDate: "2026-10-22",
      endDate: "2026-10-22",
      calendarRowId: 1,
      description: null,
      location: null,
      labelRowId: null,
      rrule: null,
      reminderMinutes: [],
    });
  });

  it("제목이 비면 보내지 않고 오류를 보인다", () => {
    setupFormDom(true);
    show(true);
    click(lastButton("save"));
    expect(created).toHaveLength(0);
    expect(document.body.textContent).toContain("form.titleRequired");
  });

  it('"자세히" 는 쓴 제목을 들고 일정 폼 대화상자로 간다', () => {
    setupFormDom(true);
    show(true);
    setValue(quickTitle()!, "치과");
    click(lastButton("quickAdd.detail"));
    expect(quickTitle()).toBeNull();
    expect(field("title").value).toBe("치과");
  });
});

const saved: CalendarEvent = {
  rowId: 5,
  title: "정기 점검",
  description: null,
  eventType: "PERSONAL",
  color: "#2c70bf",
  startDate: "2026-10-22T10:00:00",
  endDate: "2026-10-22T11:00:00",
  isAllDay: false,
  labelRowId: null,
  labelName: null,
  labelColor: null,
  location: null,
  rrule: null,
  recurrenceId: null,
  isException: false,
  reminders: [],
  calendarRowId: 1,
  calendarName: "업무",
  calendarColor: "#2c70bf",
  createAt: "",
  modifyAt: "",
};

// 저장 실패(snackbar.md:75) — 폼 맨 위 critical Callout(고정 문구), 폼은 열려 있고 입력값은 그대로
describe("저장 실패", () => {
  const alertText = () =>
    document.querySelector("[role=alert]")?.textContent ?? "";

  it.each([
    ["시트", false],
    ["대화상자", true],
  ])(
    "추가가 실패하면 %s 맨 위에 Callout 이 보이고 닫히지 않고 값이 남는다",
    (_n, wide) => {
      setupFormDom(wide);
      closed = 0;
      show(false);
      setValue(field("title"), "치과");
      fail.create = true;
      show(false);
      expect(alertText()).toContain("form.saveFailed");
      expect(closed).toBe(0);
      expect(field("title").value).toBe("치과");
      // 맨 위 — 본문의 첫 자식
      const body = document.querySelector("[data-slot$=body]")!;
      expect(body.firstElementChild?.getAttribute("role")).toBe("alert");
    },
  );

  it("수정이 실패해도 같다", () => {
    setupFormDom(false);
    fail.update = true;
    show(false, saved);
    expect(alertText()).toContain("form.saveFailed");
  });

  it("빠른 추가가 실패해도 대화상자 안에 보이고 제목이 남는다", () => {
    setupFormDom(true);
    show(true);
    setValue(quickTitle()!, "치과");
    fail.create = true;
    show(true);
    expect(alertText()).toContain("form.saveFailed");
    expect(quickTitle()?.value).toBe("치과");
  });

  it("실패가 없으면 Callout 도 없다", () => {
    setupFormDom(false);
    show(false);
    expect(alertText()).toBe("");
  });
});

// 새 일정은 제목에 초점, 수정으로 열 때는 주지 않는다
describe("처음 초점", () => {
  it("새 일정(대화상자)은 제목에 초점이 간다", async () => {
    setupFormDom(true);
    show(false);
    await act(async () => {});
    expect(document.activeElement).toBe(field("title"));
  });

  // 타이머를 진행시키지 않는다 — 열림 초점(onOpenAutoFocus)이 곧바로 제목 칸에 건다
  it("새 일정(시트)도 열리는 즉시 제목에 초점이 간다", async () => {
    setupFormDom(false);
    show(false);
    await act(async () => {});
    expect(document.activeElement).toBe(field("title"));
  });

  it("다른 칸에 초점이 가 있으면 열림 초점이 덮지 않는다 — 수정은 어느 칸에도 주지 않는다", async () => {
    setupFormDom(false);
    show(false, saved);
    await act(async () => {});
    expect(document.activeElement).not.toBe(field("title"));
  });

  it("빠른 추가는 제목에 초점이 간다", async () => {
    setupFormDom(true);
    show(true);
    await act(async () => {});
    expect(document.activeElement).toBe(quickTitle());
  });

  it("수정으로 열면 제목에 초점을 주지 않는다", async () => {
    setupFormDom(true);
    show(false, saved);
    await act(async () => {});
    expect(document.activeElement).not.toBe(field("title"));
  });
});
