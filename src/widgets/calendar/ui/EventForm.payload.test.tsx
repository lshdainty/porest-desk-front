// 일정 편집이 **무엇을 보내는가** 를 고정한다 (QA #109 · #112).
//
// 이 화면의 저장 본문은 규칙 하나로 만든다 —
// **화면이 가진 칸은 지금 상태를 싣고, 비었으면 `null`.**
// 수정(PUT)은 세 갈래이므로(`Patch`: 키 없음=유지 · `null`=지움 · 값=교체, QA #96)
// 비운 칸을 `undefined` 로 빼면 서버가 "안 고쳤다" 로 읽어 옛 값이 그대로 남는다.
//
// 알림만 계약이 다르다 — 목록을 통째로 바꾸는 칸이라
// **미전달=미변경 · `[]`=전부 해제 · 리스트=교체**(`CalendarEventServiceImpl.syncReminders`).
//
// 반대편도 잠근다 — 채워 둔 값은 그대로 나가야 한다. 안 그러면 "일정은 늘 null 을
// 보낸다" 같은 잘못된 수정이 통과한다.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { __resetPointerBlockForTest } from "@/shared/lib/porest/pointer-block";
import type {
  CalendarEvent,
  CalendarEventFormValues,
} from "@/entities/calendar";
import type { EventLabel } from "@/entities/event-label";

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

/** 알림 15분·1일 전이 걸린 일정. 널 허용 칸은 전부 비어 있다. */
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

const labels: EventLabel[] = [
  { rowId: 9, userRowId: 1, labelName: "출장", color: "#2c70bf", sortOrder: 0 },
];

/** 널 허용 칸이 전부 차 있는 일정 — 하나씩 비워 지워지는지 본다. */
const filled: CalendarEvent = {
  ...event,
  description: "분기 점검 항목 확인",
  location: "본사 3층",
  rrule: "FREQ=WEEKLY",
  labelRowId: 9,
  labelName: "출장",
  labelColor: "#2c70bf",
  reminders: [],
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
  // radix Select 가 포인터 캡처·스크롤을 만진다 — jsdom 에 없는 것만 채운다.
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

/** 라벨 문구로 그 칸의 블록을 집는다 — `t` 는 키를 그대로 돌려주게 mock 해 뒀다. */
function block(labelKey: string): HTMLElement {
  const label = [...document.body.querySelectorAll("label")].find((el) =>
    el.textContent?.includes(labelKey),
  );
  if (!label?.parentElement) throw new Error(`${labelKey} 블록을 찾지 못했다`);
  return label.parentElement;
}

/** 그 블록의 토글 묶음 — 화면에 토글이 여럿이라 `data-state` 만으로는 못 가른다. */
const toggles = (labelKey: string) => [
  ...block(labelKey).querySelectorAll("button"),
];

/** 켜져 있는 것 — radix 는 선택 상태를 `data-state="on"` 으로 표시한다. */
const onToggles = (labelKey: string) =>
  toggles(labelKey).filter((b) => b.dataset.state === "on");

const click = (el: HTMLElement) =>
  act(() => el.dispatchEvent(new MouseEvent("click", { bubbles: true })));

/**
 * 입력칸을 비운다. React 는 값 변화를 자체 트래커로 보므로 `.value = ""` 만으로는
 * `onChange` 가 안 뜬다 — 네이티브 setter 로 넣고 `input` 을 쏜다.
 */
function clear(name: "description" | "location") {
  const el = document.body.querySelector<HTMLElement>(`[name="${name}"]`);
  if (!el) throw new Error(`${name} 입력칸을 찾지 못했다`);
  const proto =
    el instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value")!.set!;
  act(() => {
    setter.call(el, "");
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

/**
 * radix Select 에서 항목을 고른다. 트리거는 포인터로도 열리지만 jsdom 에선
 * 키보드가 확실하다 — 라디스가 `PointerEvent` 를 기대하기 때문이다.
 */
function pick(labelKey: string, optionText: string) {
  const trigger =
    block(labelKey).querySelector<HTMLElement>("[role='combobox']");
  if (!trigger) throw new Error(`${labelKey} 선택칸을 찾지 못했다`);
  act(() =>
    trigger.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, key: " " }),
    ),
  );
  const option = [...document.body.querySelectorAll("[role='option']")].find(
    (o) => o.textContent?.includes(optionText),
  );
  if (!option) throw new Error(`${optionText} 항목을 찾지 못했다`);
  click(option as HTMLElement);
}

async function submit(
  target: CalendarEvent,
  before?: () => void,
): Promise<CalendarEventFormValues> {
  let sent: CalendarEventFormValues | null = null;
  act(() =>
    root.render(
      <EventForm
        event={target}
        labels={labels}
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
    const sent = await submit(event, () => {
      const on = onToggles("form.reminder");
      expect(on).toHaveLength(2); // 15분 · 1일
      for (const el of on) click(el);
      expect(onToggles("form.reminder")).toHaveLength(0);
    });
    expect(sent.reminderMinutes).toEqual([]);
  });

  it("고른 알림은 그대로 나간다", async () => {
    const sent = await submit(event);
    expect(sent.reminderMinutes).toEqual([15, 1440]);
  });
});

