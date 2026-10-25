// 할 일 모델 — 폰 원장 · 데스크톱이 같은 셈을 쓴다(I-10 4). 묶음 안 차례(15) · 붙들기(QA #29) · 달 + 거르기 · 칸 표시 판정.
import { describe, expect, it } from "vitest";
import type { SkyDay } from "@/features/constellation";
import type { Todo, TodoPriority, TodoStatus } from "@/entities/todo";
import {
  NO_DUE,
  cellMarkOf,
  dayDiff,
  dueKey,
  groupByDay,
  isDone,
  isFilterActive,
  monthTodos,
  relKindOf,
  remainByPrio,
  remainByTag,
  sortDayItems,
  todayLeft,
  type TodoFilter,
} from "./todo-ledger";

const TODAY = "2026-10-22";
const NONE: TodoFilter = { tags: [], prios: [], hideDone: false };

function todo(
  rowId: number,
  over: {
    status?: TodoStatus;
    dueDate?: string | null;
    priority?: TodoPriority;
    category?: string | null;
  } = {},
): Todo {
  return {
    rowId,
    title: `할 일 ${rowId}`,
    content: null,
    priority: over.priority ?? "MEDIUM",
    category: over.category === undefined ? null : over.category,
    status: over.status ?? "PENDING",
    type: "TASK",
    isPinned: false,
    dueDate: over.dueDate === undefined ? TODAY : over.dueDate,
    completedAt: null,
    sortOrder: rowId,
    parentRowId: null,
    tags: [],
    subtaskCount: 0,
    subtaskCompletedCount: 0,
    createAt: `${TODAY}T00:00:00`,
    modifyAt: `${TODAY}T00:00:00`,
  };
}
const ids = (list: Todo[]) => list.map((t) => t.rowId);

describe("묶음 안 차례 (2B · I-10 15)", () => {
  it("남은 일 위 · 끝낸 일 아래, 각각 중요 → 보통 → 여유", () => {
    const list = [
      todo(1, { status: "COMPLETED", priority: "HIGH" }),
      todo(2, { priority: "LOW" }),
      todo(3, { priority: "HIGH" }),
      todo(4, { status: "COMPLETED", priority: "LOW" }),
      todo(5, { priority: "MEDIUM" }),
    ];
    expect(ids(sortDayItems(list))).toEqual([3, 5, 2, 1, 4]);
  });

  it("같은 열쇠는 서버 차례를 지킨다(안정 정렬)", () => {
    const list = [todo(9), todo(3), todo(7)];
    expect(ids(sortDayItems(list))).toEqual([9, 3, 7]);
  });

  it("방금 끝냄을 누른 줄은 붙든 동안 누르기 전 자리에 남고, 풀리면 아래로 내려간다", () => {
    // 낙관 갱신이 2 를 끝냄으로 뒤집은 직후
    const after = [
      todo(1, { priority: "HIGH" }),
      todo(2, { status: "COMPLETED", priority: "MEDIUM" }),
      todo(3, { priority: "MEDIUM" }),
    ];
    expect(ids(sortDayItems(after, new Set([2])))).toEqual([1, 2, 3]);
    expect(ids(sortDayItems(after))).toEqual([1, 3, 2]);
  });

  it("붙든 줄이 끝냄 → 남은 으로 되돌린 줄이어도 누르기 전(끝냄) 자리에 남는다", () => {
    const after = [
      todo(1),
      todo(2, { priority: "HIGH" }),
      todo(3, { priority: "MEDIUM" }),
    ];
    // 1 을 방금 끝냄 → 남은 으로 되돌렸다: 누르기 전에는 끝낸 줄이라 아래에 있었다
    expect(ids(sortDayItems(after, new Set([1])))).toEqual([2, 3, 1]);
  });

  it("따닥 누른 두 번째 누름이 다른 할 일을 완료시키지 않는다 — 붙든 줄이 제 자리에 있어 같은 줄이 눌린다 (QA #29)", () => {
    const before = [todo(1), todo(2), todo(3)];
    const firstTap = before[0]!;
    // 첫 누름 뒤 낙관 갱신
    const optimistic = before.map((t) =>
      t.rowId === firstTap.rowId ? { ...t, status: "COMPLETED" as const } : t,
    );
    const rows = ids(sortDayItems(optimistic, new Set([firstTap.rowId])));
    // 같은 좌표(첫 줄)에 여전히 같은 줄이 있다
    expect(rows[0]).toBe(firstTap.rowId);
  });
});

