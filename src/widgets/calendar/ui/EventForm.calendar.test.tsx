// 일정 만들기·편집의 **캘린더 선택 목록**을 고정한다.
//
// 캘린더 목록에서 끈(숨긴) 캘린더는 "지금 안 본다" 는 뜻이라 새 일정을 넣을 자리가 아니다 —
// 그래서 고르는 목록에서 뺀다. 목록만 거르고 **기본 선택**을 그대로 두면 기본 캘린더가
// 숨겨져 있을 때 목록에 없는 값이 선택돼 있는 상태가 되므로 두 자리를 같이 잠근다.
//
// **예외가 하나 있다.** 편집 중인 일정이 이미 숨긴 캘린더에 있으면 그 캘린더 하나는 남긴다.
// 안 그러면 그 일정을 여는 순간 선택칸이 비고, 사용자가 캘린더를 건드리지도 않았는데
// 저장 때 다른 캘린더로 옮겨질 길이 열린다 — 안 건드린 값이 조용히 바뀌는 게 제일 나쁘다.
//
// 보임 판정은 `calendar-provider` 의 `isCalendarVisible` 과 **같은 규칙**이다(못 찾으면 보임).
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { __resetPointerBlockForTest } from "@/shared/lib/porest/pointer-block";
import type {
  CalendarEvent,
  CalendarEventFormValues,
} from "@/entities/calendar";
import type { UserCalendar } from "@/entities/user-calendar";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

// `vi.mock` 은 import 위로 끌어올려진다 — 훅이 매 렌더 읽어 갈 상자를 같이 끌어올린다.
const mocks = vi.hoisted(() => ({ calendars: [] as UserCalendar[] }));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
  initReactI18next: { type: "3rdParty", init: () => {} },
}));
vi.mock("@/features/user-calendar", () => ({
  useUserCalendars: () => ({ data: mocks.calendars }),
}));
vi.mock("@/shared/hooks", () => ({ useIsMobile: () => false }));

const { EventForm } = await import("./EventForm");

const calendar = (
  rowId: number,
  calendarName: string,
  over: Partial<UserCalendar> = {},
): UserCalendar => ({
  rowId,
  ownerRowId: 1,
  ownerName: "나",
  calendarName,
  color: "#2c70bf",
  sortOrder: rowId,
  isDefault: false,
  isVisible: true,
  inviteCode: null,
  isShared: false,
  isOwner: true,
  myRole: "OWNER",
  memberCount: 1,
  ...over,
});

const WORK = calendar(1, "업무", { isDefault: true });
const HIDDEN = calendar(2, "숨긴캘린더", { isVisible: false });
const PRIVATE = calendar(3, "개인");

/** 숨긴 캘린더(2번)에 든 일정. */
const eventInHidden: CalendarEvent = {
  rowId: 7,
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
  calendarRowId: 2,
  calendarName: "숨긴캘린더",
  calendarColor: "#2c70bf",
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
  // radix Select 가 포인터 캡처·스크롤을 만진다 — jsdom 에 없는 것만 채운다.
  const proto = Element.prototype as unknown as Record<string, unknown>;
  proto.hasPointerCapture ??= () => false;
  proto.setPointerCapture ??= () => {};
  proto.releasePointerCapture ??= () => {};
  proto.scrollIntoView ??= () => {};
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  mocks.calendars = [];
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

/** 라벨 문구로 그 칸의 블록을 집는다 — `t` 는 키를 그대로 돌려주게 mock 해 뒀다. */
function block(labelKey: string): HTMLElement | null {
  const label = [...document.body.querySelectorAll("label")].find((el) =>
    el.textContent?.includes(labelKey),
  );
  return label?.parentElement ?? null;
}

function calendarBlock(): HTMLElement {
  const el = block("form.calendar");
  if (!el) throw new Error("캘린더 칸이 화면에 없다");
  return el;
}

/** 트리거에 보이는 글자 = 지금 선택된 캘린더. */
const triggerText = () =>
  calendarBlock()
    .querySelector<HTMLElement>("[role='combobox']")
    ?.textContent?.trim() ?? "";

/**
 * 캘린더 선택칸을 열고 항목을 읽는다. 트리거는 포인터로도 열리지만 jsdom 에선
 * 키보드가 확실하다 — 라디스가 `PointerEvent` 를 기대하기 때문이다.
 */
function openCalendarOptions(): HTMLElement[] {
  const trigger =
    calendarBlock().querySelector<HTMLElement>("[role='combobox']");
  if (!trigger) throw new Error("캘린더 선택칸을 찾지 못했다");
  act(() =>
    trigger.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, key: " " }),
    ),
  );
  return [...document.body.querySelectorAll<HTMLElement>("[role='option']")];
}

const optionTexts = () => openCalendarOptions().map((o) => o.textContent ?? "");

/** 열린 목록에서 체크된 항목 — radix 는 선택을 `data-state="checked"` 로 표시한다. */
const checkedOptionText = () =>
  openCalendarOptions().find((o) => o.dataset.state === "checked")
    ?.textContent ?? null;