// desk-back #325 가 이 칸들을 `Optional` 로 옮겼다 — 그전엔 서버가 무조건 덮어써
// **우연히** 지워졌는데, 이제 안 보낸 칸은 유지다. 웹이 `|| undefined` 로 키째 빼는
// 바람에 비우고 저장해도 안 지워졌다.
describe("비운 칸은 지워진다 (QA #112)", () => {
  it("설명을 비우면 null 이 나간다 — 키를 빼면 옛 설명이 남는다", async () => {
    const sent = await submit(filled, () => clear("description"));
    expect(sent).toHaveProperty("description", null);
  });

  it("장소를 비우면 null 이 나간다 — 키를 빼면 옛 장소가 남는다", async () => {
    const sent = await submit(filled, () => clear("location"));
    expect(sent).toHaveProperty("location", null);
  });

  it("'반복 안 함' 을 고르면 null 이 나간다 — 키를 빼면 반복이 안 풀린다", async () => {
    const sent = await submit(filled, () => {
      expect(onToggles("form.recurrence")[0]?.textContent).toContain(
        "recurrence.weekly",
      );
      const none = toggles("form.recurrence").find((b) =>
        b.textContent?.includes("recurrence.none"),
      )!;
      click(none);
    });
    expect(sent).toHaveProperty("rrule", null);
  });

  it("'라벨 없음' 을 고르면 null 이 나간다 — 키를 빼면 옛 라벨이 붙어 있다", async () => {
    const sent = await submit(filled, () => pick("form.label", "noLabels"));
    expect(sent).toHaveProperty("labelRowId", null);
  });

  it("라벨이 없던 일정도 null 을 싣는다 — 키를 빼면 계약이 갈린다", async () => {
    const sent = await submit(event);
    expect(sent).toHaveProperty("labelRowId", null);
  });
});

describe("채워 둔 값은 그대로 나간다", () => {
  it("손대지 않은 설명·장소·반복·라벨은 값 그대로다", async () => {
    const sent = await submit(filled);
    expect(sent).toMatchObject({
      description: "분기 점검 항목 확인",
      location: "본사 3층",
      rrule: "FREQ=WEEKLY",
      labelRowId: 9,
    });
  });

  it("색은 늘 지금 값이 나간다 — 비울 칸이 없어 지울 일도 없다", async () => {
    const sent = await submit(filled);
    expect(sent.color).toBe("#2c70bf");
  });
});

// 이 칸만 서버가 `Optional` 이 아니다 — 맨 `Long` 이라 "null 이면 안 옮긴다" 로 읽는다
// (`CalendarEventServiceImpl.updateEvent`). 키를 빼든 null 을 싣든 결과가 같고,
// 화면에도 '캘린더 없음' 이 없어 비울 수가 없다. 그래서 미전달 그대로 둔다.
describe("캘린더는 미전달 그대로다", () => {
  it("고를 캘린더가 없으면 값을 지어내지 않는다", async () => {
    const sent = await submit(filled);
    expect(sent.calendarRowId).toBeUndefined();
  });
});