describe("달 + 거르기", () => {
  const list = [
    todo(1, { dueDate: "2026-10-03", category: "업무" }),
    todo(2, { dueDate: "2026-11-03" }),
    todo(3, { dueDate: null }),
    todo(4, { dueDate: "2026-10-09", priority: "HIGH", category: "공부" }),
    todo(5, { dueDate: "2026-10-09", status: "COMPLETED", category: "업무" }),
  ];

  it("그 달 할 일 + 마감일 없는 할 일(꼬리 묶음)", () => {
    expect(ids(monthTodos(list, "2026-10", NONE))).toEqual([1, 3, 4, 5]);
  });

  it("태그 · 우선순위 · 완료 숨기기가 모두 걸린다 — '태그 없음' 은 빈 글로 센다", () => {
    expect(
      ids(monthTodos(list, "2026-10", { ...NONE, tags: ["업무"] })),
    ).toEqual([1, 5]);
    expect(ids(monthTodos(list, "2026-10", { ...NONE, tags: [""] }))).toEqual([
      3,
    ]);
    expect(
      ids(monthTodos(list, "2026-10", { ...NONE, prios: ["HIGH"] })),
    ).toEqual([4]);
    expect(
      ids(monthTodos(list, "2026-10", { ...NONE, hideDone: true })),
    ).toEqual([1, 3, 4]);
  });

  it("완료 숨기기를 켜도 방금 누른 줄은 붙든 동안 남는다 (QA #29)", () => {
    expect(
      ids(
        monthTodos(list, "2026-10", { ...NONE, hideDone: true }, new Set([5])),
      ),
    ).toEqual([1, 3, 4, 5]);
  });

  it("걸림 판정", () => {
    expect(isFilterActive(NONE)).toBe(false);
    expect(isFilterActive({ ...NONE, hideDone: true })).toBe(true);
    expect(isFilterActive({ ...NONE, tags: [""] })).toBe(true);
  });

  it("묶음은 날짜 열쇠, 마감일 없음은 NO_DUE, 안은 차례대로", () => {
    const g = groupByDay(monthTodos(list, "2026-10", NONE));
    expect([...g.keys()]).toEqual(["2026-10-03", NO_DUE, "2026-10-09"]);
    expect(ids(g.get("2026-10-09")!)).toEqual([4, 5]);
  });

  it("오늘 남은 수 — 끝낸 것은 세지 않는다", () => {
    const l = [
      todo(1),
      todo(2, { status: "COMPLETED" }),
      todo(3, { dueDate: "2026-10-23" }),
    ];
    expect(todayLeft(l, TODAY)).toBe(1);
  });
});

describe("칸 표시 판정 (I-10 9)", () => {
  const byDay = groupByDay([
    todo(1, { dueDate: "2026-10-22" }),
    todo(2, { dueDate: "2026-10-22" }),
    todo(3, { dueDate: "2026-10-20", status: "COMPLETED" }),
    todo(4, { dueDate: "2026-10-18" }),
    todo(5, { dueDate: "2026-10-25" }),
  ]);
  const sky = new Map<string, SkyDay>([
    [
      "2026-10-19",
      {
        date: "2026-10-19",
        status: "GROWN",
        colorKey: "blue",
        constellationKey: "orion",
        points: 5,
        guardUsed: false,
      } as SkyDay,
    ],
    [
      "2026-10-21",
      {
        date: "2026-10-21",
        status: "WITHERED",
        colorKey: null,
        constellationKey: null,
        points: 1,
        guardUsed: false,
      } as SkyDay,
    ],
  ]);
  const mark = (ds: string, skyDone = false) =>
    cellMarkOf(ds, TODAY, byDay, sky, skyDone);

  it("오늘 — 수집했으면 ★, 아니면 남은 수(오늘 표시)", () => {
    expect(mark("2026-10-22", true)).toEqual({ kind: "collected" });
    expect(mark("2026-10-22")).toEqual({
      kind: "left",
      count: 2,
      today: true,
    });
  });
  it("지난 날 — 키운 별자리 ★ · 놓친 날 구름 · 남은 수 · 다 끝냄 ✓", () => {
    expect(mark("2026-10-19")).toEqual({ kind: "grown", colorKey: "blue" });
    expect(mark("2026-10-21")).toEqual({ kind: "missed" });
    expect(mark("2026-10-18")).toEqual({
      kind: "left",
      count: 1,
      today: false,
    });
    expect(mark("2026-10-20")).toEqual({ kind: "done" });
  });
  it("오는 날은 남은 수, 아무것도 없으면 null", () => {
    expect(mark("2026-10-25")).toEqual({
      kind: "left",
      count: 1,
      today: false,
    });
    expect(mark("2026-10-26")).toBeNull();
  });
  it("상대 날은 오늘 · 내일 · 어제만", () => {
    expect(relKindOf("2026-10-22", TODAY)).toBe("today");
    expect(relKindOf("2026-10-23", TODAY)).toBe("tomorrow");
    expect(relKindOf("2026-10-21", TODAY)).toBe("yesterday");
    expect(relKindOf("2026-10-24", TODAY)).toBeNull();
  });
});

