// 카테고리 추가 · 수정 폼(D21) — 처음 색 · 팔레트 밖 색 보존 · 읽기 줄 · 종류 바꾸면 상위 되돌림 · 검증 · 12자(I-20 B 12 · M 표)
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (k: string, o?: Record<string, unknown>) =>
      o ? `${k}${JSON.stringify(o)}` : k,
    i18n: { language: "ko" },
  }),
  initReactI18next: { type: "3rdParty", init: () => {} },
}));

const { CategoryEditDialog } = await import("./CategoryEditDialog");

const cat = (
  rowId: number,
  name: string,
  extra: Record<string, unknown> = {},
) =>
  ({
    rowId,
    categoryName: name,
    expenseType: "EXPENSE",
    parentRowId: null,
    sortOrder: rowId * 10,
    color: "#2c70bf",
    icon: "tag",
    hasChildren: false,
    ...extra,
  }) as never;

let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as never;
  window.history.replaceState(null, "");
  window.matchMedia = ((query: string) => ({
    matches: query.includes("never-wide"),
    media: query,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
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

const existing = [
  cat(1, "식비"),
  cat(2, "교통"),
  cat(3, "점심", { parentRowId: 1 }),
  cat(4, "월급", { expenseType: "INCOME", color: "#2d8060" }),
];

const mount = (
  props: Partial<Parameters<typeof CategoryEditDialog>[0]> = {},
) => {
  const onSave = vi.fn();
  const onClose = vi.fn();
  act(() =>
    root.render(
      <CategoryEditDialog
        cat={null}
        defaultKind="EXPENSE"
        existing={existing as never[]}
        onClose={onClose}
        onSave={onSave}
        {...props}
      />,
    ),
  );
  return { onSave, onClose };
};
const tick = (ms = 0) =>
  act(async () => {
    await new Promise((r) => setTimeout(r, ms));
  });
const click = (el: Element) =>
  act(async () => {
    el.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }),
    );
    await new Promise((r) => setTimeout(r, 0));
  });
const input = () =>
  document.querySelector<HTMLInputElement>("[data-slot=text-input-value]")!;
const type = (el: HTMLInputElement, v: string) =>
  act(() => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )!.set!.call(el, v);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
const byText = (text: string) =>
  Array.from(document.querySelectorAll<HTMLElement>("button")).find(
    (b) => b.textContent === text,
  )!;
/** 폼 줄 — 제목으로 찾는다(누르는 줄은 button, 보기만 하는 줄은 li) */
const rowOf = (title: string) =>
  Array.from(
    document.querySelectorAll<HTMLElement>("[data-slot=list-item]"),
  ).filter(
    (li) => li.querySelector("[data-slot=list-title]")?.textContent === title,
  )[0]!;
const pressable = (title: string) =>
  rowOf(title).querySelector<HTMLElement>("button[aria-haspopup=dialog]");
const valueOf = (title: string) =>
  rowOf(title).querySelector("[data-slot=list-suffix]")?.textContent;

