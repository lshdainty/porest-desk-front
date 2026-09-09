// 캘린더 소스 드롭다운 — **기본 캘린더 행엔 표시 스위치를 두지 않는다.**
//
// 기본 캘린더는 서버가 자동으로 대입하는 자리다. 그걸 숨길 수 있게 두면 "숨긴 캘린더는
// 일정 만들기 목록에서 뺀다" 와 맞물려, 전부 숨긴 사용자가 저장한 일정이 곧바로 사라진다.
// 서버도 이 캘린더의 표시 토글을 400 으로 막으므로 스위치를 남기면 누르는 순간 에러만 난다.
// 그래서 회색으로 잠그지 않고 **아예 렌더하지 않는다** — 누를 수 없는 컨트롤은 "왜 안 되지"
// 를 만든다.
//
// 실제 번역 번들을 태운다 — `기본` 표와 `{{count}}개` 보간이 여기서 보려는 것이라
// `t` 를 흉내 내면 정작 검사하려던 게 사라진다.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18next from "i18next";
import { I18nextProvider, initReactI18next } from "react-i18next";
import koCalendar from "@/locales/ko/calendar.json";
import { BUILTIN_SOURCES } from "@/widgets/calendar/model/types";
import {
  CalendarContext,
  type CalendarContextValue,
} from "@/widgets/calendar/model/calendar-context";
import type { UserCalendar } from "@/entities/user-calendar";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

const mocks = vi.hoisted(() => ({ toggle: vi.fn(), mobile: false }));

vi.mock("react-router-dom", () => ({ useNavigate: () => () => {} }));
vi.mock("@/shared/hooks", () => ({ useIsMobile: () => mocks.mobile }));
// Popover·Drawer 는 열기 전엔 내용을 DOM 에 두지 않는다 — 여기서 볼 건 그 안의 행이라
// 통째로 편다. 껍데기(트리거·헤더)는 그대로 지나가게 둬야 개수 표시도 같이 잡힌다.
const passthrough = ({ children }: { children?: React.ReactNode }) => (
  <>{children}</>
);
vi.mock("@/shared/ui/popover", () => ({
  Popover: passthrough,
  PopoverTrigger: passthrough,
  PopoverContent: passthrough,
}));
vi.mock("@/shared/ui/drawer", () => ({
  Drawer: passthrough,
  DrawerTrigger: passthrough,
  DrawerContent: passthrough,
  DrawerHeader: passthrough,
  DrawerTitle: passthrough,
  DrawerBody: passthrough,
  DrawerClose: passthrough,
}));

const { CalendarSourceToggle } = await import("./calendar-source-toggle");

const i18n = i18next.createInstance();
await i18n.use(initReactI18next).init({
  lng: "ko",
  fallbackLng: "ko",
  ns: ["calendar"],
  defaultNS: "calendar",
  resources: { ko: { calendar: koCalendar } },
  interpolation: { escapeValue: false },
});

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

let container: HTMLDivElement;
let root: Root;

const render = (calendars: UserCalendar[], { mobile = false } = {}) => {
  mocks.mobile = mobile;
  const value = {
    selectedDate: new Date("2026-09-09T00:00:00"),
    setSelectedDate: () => {},
    view: "month",
    setView: () => {},
    badgeVariant: "dot",
    setBadgeVariant: () => {},
    workingHours: { start: 9, end: 18 },
    setWorkingHours: () => {},
    visibleHours: { start: 0, end: 24 },
    setVisibleHours: () => {},
    events: [],
    setLocalEvents: () => {},
    // 기본값 그대로 — 공휴일만 켜져 있다(가계부·할 일은 꺼져 있고 목록에도 안 나온다).
    builtinSources: BUILTIN_SOURCES,
    toggleBuiltinSource: () => {},
    isBuiltinSourceEnabled: () => false,
    userCalendars: calendars,
    isCalendarVisible: () => true,
    toggleCalendarVisibility: mocks.toggle,
    pendingCalendarIds: new Set<number>(),
  } as unknown as CalendarContextValue;

  return act(() =>
    root.render(
      <I18nextProvider i18n={i18n}>
        <CalendarContext.Provider value={value}>
          <CalendarSourceToggle />
        </CalendarContext.Provider>
      </I18nextProvider>,
    ),
  );
};

/** 캘린더 행 — 누를 수 있는 행(button)이든 아니든 같은 자리에 있다. */
const rowOf = (name: string) =>
  Array.from(container.querySelectorAll<HTMLElement>('[class*="py-1.5"]')).find(
    (el) => (el.textContent ?? "").includes(name),
  );

/** 그 캘린더를 누를 수 있는 자리 — 없으면 undefined. */
const rowButton = (name: string) =>
  Array.from(container.querySelectorAll("button")).find((b) =>
    (b.textContent ?? "").includes(name),
  );

const click = (el: Element) =>
  act(() => {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });

const WORK = calendar(1, "업무", { isDefault: true });
const PRIVATE = calendar(3, "개인");

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  mocks.toggle.mockClear();
  mocks.mobile = false;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe("기본 캘린더 행", () => {
  it("표시 스위치가 없다 — 누를 수 있는 자리 자체를 두지 않는다", () => {
    render([WORK, PRIVATE]);
    expect(rowOf("업무")).toBeTruthy();
    expect(rowButton("업무")).toBeUndefined();
  });

  it("행을 눌러도 표시 토글이 나가지 않는다", () => {
    render([WORK, PRIVATE]);
    click(rowOf("업무")!);
    expect(mocks.toggle).not.toHaveBeenCalled();
  });

  it("`기본` 표를 달아 왜 다른 행인지 그 자리에서 읽히게 한다", () => {
    render([WORK, PRIVATE]);
    expect(rowOf("업무")!.textContent).toContain("기본");
  });
});

describe("일반 캘린더 행", () => {
  it("표시 스위치가 그대로 있다", () => {
    render([WORK, PRIVATE]);
    expect(rowButton("개인")).toBeTruthy();
  });

  it("누르면 그 캘린더의 표시 토글이 나간다", () => {
    render([WORK, PRIVATE]);
    click(rowButton("개인")!);
    expect(mocks.toggle).toHaveBeenCalledWith(3);
  });
});

describe("기본 캘린더는 늘 보이는 것으로 친다", () => {
  // 예전에 꺼 둔 값이 남아 있을 수 있다 — 그때도 목록·필터는 켜진 것으로 읽어야 한다.
  const HIDDEN_DEFAULT = calendar(1, "업무", {
    isDefault: true,
    isVisible: false,
  });

  it("꺼진 값이 남아 있어도 행이 흐려지지 않는다", () => {
    render([HIDDEN_DEFAULT, PRIVATE]);
    expect(rowOf("업무")!.className).not.toContain("opacity-50");
  });

  // 보이는 소스 개수는 모바일 트리거에만 나온다(데스크톱 트리거는 이름만 띄운다).
  it("보이는 소스 수에 들어간다", () => {
    render([HIDDEN_DEFAULT, PRIVATE], { mobile: true });
    // 캘린더 2 + 공휴일 1.
    expect(container.textContent).toContain("3개");
  });

  it("끈 일반 캘린더는 그대로 빠진다", () => {
    render([HIDDEN_DEFAULT, calendar(3, "개인", { isVisible: false })], {
      mobile: true,
    });
    // 캘린더 1(기본만) + 공휴일 1.
    expect(container.textContent).toContain("2개");
    expect(rowOf("개인")!.className).toContain("opacity-50");
  });
});
