// 넓은 화면 할 일(TodoDesktop) — 실제 화면을 띄운 채로 I-10 24 ~ 32 를 잠근다.
// 번역은 CSV 원본에서 읽고(사용자가 읽는 글로 본다), 고정한 오늘 + 데이터의 날짜도 함께 고정한다.
// matchMedia 로 폭을 가른다 — 1280 이상(wide) 은 작은 달력 + 두 칸, 미만은 원장 카드 한 칸.
import { readFileSync } from "node:fs";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Todo, TodoPriority, TodoStatus } from "@/entities/todo";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

function koCopy(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of readFileSync("i18n/translations.csv", "utf-8").split(
    "\n",
  )) {
    const cells: string[] = [];
    let cur = "";
    let quoted = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (quoted && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else quoted = !quoted;
      } else if (c === "," && !quoted) {
        cells.push(cur);
        cur = "";
      } else cur += c;
    }
    cells.push(cur);
    const [ns, key, ko] = cells;
    if ((ns === "todo" || ns === "common") && key)
      out[`${ns}:${key}`] = ko ?? "";
  }
  return out;
}
const COPY = koCopy();

vi.mock("react-i18next", () => ({
  useTranslation: (ns?: string) => ({
    t: (k: string, opts?: Record<string, unknown>) => {
      const raw = COPY[`${ns ?? "common"}:${k}`];
      if (raw == null) return k;
      return raw.replace(/\{\{(\w+)\}\}/g, (_m, name: string) =>
        String(opts?.[name] ?? ""),
      );
    },
    i18n: { language: "ko" },
  }),
  initReactI18next: { type: "3rdParty", init: () => {} },
}));
vi.mock("@/features/constellation", () => ({
  constellationColorVar: () => "var(--color-chart-blue)",
  constellationName: () => "오리온자리",
}));
vi.mock("@/widgets/constellation", () => ({ NightSkyHero: () => null }));

const { TodoDesktop } = await import("./TodoDesktop");
const { i18n } = await import("@/shared/i18n/config");

const st = vi.hoisted(() => ({ wide: true, tall: false }));

const SKY_TODAY = {
  constellation: { colorKey: "blue" },
  points: 3,
  goal: 5,
  collected: false,
  streak: 4,
} as never;

const todo = (
  rowId: number,
  title: string,
  o: {
    dueDate?: string | null;
    priority?: TodoPriority;
    status?: TodoStatus;
    category?: string | null;
    content?: string | null;
  } = {},
): Todo => ({
  rowId,
  title,
  content: o.content ?? null,
  priority: o.priority ?? "MEDIUM",
  category: o.category === undefined ? null : o.category,
  status: o.status ?? "PENDING",
  type: "TASK",
  isPinned: false,
  dueDate: o.dueDate === undefined ? "2026-10-22" : o.dueDate,
  completedAt: null,
  sortOrder: rowId,
  parentRowId: null,
  tags: [],
  subtaskCount: 0,
  subtaskCompletedCount: 0,
  createAt: "2026-10-01T00:00:00",
  modifyAt: "2026-10-01T00:00:00",
});

const LONG_TAG = "장기프로젝트자료모으기정";
const LONG_TITLE =
  "아주 긴 할 일 제목이 한 줄에 다 들어가지 않을 때 줄이 바뀌고 잘리지 않는지 보려고 길게 적은 제목입니다 — 말줄임 없음";

let list: Todo[] = [];
let container: HTMLDivElement;
let root: Root;
const calls = {
  toggle: [] as number[],
  open: [] as number[],
  add: 0,
  retry: 0,
  scrolled: [] as string[],
};