describe("날짜 유틸 (옛 visible-todos 에서 옮김)", () => {
  it("dueKey 는 datetime 에서 날짜만 뽑고 없으면 null 이다", () => {
    expect(dueKey("2026-09-03T13:20:00")).toBe("2026-09-03");
    expect(dueKey("2026-09-03")).toBe("2026-09-03");
    expect(dueKey(null)).toBeNull();
    expect(dueKey(undefined)).toBeNull();
    expect(dueKey("")).toBeNull();
  });

  it("dayDiff 는 b−a 일수다", () => {
    expect(dayDiff(TODAY, TODAY)).toBe(0);
    expect(dayDiff(TODAY, "2026-10-29")).toBe(7);
    expect(dayDiff(TODAY, "2026-10-21")).toBe(-1);
  });

  it("isDone 은 COMPLETED 만 참이다", () => {
    expect(isDone(todo(1, { status: "COMPLETED" }))).toBe(true);
    expect(isDone(todo(1, { status: "PENDING" }))).toBe(false);
  });
});

describe("남은 할 일 (I-10 32)", () => {
  const list = [
    todo(1, { category: "업무", priority: "HIGH" }),
    todo(2, { category: "업무", priority: "MEDIUM" }),
    todo(3, { category: "공부", priority: "LOW" }),
    todo(4, { category: null, priority: "MEDIUM" }),
    todo(5, { category: "업무", priority: "HIGH", status: "COMPLETED" }),
    todo(6, { category: "생활", priority: "LOW", status: "COMPLETED" }),
    // 마감이 다른 달이어도 센다 — 달 · 거르기와 상관없이 전체
    todo(7, { category: "공부", priority: "LOW", dueDate: "2027-01-05" }),
    todo(8, { category: "공부", dueDate: null }),
  ];

  it("태그별: 끝낸 것은 세지 않고, 남은 것이 0 인 태그는 줄이 없으며, 태그 없음은 맨 뒤다", () => {
    expect(remainByTag(list, ["업무", "공부", "생활"])).toEqual([
      { tag: "업무", count: 2 },
      { tag: "공부", count: 3 },
      { tag: "", count: 1 },
    ]);
  });

  it("태그 없는 할 일이 없으면 태그 없음 줄이 없다", () => {
    expect(
      remainByTag([todo(1, { category: "업무" })], ["업무"]).map((r) => r.tag),
    ).toEqual(["업무"]);
  });

  it("우선순위별: 셋 다 늘 낸다(0 이어도) — 합이 태그별 합과 같다", () => {
    const prio = remainByPrio(list);
    expect(prio).toEqual({ HIGH: 1, MEDIUM: 3, LOW: 2 });
    const tagSum = remainByTag(list, ["업무", "공부", "생활"]).reduce(
      (n, r) => n + r.count,
      0,
    );
    expect(prio.HIGH + prio.MEDIUM + prio.LOW).toBe(tagSum);
    expect(remainByPrio([])).toEqual({ HIGH: 0, MEDIUM: 0, LOW: 0 });
  });
});
