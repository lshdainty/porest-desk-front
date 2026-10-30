// 일정 상세 본문 (I-09b 6 · 1-2B) — 일정 폼 줄과 같은 차례의 List 줄. 없는 값은 줄을 두지 않고 반복은 늘 둔다.
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
    t: (k: string, o?: Record<string, unknown>) =>
      o ? `${k}:${JSON.stringify(o)}` : k,
    i18n: { language: "ko" },
  }),
}));

const { EventDetailBody } = await import("./event-detail-body");
const { i18n: appI18n } = await import("@/shared/i18n/config");

let container: HTMLDivElement;
let root: Root;

beforeEach(async () => {
  await appI18n.changeLanguage("ko");
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 9, 29, 13, 0));
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.useRealTimers();
});

const event = (over: Partial<IEvent> = {}): IEvent => ({
  id: 1,
  startDate: "2026-10-30T10:00:00",
  endDate: "2026-10-30T12:00:00",
  title: "분기 회고",
  description: "",
  color: "#b83b7a",
  isAllDay: false,
  sourceType: "calendar",
  eventType: null,
  calendarRowId: 1,
  calendarName: "내 캘린더",
  calendarColor: "#2c70bf",
  labelRowId: null,
  labelName: null,
  labelColor: null,
  location: null,
  rrule: null,
  recurrenceId: null,
  reminders: [],
  ...over,
});

const render = (e: IEvent, placement?: "sheet" | "panel") => {
  act(() => root.render(<EventDetailBody event={e} placement={placement} />));
  return container;
};
const titles = () =>
  [...container.querySelectorAll("[data-slot=list-title]")].map(
    (n) => n.textContent,
  );
const rowText = (key: string) =>
  [...container.querySelectorAll("[data-slot=list-item]")].find((r) =>
    r.textContent?.startsWith(key),
  )?.textContent;

describe("줄 차례 · 없는 값", () => {
  it("캘린더 · 시작 · 종료 · 반복만 있는 일정 — 라벨 · 알림 · 장소 · 설명 줄이 없다", () => {
    render(event());
    expect(titles()).toEqual([
      "form.calendar",
      "form.start",
      "form.end",
      "form.recurrence",
    ]);
  });

  it("값이 다 있으면 일정 폼 줄과 같은 차례로 — 캘린더 · 라벨 · 시작 · 종료 · 반복 · 알림 · 장소 · 설명", () => {
    render(
      event({
        labelRowId: 1,
        labelName: "업무",
        labelColor: "#8b4dba",
        rrule: "FREQ=WEEKLY",
        reminders: [
          {
            rowId: 1,
            eventRowId: 1,
            reminderType: "P",
            minutesBefore: 1440,
            isSent: false,
          },
          {
            rowId: 2,
            eventRowId: 1,
            reminderType: "P",
            minutesBefore: 60,
            isSent: false,
          },
        ],
        location: "본사 3층 회의실",
        description: "준비물",
      }),
    );
    expect(titles()).toEqual([
      "form.calendar",
      "form.label",
      "form.start",
      "form.end",
      "form.recurrence",
      "form.reminder",
      "form.location",
      "form.description",
    ]);
    // 알림은 짧은 차례로
    expect(rowText("form.reminder")).toContain("reminder.1hour, reminder.1day");
    expect(rowText("form.recurrence")).toContain("recurrence.weekly");
  });

  it("종일이면 시작 · 종료 대신 종일 줄 하나 — 여러 날이면 ~ 끝 날짜가 붙는다", () => {
    render(
      event({
        isAllDay: true,
        startDate: "2026-10-22T00:00:00",
        endDate: "2026-10-24T23:59:59",
      }),
    );
    expect(titles()).toEqual([
      "form.calendar",
      "form.allDay",
      "form.recurrence",
    ]);
    expect(rowText("form.allDay")).toMatch(/10월 22일.*~ 10월 24일/);
  });

  it("꺾쇠가 없다 — 보기만 하는 줄이고 누르는 버튼도 없다", () => {
    render(event({ description: "d" }));
    expect(container.querySelector("[data-slot=list-suffix] svg")).toBeNull();
    expect(container.querySelector("button")).toBeNull();
  });
});