beforeEach(async () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  await i18n.changeLanguage("ko");
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-22T12:00:00"));
  st.wide = true;
  st.tall = false;
  list = [
    todo(1, "오늘 보통", { priority: "MEDIUM", category: "업무" }),
    todo(2, "오늘 끝냄", { status: "COMPLETED", priority: "HIGH" }),
    todo(3, "오늘 중요", { priority: "HIGH", content: "메모가 있어요" }),
    todo(4, LONG_TITLE, { dueDate: "2026-10-21", category: LONG_TAG }),
    todo(5, "지난 마감", { dueDate: "2026-10-18", priority: "LOW" }),
    todo(6, "마감 없음", { dueDate: null, category: "공부" }),
    todo(7, "내일 공부", { dueDate: "2026-10-23", category: "공부" }),
    todo(8, "다음 달", { dueDate: "2026-11-02", category: "업무" }),
    todo(9, "끝낸 일 업무", {
      dueDate: "2026-10-20",
      status: "COMPLETED",
      category: "업무",
    }),
  ];
  calls.toggle = [];
  calls.open = [];
  calls.add = 0;
  calls.retry = 0;
  calls.scrolled = [];
  if (!globalThis.ResizeObserver) {
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
  window.matchMedia = ((query: string) => ({
    matches: query.includes("min-width: 1280px") ? st.wide : false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
  Element.prototype.scrollIntoView = function (this: Element) {
    calls.scrolled.push(this.getAttribute("data-ledger-day") ?? "?");
  };
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  document.body.innerHTML = "";
  vi.useRealTimers();
});

type Props = Partial<Parameters<typeof TodoDesktop>[0]>;
const render = (p: Props = {}) =>
  act(() =>
    root.render(
      <TodoDesktop
        todos={list}
        tagNames={["업무", LONG_TAG, "공부"]}
        tagColors={new Map([["업무", "#2c70bf"]])}
        today="2026-10-22"
        holdIds={new Set()}
        loading={false}
        failed={false}
        onRetry={() => (calls.retry += 1)}
        onToggle={(t) => calls.toggle.push(t.rowId)}
        onOpen={(t) => calls.open.push(t.rowId)}
        onAdd={() => (calls.add += 1)}
        strip={<div data-slot="forest-strip" />}
        sky={[]}
        constellationToday={SKY_TODAY}
        doneToday={1}
        openNightSky={() => {}}
        openReport={() => {}}
        {...p}
      />,
    ),
  );
const buttons = () =>
  Array.from(document.body.querySelectorAll<HTMLElement>("button"));
const byName = (name: string) =>
  buttons().find(
    (b) => (b.getAttribute("aria-label") ?? b.textContent) === name,
  );
const click = (el: HTMLElement | undefined) => {
  expect(el, "누를 단추가 있다").toBeTruthy();
  act(() => el!.click());
};
const titles = () =>
  Array.from(
    container.querySelectorAll<HTMLElement>("[data-slot=list-title]"),
  ).map((e) => e.textContent);
const dayButton = (ds: string) =>
  container.querySelector<HTMLElement>(`button[data-day="${ds}"]`)!;

describe("틀 (I-10 24 ~ 26)", () => {
  it("탭 · 개수 · 옛 두 칸 격자가 없다 — 이번 주는 달력이, 완료는 거르기가 맡는다", () => {
    render();

    expect(container.querySelector("[role=tablist]")).toBeNull();
    expect(container.querySelector("[role=tab]")).toBeNull();
    for (const old of ["오늘", "이번 주", "전체", "태그별 분포"])
      expect(buttons().map((b) => b.textContent)).not.toContain(old);
    expect(container.innerHTML).not.toContain("1.4fr");
  });

  it("1280 이상은 336 + 나머지 두 칸 · 미만은 한 칸, 본문 폭은 720 → 1040 가운데", () => {
    render();
    const twoCols = '[data-slot=todo-desktop] [class*="grid-cols-[336px"]';
    expect(container.querySelector(twoCols)).toBeTruthy();
    const frame = container.querySelector<HTMLElement>(
      "[data-slot=todo-desktop] > div",
    )!;
    expect(frame.className).toContain("max-w-[var(--layout-max-low)]");
    expect(frame.className).toContain("lg:max-w-[var(--layout-max-medium)]");
    expect(frame.className).toContain("mx-auto");

    st.wide = false;
    render();
    expect(container.querySelector(twoCols)).toBeNull();
    expect(
      container.querySelector("[data-slot=todo-ledger-card]"),
    ).toBeTruthy();
    expect(
      container.querySelector("[data-slot=todo-mini-calendar]"),
    ).toBeNull();
  });

  it("왼쪽 칸은 화면에 다 들어오면 붙고, 화면보다 길면 붙지 않는다", () => {
    render();
    const left = container.querySelector<HTMLElement>("[data-slot=todo-left]")!;
    expect(left.className).toContain("sticky");

    // 칸 높이가 스크롤 칸보다 크면 붙이지 않는다
    act(() => root.unmount());
    root = createRoot(container);
    const original = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      "offsetHeight",
    );
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
      configurable: true,
      get: () => 5000,
    });
    try {
      render();
      expect(
        container.querySelector<HTMLElement>("[data-slot=todo-left]")!
          .className,
      ).not.toContain("sticky");
    } finally {
      if (original)
        Object.defineProperty(HTMLElement.prototype, "offsetHeight", original);
    }
  });

  it("제목 줄 — h1 하나 · 설명 · [할 일 추가] 는 neutralOutline small 이고 누르면 추가", () => {
    render();

    expect(container.querySelectorAll("h1")).toHaveLength(1);
    expect(container.querySelector("h1")!.textContent).toBe("할 일");
    const add = byName("할 일 추가")!;
    expect(add.className).toContain("h-9");
    expect(add.closest(".page__head .right")).toBeTruthy();
    click(add);
    expect(calls.add).toBe(1);
  });
});

