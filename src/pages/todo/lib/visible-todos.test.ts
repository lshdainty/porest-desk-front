// 완료 토글을 따닥 누르면 **다른 할 일까지 완료됐다**(QA #29). 첫 탭의 낙관 갱신이 그
// 행을 즉시 목록에서 빼고 아래 행이 같은 좌표로 올라와, 두 번째 탭이 다음 항목을
// 완료시킨 것이다. 그 재배치를 만드는 자리가 이 필터 한 줄이라 여기에 잠근다.
import { describe, expect, it } from "vitest";
import type { Todo, TodoPriority, TodoStatus } from "@/entities/todo";
import {
  dayDiff,
  dueKey,
  inSevenDays,
  isDone,
  visibleTodos,
} from "./visible-todos";

const TODAY = "2026-09-03";

function todo(
  rowId: number,
  over: {
    status?: TodoStatus;
    dueDate?: string | null;
    priority?: TodoPriority;
  } = {},
): Todo {
  return {
    rowId,
    title: `할 일 ${rowId}`,
    content: null,
    priority: over.priority ?? "MEDIUM",
    category: null,
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

describe("날짜 유틸", () => {
  it("dueKey 는 datetime 에서 날짜만 뽑고 null 을 그대로 넘긴다", () => {
    expect(dueKey("2026-09-03T13:20:00")).toBe("2026-09-03");
    expect(dueKey("2026-09-03")).toBe("2026-09-03");
    expect(dueKey(null)).toBeNull();
    expect(dueKey(undefined)).toBeNull();
    expect(dueKey("")).toBeNull();
  });

  it("dayDiff 는 b−a 일수다", () => {
    expect(dayDiff(TODAY, TODAY)).toBe(0);
    expect(dayDiff(TODAY, "2026-09-10")).toBe(7);
    expect(dayDiff(TODAY, "2026-09-02")).toBe(-1);
  });

  it("inSevenDays 는 오늘부터 7일까지 — 지난 것과 8일째는 뺀다", () => {
    expect(inSevenDays(TODAY, TODAY)).toBe(true);
    expect(inSevenDays(TODAY, "2026-09-10")).toBe(true);
    expect(inSevenDays(TODAY, "2026-09-11")).toBe(false);
    expect(inSevenDays(TODAY, "2026-09-02")).toBe(false);
    expect(inSevenDays(TODAY, null)).toBe(false);
  });

  it("isDone 은 COMPLETED 만 참이다", () => {
    expect(isDone(todo(1, { status: "COMPLETED" }))).toBe(true);
    expect(isDone(todo(1, { status: "PENDING" }))).toBe(false);
  });
});

describe("visibleTodos — 방금 토글한 행의 자리 유지(QA #29)", () => {
  const rows = [todo(1, { status: "COMPLETED" }), todo(2), todo(3)];

  it("붙들지 않으면 완료한 행이 즉시 빠진다 — 아래 행이 그 자리로 올라온다", () => {
    // 이게 결함의 재현이다. 1 번이 사라지면 2 번이 1 번 좌표로 올라와 두 번째 탭을 받는다.
    expect(visibleTodos(rows, "today", TODAY).map((t) => t.rowId)).toEqual([
      2, 3,
    ]);
  });

  it("붙들면 완료로 뒤집힌 행이 같은 자리에 남는다", () => {
    const held = new Set([1]);
    expect(
      visibleTodos(rows, "today", TODAY, held).map((t) => t.rowId),
    ).toEqual([1, 2, 3]);
  });

  it("붙든 행은 순서를 그대로 지킨다 — 맨 뒤로 밀리면 자리 유지가 아니다", () => {
    const held = new Set([2]);
    const list = [todo(1), todo(2, { status: "COMPLETED" }), todo(3)];
    expect(visibleTodos(list, "all", TODAY, held).map((t) => t.rowId)).toEqual([
      1, 2, 3,
    ]);
  });

  it("완료 탭에서 해제한 행도 붙든다 — 반대 방향의 같은 재배치", () => {
    const list = [
      todo(1, { status: "COMPLETED" }),
      todo(2),
      todo(3, { status: "COMPLETED" }),
    ];
    expect(
      visibleTodos(list, "done", TODAY, new Set([2])).map((t) => t.rowId),
    ).toEqual([1, 2, 3]);
    expect(visibleTodos(list, "done", TODAY).map((t) => t.rowId)).toEqual([
      1, 3,
    ]);
  });

  it("붙드는 건 방금 누른 행뿐이다 — 다른 완료 항목까지 되살리지 않는다", () => {
    const list = [
      todo(1, { status: "COMPLETED" }),
      todo(2, { status: "COMPLETED" }),
    ];
    expect(
      visibleTodos(list, "today", TODAY, new Set([1])).map((t) => t.rowId),
    ).toEqual([1]);
  });

  it("자리 유지가 필터 조건을 넘기지는 않는다 — 마감이 밖이면 여전히 안 보인다", () => {
    const list = [todo(9, { status: "COMPLETED", dueDate: "2026-09-30" })];
    expect(visibleTodos(list, "today", TODAY, new Set([9]))).toEqual([]);
    expect(visibleTodos(list, "week", TODAY, new Set([9]))).toEqual([]);
    expect(
      visibleTodos(list, "all", TODAY, new Set([9])).map((t) => t.rowId),
    ).toEqual([9]);
  });

  it("주간 탭도 같은 예외를 쓴다", () => {
    const list = [
      todo(1, { status: "COMPLETED", dueDate: "2026-09-05" }),
      todo(2),
    ];
    expect(visibleTodos(list, "week", TODAY).map((t) => t.rowId)).toEqual([2]);
    expect(
      visibleTodos(list, "week", TODAY, new Set([1])).map((t) => t.rowId),
    ).toEqual([1, 2]);
  });
});