describe("추가 폼", () => {
  it("제목 · 바닥 [추가] · [삭제] [거래 옮기기] 단추 0 · 손잡이 0", () => {
    mount();
    expect(document.body.textContent).toContain("addCategory");
    expect(byText("submitAdd")).toBeTruthy();
    expect(byText("delete")).toBeUndefined();
    expect(document.body.textContent).not.toContain("moveTx");
    expect(
      document.querySelector("[data-slot=bottom-sheet-handle]"),
    ).toBeNull();
  });

  it("처음 색은 같은 종류가 안 쓴 첫 색(파랑이 있으면 초록) · 빨강으로 시작하지 않는다", async () => {
    const { onSave } = mount();
    type(input(), "반려동물");
    await click(byText("submitAdd"));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0]![0]).toMatchObject({
      categoryName: "반려동물",
      color: "#2d8060",
      icon: "tag",
      expenseType: "EXPENSE",
      parentRowId: null,
    });
    expect("sortOrder" in onSave.mock.calls[0]![0]).toBe(true);
    expect(onSave.mock.calls[0]![0].sortOrder).toBeUndefined();
  });

  it("이름은 12자에서 멈춘다", () => {
    mount();
    type(input(), "가나다라마바사아자차카타파하");
    expect(input().value).toHaveLength(12);
  });

  it("빈 이름으로 누르면 칸 아래 오류 · 저장 요청 0", async () => {
    const { onSave } = mount();
    await click(byText("submitAdd"));
    expect(document.body.textContent).toContain("nameRequired");
    expect(onSave).not.toHaveBeenCalled();
  });

  it("같은 종류 · 같은 자리에 같은 이름이면 중복 오류", async () => {
    const { onSave } = mount();
    type(input(), "식비");
    await click(byText("submitAdd"));
    expect(document.body.textContent).toContain("nameDuplicate");
    expect(onSave).not.toHaveBeenCalled();
  });

  it("종류를 바꾸면 상위를 '최상위' 로 되돌린다", async () => {
    const { onSave } = mount({ defaultParentRowId: 1 });
    expect(valueOf("parentCategory")).toBe("식비");
    await click(pressable("kindLabel")!);
    await tick();
    await click(
      Array.from(
        document.querySelectorAll<HTMLElement>("[data-slot=list-body]"),
      ).find((b) => b.textContent === "income")!,
    );
    await tick();
    expect(valueOf("parentCategory")).toBe("rootOption");
    type(input(), "부수입");
    await click(byText("submitAdd"));
    expect(onSave.mock.calls[0]![0]).toMatchObject({
      expenseType: "INCOME",
      parentRowId: null,
    });
  });

  it("상위 고르기의 '최상위' 줄도 다른 줄과 같은 타일을 갖는다(제목이 한 세로선)", async () => {
    mount({ defaultParentRowId: 1 });
    await click(pressable("parentCategory")!);
    await tick();
    const sheets = document.querySelectorAll(
      "[data-slot=bottom-sheet-content]",
    );
    const rows = Array.from(
      sheets[sheets.length - 1]!.querySelectorAll("[data-slot=list-item]"),
    );
    expect(rows.length).toBeGreaterThan(1);
    for (const r of rows) {
      expect(r.querySelector("[data-slot=list-tile]")).not.toBeNull();
    }
    expect(rows[0]!.textContent).toContain("rootOption");
  });

  it("하위 추가로 열면 받은 상위가 채워진다", () => {
    mount({ defaultParentRowId: 2 });
    expect(valueOf("parentCategory")).toBe("교통");
  });
});

describe("수정 폼", () => {
  it("제목 · 바닥 [저장] · 종류 줄은 보기만(누름 없음)", () => {
    mount({ cat: cat(2, "교통") });
    expect(document.body.textContent).toContain("editTitle");
    expect(byText("save")).toBeTruthy();
    expect(pressable("kindLabel")).toBeNull();
    expect(valueOf("kindLabel")).toBe("expense");
  });

  it("최상위의 수정은 상위 줄도 보기만 '최상위'", () => {
    mount({ cat: cat(2, "교통") });
    expect(pressable("parentCategory")).toBeNull();
    expect(valueOf("parentCategory")).toBe("rootOption");
  });

  it("하위의 수정은 상위 줄을 누를 수 있고 고르기 맨 위에 안내가 있다", async () => {
    mount({ cat: cat(3, "점심", { parentRowId: 1 }) });
    expect(pressable("parentCategory")).not.toBeNull();
    await click(pressable("parentCategory")!);
    await tick();
    expect(document.body.textContent).toContain("parentMoveHint");
    const titles = Array.from(
      document.querySelectorAll("[role=dialog] [data-slot=list-title]"),
    ).map((e) => e.textContent);
    expect(titles).toContain("교통");
    // 승격(최상위로 올림)은 서버가 막는다 — '최상위' 줄이 없다
    expect(titles).not.toContain("rootOption");
  });

  it("팔레트 밖 색(#9E9E9E)으로 열어 이름만 고쳐 저장하면 색은 그대로다", async () => {
    const { onSave } = mount({ cat: cat(2, "교통", { color: "#9E9E9E" }) });
    // 팔레트 밖 색은 빨강 칸이 아니라 "지금 색" 으로 열린다
    expect(valueOf("color")).not.toMatch(/빨강|Red/);
    type(input(), "교통비");
    await click(byText("save"));
    expect(onSave.mock.calls[0]![0]).toMatchObject({
      categoryName: "교통비",
      color: "#9E9E9E",
      expenseType: "EXPENSE",
      parentRowId: null,
      sortOrder: 20,
    });
  });

  it("세트 밖 아이콘도 고르지 않으면 그대로 저장한다", async () => {
    const { onSave } = mount({
      cat: cat(2, "교통", { icon: "some-unknown-icon" }),
    });
    type(input(), "교통비");
    await click(byText("save"));
    expect(onSave.mock.calls[0]![0].icon).toBe("some-unknown-icon");
  });

  it("자기 이름과는 중복이 아니다", async () => {
    const { onSave } = mount({ cat: cat(2, "교통") });
    await click(byText("save"));
    expect(onSave).toHaveBeenCalledTimes(1);
  });
});

