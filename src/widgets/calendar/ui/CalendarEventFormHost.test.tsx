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
import type { CalendarEventFormValues } from "@/entities/calendar";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

const created = vi.hoisted(() => [] as Record<string, unknown>[]);

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
  }),
  useUpdateEvent: () => ({ mutate: () => {}, isPending: false }),
}));

const { CalendarEventFormHost } = await import("./CalendarEventFormHost");

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  __resetPointerBlockForTest();
  created.length = 0;
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

const show = (quick: boolean) =>
  act(() =>
    root.render(
      <CalendarEventFormHost
        selectedDate={new Date(2026, 9, 22)}
        quick={quick}
        onClose={() => {}}
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