/** 제목은 필수라 저장이 안 나간다 — 네이티브 setter 로 넣고 `input` 을 쏜다. */
function typeTitle(value: string) {
  const el = document.body.querySelector<HTMLInputElement>(`[name="title"]`);
  if (!el) throw new Error("제목 입력칸을 찾지 못했다");
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value",
  )!.set!;
  act(() => {
    setter.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

let sent: CalendarEventFormValues | null;

function render(event: CalendarEvent | null) {
  sent = null;
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
}

async function save(): Promise<CalendarEventFormValues> {
  const btn = [...document.body.querySelectorAll("button")].find(
    (b) => b.textContent?.trim() === "save",
  );
  if (!btn) throw new Error("저장 버튼을 찾지 못했다");
  // react-hook-form 의 handleSubmit 은 비동기다 — 넘어가면 페이로드가 아직 없다.
  await act(async () => {
    btn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  if (!sent) throw new Error("onSubmit 이 불리지 않았다");
  return sent;
}

describe("새로 만들 때 — 숨긴 캘린더는 목록에 없다", () => {
  it("숨긴 캘린더가 고를 목록에서 빠진다", () => {
    mocks.calendars = [WORK, HIDDEN, PRIVATE];
    render(null);
    const texts = optionTexts();
    expect(texts).toHaveLength(2);
    expect(texts.join("|")).toContain("업무");
    expect(texts.join("|")).toContain("개인");
    expect(texts.join("|")).not.toContain("숨긴캘린더");
  });

  // 기본 캘린더가 없으면 목록 맨 앞이 잡힌다 — 그 자리가 숨긴 캘린더면 새 일정이 거기로 간다.
  it("맨 앞이 숨긴 캘린더여도 저장 본문엔 보이는 것이 실린다", async () => {
    mocks.calendars = [HIDDEN, PRIVATE];
    render(null);
    typeTitle("새 일정");
    expect((await save()).calendarRowId).toBe(3);
  });
});

describe("편집할 때 — 그 일정이 든 숨긴 캘린더 하나는 남는다", () => {
  it("숨긴 캘린더의 일정을 열면 그 캘린더가 목록에 남고 선택돼 있다", () => {
    mocks.calendars = [WORK, HIDDEN, PRIVATE];
    render(eventInHidden);
    const texts = optionTexts();
    // 남는 건 딱 그 하나 — 다른 숨긴 캘린더까지 돌아오면 거른 의미가 없다.
    expect(texts).toHaveLength(3);
    expect(texts.join("|")).toContain("숨긴캘린더");
    expect(checkedOptionText()).toContain("숨긴캘린더");
    expect(triggerText()).toContain("숨긴캘린더");
  });

  it("캘린더 칸을 건드리지 않고 저장하면 그 캘린더 그대로 나간다", async () => {
    mocks.calendars = [WORK, HIDDEN, PRIVATE];
    render(eventInHidden);
    expect((await save()).calendarRowId).toBe(2);
  });

  it("예외는 그 일정의 캘린더 하나뿐 — 다른 숨긴 캘린더는 그대로 빠진다", () => {
    const otherHidden = calendar(4, "다른숨김", { isVisible: false });
    mocks.calendars = [WORK, HIDDEN, PRIVATE, otherHidden];
    render(eventInHidden);
    expect(optionTexts().join("|")).not.toContain("다른숨김");
  });
});

describe("기본 선택도 보이는 것 중에서 고른다", () => {
  it("기본 캘린더가 숨겨져 있으면 보이는 캘린더가 잡힌다", () => {
    mocks.calendars = [
      calendar(1, "업무", { isDefault: true, isVisible: false }),
      PRIVATE,
    ];
    render(null);
    expect(triggerText()).toContain("개인");
    expect(checkedOptionText()).toContain("개인");
  });

  it("숨긴 기본 캘린더는 저장 본문에도 안 실린다", async () => {
    mocks.calendars = [
      calendar(1, "업무", { isDefault: true, isVisible: false }),
      PRIVATE,
    ];
    render(null);
    typeTitle("새 일정");
    expect((await save()).calendarRowId).toBe(3);
  });
});

describe("경계", () => {
  // `calendar-provider.tsx` 의 `isCalendarVisible` 과 같은 규칙 — 값이 없으면 보임이다.
  it("isVisible 이 비어 있으면 보이는 것으로 친다", () => {
    const unknown = {
      ...calendar(5, "값없음"),
      isVisible: undefined,
    } as unknown as UserCalendar;
    mocks.calendars = [unknown];
    render(null);
    expect(optionTexts().join("|")).toContain("값없음");
  });

  // 이미 있던 계약과 같은 자리다 — 고를 게 없으면 값을 지어내지 않는다.
  it("전부 숨기면 캘린더 칸 자체가 안 나온다", () => {
    mocks.calendars = [calendar(1, "업무", { isVisible: false })];
    render(null);
    expect(block("form.calendar")).toBeNull();
  });
});