describe("작은 달력 (I-10 27)", () => {
  it("6주 42칸 — 앞뒤 달 칸은 누르지 못하고, 남은 수는 숫자만(그 달 전체)", () => {
    render();
    const cal = container.querySelector("[data-slot=todo-mini-calendar]")!;

    // 이번 달 31칸만 버튼이다
    expect(cal.querySelectorAll("button[data-day]")).toHaveLength(31 + 0);
    expect(cal.querySelectorAll("[data-slot=todo-cell-mark]")).toHaveLength(42);
    // 오늘 22: 남은 3건(오늘 보통 · 오늘 중요 …) — 끝낸 것은 센 값에서 빠진다
    const mark = dayButton("2026-10-22").querySelector(
      "[data-slot=todo-cell-mark]",
    )!;
    expect(mark.textContent).toBe("2");
    expect(mark.hasAttribute("aria-hidden")).toBe(true);
    expect(mark.className).toContain("text-fg-brand");
    // 오는 날 23 — 남은 1, 오늘 밖이라 brand 가 아니다
    const tomorrow = dayButton("2026-10-23").querySelector(
      "[data-slot=todo-cell-mark]",
    )!;
    expect(tomorrow.textContent).toBe("1");
    expect(tomorrow.className).toContain("text-fg-neutral-subtle");
  });

  it("날 이름이 뜻을 읽는다 — 표시는 장식", () => {
    render();

    expect(dayButton("2026-10-22").getAttribute("aria-label")).toBe(
      "10월 22일, 남은 할 일 2개",
    );
    expect(dayButton("2026-10-20").getAttribute("aria-label")).toBe(
      "10월 20일, 다 끝냄",
    );
    expect(dayButton("2026-10-05").getAttribute("aria-label")).toBe("10월 5일");
  });

  it("오는 날은 불투명도로 흐리지 않고 fg-neutral-subtle 이다", () => {
    render();
    const num = dayButton("2026-10-28").firstElementChild as HTMLElement;

    expect(num.className).toContain("text-fg-neutral-subtle");
    expect(num.className).not.toMatch(/opacity/);
  });

  it("날을 누르면 목록이 그 날 묶음으로 옮긴다 — 할 일이 없는 날은 아무 일도 없다", () => {
    render();
    click(dayButton("2026-10-23"));
    expect(calls.scrolled).toEqual(["2026-10-23"]);

    click(dayButton("2026-10-05"));
    expect(calls.scrolled).toEqual(["2026-10-23"]);
  });

  it("범례 한 줄 — 숫자 · ★ · 구름과 날을 누르면 목록이 그 날로", () => {
    render();

    expect(
      container.querySelector("[data-slot=todo-mini-calendar] p")!.textContent,
    ).toBe(
      "숫자 = 남은 할 일 · ★ 수집 · 구름 = 놓친 날 — 날을 누르면 목록이 그 날로",
    );
  });

  it("달 이동은 목록의 달도 함께 바꾼다 — 남은 할 일 카드는 달과 상관없다", () => {
    render();
    const remain = () =>
      container.querySelector("[data-slot=todo-remain-card]")!.textContent;
    const before = remain();
    expect(titles()).toContain("오늘 보통");
    expect(titles()).not.toContain("다음 달");

    click(byName("다음 달"));
    expect(
      container.querySelector("[data-slot=todo-mini-calendar]")!.textContent,
    ).toContain("2026년 11월");
    expect(titles()).toContain("다음 달");
    expect(titles()).not.toContain("오늘 보통");
    // 마감일 없는 묶음은 달과 무관하게 따라온다
    expect(titles()).toContain("마감 없음");
    expect(remain()).toBe(before);
  });

  it("거르기가 걸려도 달력 표시는 그 달 전체를 센다", () => {
    render();
    const name = () => dayButton("2026-10-22").getAttribute("aria-label");
    expect(name()).toBe("10월 22일, 남은 할 일 2개");

    click(byName("우선순위"));
    const pop = document.querySelector("[data-slot=popover-content]")!;
    click(
      Array.from(pop.querySelectorAll<HTMLElement>("[role=checkbox]")).find(
        (c) => c.textContent === "여유",
      ),
    );
    click(byName("완료"));
    // 목록은 여유만 — 오늘 묶음이 사라졌지만 달력은 그대로
    expect(titles()).not.toContain("오늘 보통");
    expect(name()).toBe("10월 22일, 남은 할 일 2개");
  });

  it("불러오는 중에는 칸 표시 자리가 Skeleton 이다(안정된 화면과 틀은 같다)", () => {
    render({ loading: true });

    expect(
      container.querySelector(
        "[data-slot=todo-mini-calendar] [data-slot=skeleton]",
      ),
    ).toBeTruthy();
    expect(container.querySelector("[aria-busy=true]")).toBeTruthy();
  });
});