describe("수정 시트 머리 ⋮ (10-25 줄 끝 ⋮ 원칙)", () => {
  const headMore = (name: string) =>
    document.querySelector<HTMLElement>(
      `button[aria-label='moreOf{"name":"${name}"}']`,
    );
  const items = () =>
    Array.from(document.querySelectorAll("[data-slot=menu-sheet-item]"));
  const open = async (name: string) => {
    await click(headMore(name)!);
    await tick();
  };

  it("새 카테고리에는 머리 ⋮ 가 없다", () => {
    mount();
    expect(document.querySelector("button[aria-label^='moreOf']")).toBeNull();
  });

  it("고칠 때는 머리에 ⋮ 가 있고 이름은 '{이름} 더보기' — 키보드로 닿는 단추다", () => {
    mount({ cat: cat(2, "교통") });
    const b = headMore("교통")!;
    expect(b.tagName).toBe("BUTTON");
    expect(b.tabIndex).toBeGreaterThanOrEqual(0);
    // ds 머리 동작 자리(닫기 왼쪽 사이 4)에 서 있다
    expect(
      b.closest(
        "[data-slot=bottom-sheet-header-action],[data-slot=dialog-header-action]",
      ),
    ).not.toBeNull();
    // 닫기 단추와 같은 머리 안(시트 머리 오른쪽)에 서 있다
    expect(
      b.closest("[data-slot=bottom-sheet-content],[data-slot=dialog-content]"),
    ).not.toBeNull();
  });

  it("최상위 · 하위 없음: 하위 카테고리 추가 · 거래 옮기기 · 삭제(critical 맨 아래)", async () => {
    mount({ cat: cat(2, "교통") });
    await open("교통");
    expect(items().map((i) => i.textContent)).toEqual([
      "addSub",
      "moveTx.entry",
      "delete",
    ]);
    expect(items()[2]!.getAttribute("data-tone")).toBe("critical");
  });

  it("하위가 있는 최상위는 거래 옮기기가 없고, 하위에는 하위 추가가 없다", async () => {
    mount({ cat: cat(1, "식비", { hasChildren: true }) });
    await open("식비");
    expect(items().map((i) => i.textContent)).toEqual(["addSub", "delete"]);
  });

  it("하위: 거래 옮기기 · 삭제", async () => {
    mount({ cat: cat(3, "점심", { parentRowId: 1 }) });
    await open("점심");
    expect(items().map((i) => i.textContent)).toEqual([
      "moveTx.entry",
      "delete",
    ]);
  });

  it("각 항목은 그 카테고리로 부모의 콜백을 부른다", async () => {
    const onAddChild = vi.fn();
    const onMoveTx = vi.fn();
    const onDelete = vi.fn();
    const target = cat(2, "교통");
    mount({ cat: target, onAddChild, onMoveTx, onDelete });
    for (const [label, fn] of [
      ["addSub", onAddChild],
      ["moveTx.entry", onMoveTx],
      ["delete", onDelete],
    ] as const) {
      await open("교통");
      await click(items().find((i) => i.textContent === label) as HTMLElement);
      await tick(1100);
      expect(fn).toHaveBeenCalledWith(target);
    }
  });

  it("바뀐 값이 있으면 동작 전에 '작성한 내용이 사라져요' 를 묻고, 나간 뒤에 동작한다(K1)", async () => {
    const onMoveTx = vi.fn();
    const target = cat(2, "교통");
    mount({ cat: target, onMoveTx });
    type(input(), "교통비");
    await open("교통");
    await click(
      items().find((i) => i.textContent === "moveTx.entry") as HTMLElement,
    );
    await tick(1100);
    expect(onMoveTx).not.toHaveBeenCalled();
    const alert = document.querySelector("[role=alertdialog]")!;
    expect(alert).not.toBeNull();
    // [계속 작성] 은 동작을 하지 않고 닫는다 · [나가기](critical)는 동작한다
    await click(
      alert.querySelector<HTMLElement>("[data-slot=alert-dialog-action]")!,
    );
    await tick();
    expect(onMoveTx).toHaveBeenCalledWith(target);
  });
});
