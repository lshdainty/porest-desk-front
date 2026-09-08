// 할 일 수정이 **마감일을 어떻게 보내는가** 를 고정한다 (QA #111).
//
// 규칙은 거래 시트·자산 편집과 같다 — 이 편집기가 **가진 칸만** 싣고,
// 칸이 비어 있으면 `null`(지움)을 싣는다. PUT 은 세 갈래이므로
// (`Patch`: 키 없음=유지 · null=지움 · 값=교체, QA #96) 키를 빼면 옛 값이 남는다.
//
// 종전엔 `due || undefined` 라, 마감일을 지우고 저장해도 옛 마감일이 그대로 남았다.
// 화면은 지워진 것처럼 닫히고서. 같은 편집기의 태그(`tagValueToPayload`)는 이미
// 이 규칙대로 `null` 을 보내고 있었다 — 마감일만 빠져 있었다.
//
// 반대편도 잠근다 — 고른 마감일은 그대로 나가야 한다.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { __resetPointerBlockForTest } from "@/shared/lib/porest/pointer-block";
import type { Todo } from "@/entities/todo";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

const sent = vi.hoisted(() => ({
  values: null as Record<string, unknown> | null,
  id: undefined as number | undefined,
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
  initReactI18next: { type: "3rdParty", init: () => {} },
}));
vi.mock("react-router-dom", () => ({
  useOutletContext: () => ({ mobile: false, onAddTx: () => {} }),
}));
vi.mock("@/features/todo", () => ({
  useTodos: () => ({ data: state.todos, isLoading: false }),
  useCreateTodo: () => ({ mutate: () => {}, isPending: false }),
  useUpdateTodo: () => ({
    mutate: ({ id, data }: { id: number; data: Record<string, unknown> }) => {
      sent.id = id;
      sent.values = data;
    },
    isPending: false,
  }),
  useToggleTodoStatus: () => ({
    mutate: () => {},
    pendingIds: new Set<number>(),
    holdIds: new Set<number>(),
  }),
  useDeleteTodo: () => ({
    mutate: () => {},
    mutateAsync: async () => {},
    isPending: false,
  }),
}));
vi.mock("@/features/todo-tag", () => ({ useTodoTags: () => ({ data: [] }) }));
vi.mock("@/features/constellation", () => ({
  useConstellationToday: () => ({ data: undefined }),
  useConstellationSky: () => ({ data: [] }),
}));
vi.mock("@/widgets/constellation", () => ({
  ForestReport: () => null,
  ForestStrip: () => null,
  NightSkyPanel: () => null,
}));
vi.mock("./TodoMobileLedger", () => ({ TodoMobileLedger: () => null }));

const todo: Todo = {
  rowId: 42,
  title: "세금 신고",
  content: "",
  priority: "MEDIUM",
  category: null,
  status: "PENDING",
  type: "TASK",
  isPinned: false,
  dueDate: "2026-09-30",
  completedAt: null,
  sortOrder: 0,
  parentRowId: null,
  tags: [],
  subtaskCount: 0,
  subtaskCompletedCount: 0,
  createAt: "2026-09-01T00:00:00",
  modifyAt: "2026-09-01T00:00:00",
};

const state = { todos: [todo] as Todo[] };

const { TodoPage } = await import("./TodoPage");

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  // 앞 케이스의 다이얼로그가 닫히면 그 뒤 POINTER_BLOCK_MS 동안 클릭이 삼켜진다
  // (모달 닫힘 직후 오클릭 방어) — 케이스끼리 옮지 않게 여기서 푼다.
  __resetPointerBlockForTest();
  sent.values = null;
  sent.id = undefined;
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

const click = (el: Element) =>
  act(() => el.dispatchEvent(new MouseEvent("click", { bubbles: true })));

const buttonWith = (label: string) =>
  [...document.body.querySelectorAll("button")].find(
    (b) => b.textContent?.trim() === label,
  );

/** 목록 → 상세 → 수정 순으로 편집기를 연다(화면에서 실제로 가는 길). */
function openEditor() {
  act(() => root.render(<TodoPage />));
  // 기본 탭은 '오늘' 이라 마감일이 오늘인 것만 보인다 — 오늘 날짜에 기대지 않으려고
  // '전체' 로 옮긴다(그래야 이 테스트가 달력을 안 탄다).
  const allTab = [...container.querySelectorAll("button")].find((b) =>
    b.textContent?.startsWith("status.ALL"),
  );
  if (!allTab) throw new Error("전체 탭을 찾지 못했다");
  // radix Tabs 는 mousedown 에서 탭을 바꾼다 — click 만 쏘면 아무 일도 안 일어난다.
  act(() =>
    allTab.dispatchEvent(new MouseEvent("mousedown", { bubbles: true })),
  );
  const row = [...container.querySelectorAll("div")].find(
    (d) => d.textContent?.includes("세금 신고") && d.style.cursor === "pointer",
  );
  if (!row) throw new Error("할 일 행을 찾지 못했다");
  click(row);
  const edit = buttonWith("edit");
  if (!edit) throw new Error("상세의 수정 버튼을 찾지 못했다");
  click(edit);
}

/** 마감일 입력 — 편집기가 `yyyy-mm-dd` 자리표시자를 단 칸이다. */
const dueInput = () =>
  document.body.querySelector<HTMLInputElement>(
    'input[placeholder="yyyy-mm-dd"]',
  );

function setInput(el: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value",
  )?.set;
  act(() => {
    setter?.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

function save() {
  const btn = buttonWith("save");
  if (!btn) throw new Error("저장 버튼을 찾지 못했다");
  click(btn);
}

describe("마감일 (QA #111)", () => {
  it("비우면 null 이 나간다 — 키를 빼면 옛 마감일이 남는다", () => {
    openEditor();
    const el = dueInput();
    expect(el?.value).toBe("2026-09-30");
    setInput(el!, "");
    save();

    expect(sent.id).toBe(42);
    expect(sent.values).not.toBeNull();
    expect(sent.values!).toHaveProperty("dueDate");
    expect(sent.values!.dueDate).toBeNull();
  });

  it("고른 마감일은 그대로 나간다", () => {
    openEditor();
    setInput(dueInput()!, "2026-10-15");
    save();

    expect(sent.values!.dueDate).toBe("2026-10-15");
  });
});