describe("태블릿 원장 카드 (I-10 28)", () => {
  beforeEach(() => {
    st.wide = false;
  });

  it("달 이동 → 오늘 할 일 + [밤하늘] → 별빛 한 줄 → 주 달력 — 거르기 단추는 없다", () => {
    render();
    const card = container.querySelector("[data-slot=todo-ledger-card]")!;

    expect(card.textContent).toContain("2026년 10월");
    expect(card.textContent).toContain("오늘 할 일 2개");
    expect(card.textContent).toContain(
      "별빛 3/5 · 2개 더 모으면 오리온자리 수집",
    );
    expect(byName("밤하늘")).toBeTruthy();
    expect(byName("필터")).toBeUndefined();
    expect(byName("필터, 조건 걸림")).toBeUndefined();
  });

  it("접힌 주는 오늘이 든 주 한 줄 — 펼치면 6주, 이름은 '월 달력' + aria-expanded", () => {
    render();
    const days = () =>
      container.querySelectorAll(
        "[data-slot=todo-ledger-card] button[data-day]",
      );
    expect(days()).toHaveLength(7); // 22 가 든 주(일 18 ~ 토 24)
    const expand = byName("월 달력")!;
    expect(expand.getAttribute("aria-expanded")).toBe("false");

    click(expand);
    expect(byName("월 달력")!.getAttribute("aria-expanded")).toBe("true");
    expect(days()).toHaveLength(31);
  });

  it("[밤하늘] 과 월 달력은 하나만 펼친다", () => {
    render();
    click(byName("월 달력"));
    expect(byName("월 달력")!.getAttribute("aria-expanded")).toBe("true");

    click(byName("밤하늘"));
    expect(byName("밤하늘")!.getAttribute("aria-expanded")).toBe("true");
    expect(byName("월 달력")!.getAttribute("aria-expanded")).toBe("false");

    click(byName("월 달력"));
    expect(byName("밤하늘")!.getAttribute("aria-expanded")).toBe("false");
  });

  it("날 숫자 원은 36 이상이고 오는 날은 subtle · 오늘은 채움, 날을 누르면 목록이 그 날로", () => {
    render();
    const today = dayButton("2026-10-22").firstElementChild as HTMLElement;
    expect(today.className).toContain("min-h-x9");
    expect(today.className).toContain("min-w-x9");
    expect(today.className).toContain("bg-bg-brand-solid");
    const future = dayButton("2026-10-23").firstElementChild as HTMLElement;
    expect(future.className).toContain("text-fg-neutral-subtle");
    // 폰과 같이 "건" 이 붙는다
    expect(
      dayButton("2026-10-23").querySelector("[data-slot=todo-cell-mark]")!
        .textContent,
    ).toBe("1건");

    click(dayButton("2026-10-23"));
    expect(calls.scrolled).toEqual(["2026-10-23"]);
  });
});