describe("색은 줄의 점으로만", () => {
  it("캘린더 줄 점 = 캘린더 색 · 라벨 줄 점 = 라벨 색 — 일정 색 막대 · 알약 · 상자는 없다", () => {
    render(event({ labelRowId: 1, labelName: "업무", labelColor: "#8b4dba" }));
    const dots = [...container.querySelectorAll("[aria-hidden].rounded-full")];
    expect(dots).toHaveLength(2);
    expect(dots[0]!.getAttribute("style")).not.toBe(
      dots[1]!.getAttribute("style"),
    );
    // 일정 색(#b83b7a = pink)은 어디에도 칠해지지 않는다
    expect(container.innerHTML).not.toContain("--color-chart-pink");
    expect(container.innerHTML).not.toContain("b83b7a");
  });
});

describe("색 점은 첫 줄 높이", () => {
  it("캘린더 · 라벨 값의 점은 가운데가 아니라 위(첫 줄)에 맞추고, 글은 점 오른쪽 한 덩어리로 줄을 바꾼다", () => {
    render(
      event({
        calendarName: "가".repeat(29),
        labelRowId: 1,
        labelName: "라".repeat(20),
        labelColor: "#8b4dba",
      }),
    );
    const dots = [...container.querySelectorAll("[aria-hidden].rounded-full")];
    expect(dots).toHaveLength(2);
    for (const d of dots) {
      expect(d.parentElement!.className).toContain("items-start");
      expect(d.parentElement!.className).not.toContain("items-center");
      expect(d.className).toContain("mt-[calc((var(--text-t5--line-height)");
      // 글은 점 옆 span 하나 — 둘째 줄이 첫 줄 글자 시작에 맞는다
      expect(d.nextElementSibling!.tagName).toBe("SPAN");
    }
  });
});

describe("D-day 배지", () => {
  const badge = () => container.querySelector("[data-slot=badge]")!;
  it("오늘 · 1 ~ 3일 남음은 warning, 4일 이상 남음 · 지남은 neutral", () => {
    const cls = (start: string) => {
      render(event({ startDate: start, endDate: start }));
      return badge().className;
    };
    expect(cls("2026-10-29T10:00:00")).toContain("warning");
    expect(cls("2026-11-01T10:00:00")).toContain("warning");
    expect(cls("2026-11-02T10:00:00")).not.toContain("warning");
    expect(cls("2026-10-28T10:00:00")).not.toContain("warning");
    expect(badge().textContent).toContain("detail.ddayPast");
  });
});

describe("긴 값 · 설명", () => {
  it("설명은 말줄임 없이 다 보이고 줄바꿈을 그대로 둔다 — 줄 제목 글 시작에 맞춘다", () => {
    render(event({ description: "첫 줄\n둘째 줄" }));
    const d = container.querySelector("[data-slot=event-detail-description]")!;
    expect(d.textContent).toBe("첫 줄\n둘째 줄");
    expect(d.className).toContain("whitespace-pre-wrap");
    expect(d.className).toContain("pl-[58px]");
    expect(
      container.querySelector("[data-slot=list]")!.innerHTML +
        container.querySelector("[data-slot=event-detail-title]")!.outerHTML,
    ).not.toContain("truncate");
    expect(container.innerHTML).not.toContain("line-clamp");
  });

  it("긴 제목 · 캘린더 이름은 줄을 바꿔 다 보인다", () => {
    render(event({ title: "아".repeat(50), calendarName: "가".repeat(29) }));
    expect(container.textContent).toContain("아".repeat(50));
    expect(container.textContent).toContain("가".repeat(29));
    expect(
      container.querySelector("[data-slot=list]")!.innerHTML +
        container.querySelector("[data-slot=event-detail-title]")!.outerHTML,
    ).not.toContain("truncate");
  });
});

describe("자리", () => {
  it("패널은 머리 오른쪽이 20, 시트는 좌우 24", () => {
    render(event(), "panel");
    expect(
      container.querySelector("[data-slot=event-detail-head]")!.className,
    ).toContain("pr-x5");
    render(event(), "sheet");
    expect(
      container.querySelector("[data-slot=event-detail-head]")!.className,
    ).toContain("px-x6");
  });
});