describe("목록 카드 (I-10 29)", () => {
  it("머리 없는 목록 카드 — 묶음 머리는 h2 + 오른쪽 '2/5 완료', 줄 사이 선 · 밀기 · ⋮ 없음", () => {
    render();
    const card = container.querySelector("[data-slot=todo-list-card]")!;
    const heads = Array.from(
      card.querySelectorAll<HTMLElement>("[data-slot=list-header]"),
    );

    expect(card.querySelector("[data-slot=card-header]")).toBeNull();
    expect(
      heads.map((h) =>
        h.querySelector("h2")?.textContent?.replace(/\u00a0/g, " "),
      ),
    ).toEqual([
      "10월 18일 (일)",
      "10월 20일 (화)",
      "10월 21일 (수) · 어제",
      "10월 22일 (목) · 오늘",
      "10월 23일 (금) · 내일",
      "마감일 없음",
    ]);
    const today = heads[3]!;
    expect(today.textContent).toContain("1/3 완료");
    expect(card.querySelector("[data-slot=swipe-actions-row]")).toBeNull();
    expect(card.querySelector('[aria-label*="더보기"]')).toBeNull();
    expect(card.querySelector("[data-slot=list-divider]")).toBeNull();
    // 마감일 없는 묶음은 맨 아래
    expect(heads[heads.length - 1]!.textContent).toContain("마감일 없음");
  });

  it("묶음 안은 남은 일(중요 → 여유) 위 · 끝낸 일 아래", () => {
    render();
    const group = container.querySelector('[data-ledger-day="2026-10-22"]')!;

    expect(
      Array.from(group.querySelectorAll("[data-slot=list-title]")).map(
        (e) => e.textContent,
      ),
    ).toEqual(["오늘 중요", "오늘 보통", "오늘 끝냄"]);
  });

  it("긴 제목은 말줄임 없이 줄이 바뀐다 — 줄을 누르면 상세", () => {
    render();
    const title = Array.from(
      container.querySelectorAll<HTMLElement>("[data-slot=list-title]"),
    ).find((e) => e.textContent === LONG_TITLE)!;
    expect(title.className).not.toContain("truncate");
    expect(getComputedStyle(title).textOverflow).not.toBe("ellipsis");

    click(
      title
        .closest<HTMLElement>("[data-slot=list-item]")!
        .querySelector("button[data-slot=list-body]") as HTMLElement,
    );
    expect(calls.open).toEqual([4]);
  });

  it("이 달 0건 · 걸러서 0건 · 실패는 카드 안 Result Section — 글이 가리키는 버튼이 실제로 있다", () => {
    render({ todos: [] });
    const section = () =>
      container.querySelector(
        "[data-slot=todo-list-card] [data-slot=result-section]",
      )!;
    expect(section().textContent).toContain("10월 할 일이 없어요");
    const desc = COPY["todo:tdm.emptyMonthDescWide"]!;
    expect(section().textContent).toContain(desc);
    // 글이 부르는 이름('할 일 추가')의 버튼이 같은 화면에 있다
    expect(buttons().some((b) => desc.includes(b.textContent ?? "~"))).toBe(
      true,
    );

    render({ failed: true });
    expect(section().textContent).toContain("할 일을 불러오지 못했어요");
    click(byName("다시 시도"));
    expect(calls.retry).toBe(1);
  });

  it("거르기로 0건이면 funnel 글이고 버튼이 없다", () => {
    render({ todos: [todo(1, "하나", { priority: "LOW" })] });
    click(byName("우선순위"));
    const pop = document.querySelector("[data-slot=popover-content]")!;
    click(
      Array.from(pop.querySelectorAll<HTMLElement>("[role=checkbox]")).find(
        (c) => c.textContent === "중요",
      ),
    );
    click(byName("완료"));

    const section = container.querySelector(
      "[data-slot=todo-list-card] [data-slot=result-section]",
    )!;
    expect(section.textContent).toContain("조건에 맞는 할 일이 없어요");
    expect(section.querySelector("button")).toBeNull();
  });

  it("달 이동은 스크롤 칸을 맨 위로 돌리고 초점은 누른 단추에 남는다", () => {
    const main = document.createElement("main");
    main.id = "main";
    const scrollTo = vi.fn();
    main.scrollTo = scrollTo as never;
    document.body.appendChild(main);
    render();
    const next = byName("다음 달")!;
    next.focus();
    click(next);

    expect(scrollTo).toHaveBeenCalledWith({ top: 0 });
    expect(document.activeElement).toBe(byName("다음 달"));
  });
});

describe("거르기 칩 줄 (I-10 30)", () => {
  const bar = () =>
    container.querySelector<HTMLElement>('[aria-label="할 일 거르기"]')!;

  it("차례는 태그 → 우선순위 → 완료 숨기기, 1280 이상 small 32 · 미만 medium 36, ↺ 는 걸렸을 때만", () => {
    render();
    const chips = () =>
      Array.from(bar().querySelectorAll<HTMLElement>("button"));

    expect(chips().map((c) => c.textContent)).toEqual([
      "태그",
      "우선순위",
      "완료 숨기기",
    ]);
    for (const c of chips()) expect(c.className).toContain("h-8");
    expect(byName("필터 지우기")).toBeUndefined();

    st.wide = false;
    render();
    for (const c of chips()) expect(c.className).toContain("h-9");
  });

  it("조건 칩은 1280 이상 Popover(그 조건 하나) · 미만 Bottom Sheet — 완료로만 반영한다", () => {
    render();
    click(byName("태그"));
    const pop = document.querySelector("[data-slot=popover-content]")!;
    expect(pop.querySelector("h2")?.textContent).toBe("태그");
    expect(pop.textContent).not.toContain("우선순위");
    // 태그 없음 칩은 그런 할 일이 있을 때 맨 뒤
    const labels = Array.from(pop.querySelectorAll("[role=checkbox]")).map(
      (c) => c.textContent,
    );
    expect(labels).toEqual(["업무", LONG_TAG, "공부", "태그 없음"]);

    click(
      Array.from(pop.querySelectorAll<HTMLElement>("[role=checkbox]")).find(
        (c) => c.textContent === "업무",
      ),
    );
    // 아직 반영 전 — 칩 글 그대로, 목록도 그대로
    expect(byName("태그")).toBeTruthy();
    expect(titles()).toContain("오늘 중요");
    click(byName("완료"));

    expect(byName("업무")!.hasAttribute("data-selected")).toBe(true);
    expect(byName("필터 지우기")).toBeTruthy();
    expect(titles()).toContain("오늘 보통");
    expect(titles()).not.toContain("오늘 중요");

    st.wide = false;
    render();
    click(byName("우선순위"));
    expect(document.querySelector("[data-slot=popover-content]")).toBeNull();
    expect(
      document.querySelector("[data-slot=bottom-sheet-content]"),
    ).not.toBeNull();
  });

  it("값 요약 — 하나면 이름, 여럿이면 '업무 외 2개'", () => {
    render();
    click(byName("태그"));
    const pop = document.querySelector("[data-slot=popover-content]")!;
    for (const name of ["업무", LONG_TAG, "공부"])
      click(
        Array.from(pop.querySelectorAll<HTMLElement>("[role=checkbox]")).find(
          (c) => c.textContent === name,
        ),
      );
    click(byName("완료"));

    expect(byName("업무 외 2개")).toBeTruthy();
    // 개수 칩("필터 2") 을 두지 않는다
    expect(bar().textContent).not.toMatch(/필터 \d/);
  });

  it("완료 숨기기는 켜고 끄는 칩 — aria-pressed · 누르는 순간 걸리고 붙든 줄은 남는다", () => {
    render({ holdIds: new Set([2]) });
    const chip = () => byName("완료 숨기기")!;
    expect(chip().getAttribute("aria-pressed")).toBe("false");
    expect(chip().querySelector("[data-slot=chip-suffix-icon]")).toBeNull();

    click(chip());
    expect(chip().getAttribute("aria-pressed")).toBe("true");
    expect(chip().hasAttribute("data-selected")).toBe(true);
    // 끝낸 줄이 빠진다 — 방금 누른(붙든) 줄 2 는 남는다
    expect(titles()).toContain("오늘 끝냄");
    expect(titles()).not.toContain("끝낸 일 업무");

    click(byName("필터 지우기"));
    expect(chip().getAttribute("aria-pressed")).toBe("false");
    expect(titles()).toContain("끝낸 일 업무");
  });

  it("조건 맞추기('모두 일치') 칩은 없다 — 조건끼리 늘 모두", () => {
    render();
    click(byName("완료 숨기기"));

    expect(byName("모두 일치")).toBeUndefined();
  });
});

describe("남은 할 일 카드 (I-10 32)", () => {
  const rows = (head: string) => {
    const card = container.querySelector("[data-slot=todo-remain-card]")!;
    const h = Array.from(
      card.querySelectorAll<HTMLElement>("[data-slot=list-header]"),
    ).find((e) => e.textContent === head)!;
    return Array.from(
      h.nextElementSibling!.querySelectorAll("[data-slot=list-item]"),
    ).map((r) => r.textContent);
  };

  it("태그 합 = 우선순위 합 = 남은 수 — 끝낸 할 일 · 달은 세지 않고, 막대 · 분모는 없다", () => {
    render();
    const tag = rows("태그");
    const prio = rows("우선순위");

    // 남은 7(오늘 보통 · 오늘 중요 · 긴 제목 · 지난 마감 · 마감 없음 · 내일 공부 · 다음 달)
    expect(tag).toEqual([
      "업무2개",
      `${LONG_TAG}1개`,
      "공부2개",
      "태그 없음2개",
    ]);
    expect(prio).toEqual(["중요1개", "보통5개", "여유1개"]);
    const sum = (r: (string | null)[]) =>
      r.reduce((n, t) => n + Number(/(\d+)개$/.exec(t ?? "")![1]), 0);
    expect(sum(tag)).toBe(sum(prio));
    expect(sum(tag)).toBe(7);
    const card = container.querySelector("[data-slot=todo-remain-card]")!;
    expect(card.textContent).not.toMatch(/\d+\/\d+/);
    expect(card.querySelector("[role=progressbar]")).toBeNull();
  });

  it("긴 태그 이름은 줄이 바뀌고(칸 고정 폭 없음), 점은 장식이다", () => {
    render();
    const name = Array.from(
      container.querySelectorAll<HTMLElement>(
        '[data-slot=todo-remain-card] [class*="overflow-wrap:anywhere"]',
      ),
    ).find((e) => e.textContent === LONG_TAG);
    expect(name, "태그 이름은 줄바꿈 가능한 칸에 든다").toBeTruthy();
    // 이름 칸 폭을 고정하지 않는다(옛 60 고정을 걷었다)
    expect(name!.className).not.toMatch(/\bw-\[|\bwidth/);
    const dot = container.querySelector<HTMLElement>(
      "[data-slot=todo-tag-dot]",
    )!;
    expect(dot.getAttribute("aria-hidden")).toBe("true");
  });

  it("남은 것이 없으면 태그 묶음 없이 한 줄만 · 우선순위 셋은 0개로 남는다", () => {
    render({
      todos: [todo(1, "끝", { status: "COMPLETED", category: "업무" })],
    });

    expect(rows("우선순위")).toEqual(["중요0개", "보통0개", "여유0개"]);
    const card = container.querySelector("[data-slot=todo-remain-card]")!;
    expect(
      Array.from(card.querySelectorAll("[data-slot=list-header]")).map(
        (h) => h.textContent,
      ),
    ).toEqual(["우선순위"]);
    expect(
      card.querySelector("[data-slot=todo-remain-empty]")!.textContent,
    ).toBe("남은 할 일이 없어요.");
    expect(card.textContent).not.toContain("태그 없음");
  });

  it("남은 것이 있으면 한 줄 안내 없이 태그 묶음이 기존대로 나온다", () => {
    render();
    const card = container.querySelector("[data-slot=todo-remain-card]")!;

    expect(card.querySelector("[data-slot=todo-remain-empty]")).toBeNull();
    expect(rows("태그").length).toBeGreaterThan(0);
  });

  it("밤하늘 줄은 왼쪽 칸 둘째 — 작은 달력과 남은 할 일 사이", () => {
    render();
    const kids = Array.from(
      container.querySelector("[data-slot=todo-left]")!.children,
    ).map((e) => e.getAttribute("data-slot"));

    expect(kids).toEqual([
      "todo-mini-calendar",
      "forest-strip",
      "todo-remain-card",
    ]);
  });
});
