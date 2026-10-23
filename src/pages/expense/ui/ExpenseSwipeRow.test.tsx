// 가계부 폰 거래 줄의 밀기 + 줄 끝 ⋮ (I-07 6) — 둘이 한 배열에서 나오고, 시스템 거래에는 없고, 삭제는 확인창부터다.
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Expense } from "@/entities/expense";
import type { ExpenseSwipeAction } from "@/pages/expense/lib/use-expense-swipe-actions";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: "ko" } }),
  initReactI18next: { type: "3rdParty", init: () => {} },
}));

const { ExpenseSwipeRow, PlainRow, SwipeConfirmDialog } =
  await import("./ExpenseSwipeRow");
const { SwipeActionsProvider } = await import("@/shared/ds/swipe-actions");

const tx: Expense = {
  rowId: 7,
  categoryRowId: 11,
  categoryName: "식비",
  assetRowId: 9,
  assetName: "주거래 통장",
  expenseType: "EXPENSE",
  amount: 12_000,
  description: null,
  merchant: "숲길커피",
  expenseDate: "2020-08-20T10:00:00",
  paymentMethod: "CARD",
  installmentMonths: null,
  refundedAt: null,
  refundTransferRowId: null,
  originalAmount: null,
  originalCurrency: null,
  exchangeRate: null,
  calendarEventRowId: null,
  todoRowId: null,
  autoSource: null,
  createAt: "2020-08-20T10:00:00",
  modifyAt: "2020-08-20T10:00:00",
};

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  if (!globalThis.ResizeObserver) {
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
  window.history.replaceState(null, "");
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  act(() => root.unmount());
  container.remove();
  document.body.removeAttribute("style");
  await new Promise((r) => setTimeout(r, 100));
});

const render = (node: ReactNode) =>
  act(() => root.render(<SwipeActionsProvider>{node}</SwipeActionsProvider>));

const edit = (onSelect = vi.fn()): ExpenseSwipeAction => ({
  label: "수정",
  icon: null,
  kind: "primary",
  onSelect,
});
const del = (onSelect = vi.fn()): ExpenseSwipeAction => ({
  label: "삭제",
  icon: null,
  kind: "destructive",
  confirm: { title: "거래를 삭제할까요?", message: "되돌릴 수 없어요." },
  onSelect,
});

const row = (props: Partial<Parameters<typeof ExpenseSwipeRow>[0]> = {}) => (
  <ExpenseSwipeRow
    expense={tx}
    actions={[edit(), del()]}
    rowLabel="숲길커피"
    onOpen={() => {}}
    onAsk={() => {}}
    {...props}
  />
);
const more = () =>
  container.querySelector<HTMLButtonElement>("[data-slot=swipe-actions-more]");

describe("밀기 + 줄 끝 ⋮ — 한 배열에서 나온다", () => {
  it('줄 끝 ⋮ 의 이름은 "{줄 제목} 더보기" 이고 누르면 [수정, 삭제] 가 이 차례로 열린다', async () => {
    await render(row());
    // 이름은 ds 문구 common.moreFor — 줄 제목이 들어간다(언어는 테스트 환경에서 정해진다)
    expect(more()?.getAttribute("aria-label")).toMatch(
      /^(숲길커피 더보기|More options for 숲길커피)$/,
    );

    await act(async () => {
      more()!.click();
      await new Promise((r) => setTimeout(r, 0));
    });
    const names = Array.from(
      document.querySelectorAll("[data-slot=menu-sheet-item]"),
    ).map((b) => b.textContent);
    expect(names).toEqual(["수정", "삭제"]);
  });

  it("밀면 드러나는 트레이에도 같은 두 동작이 있다 — 삭제가 가장 안쪽", async () => {
    await render(row());
    const tray = Array.from(
      container.querySelectorAll("[data-slot=swipe-action]"),
    ).map((b) => b.getAttribute("aria-label"));

    // 의미 순서 [수정, 삭제] 를 컴포넌트가 뒤집어 그린다 — 삭제가 안쪽(앞)
    expect(tray).toEqual(["삭제: 숲길커피", "수정: 숲길커피"]);
  });

  it("시스템이 만든 거래(동작 없음)는 밀기도 ⋮ 도 없다 — 줄은 그대로 그려진다", async () => {
    await render(row({ actions: [] }));

    expect(more()).toBeNull();
    expect(container.querySelector("[data-slot=swipe-actions]")).toBeNull();
    expect(container.textContent).toContain("숲길커피");
  });

  it("이체 줄처럼 감싸지 않는 줄은 ⋮ 자리만 비워 금액 열을 맞춘다", async () => {
    await render(
      <PlainRow>
        <span data-testid="plain">줄</span>
      </PlainRow>,
    );

    expect(more()).toBeNull();
    expect(container.querySelector("[data-slot=swipe-actions]")).toBeNull();
    expect(container.querySelector(".w-x8")).not.toBeNull();
  });

  it("알림 · 검색에서 들어온 줄은 List 강조 바탕(bg-brand-weak)으로 알린다 — 옛 brand-subtle 아님", async () => {
    await render(row({ highlighted: true }));
    const html = container.innerHTML;

    expect(html).toContain("bg-bg-brand-weak");
    expect(html).not.toContain("brand-subtle");

    await render(row({ highlighted: false }));
    expect(container.innerHTML).not.toContain("bg-bg-brand-weak");
  });

  it("수정은 바로 실행하고, 삭제는 실행하지 않고 확인창으로 넘긴다", async () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const onAsk = vi.fn();
    await render(row({ actions: [edit(onEdit), del(onDelete)], onAsk: onAsk }));
    const button = (label: string) =>
      container.querySelector<HTMLButtonElement>(
        `[data-slot=swipe-action][aria-label="${label}: 숲길커피"]`,
      )!;

    await act(async () => button("수정").click());
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onAsk).not.toHaveBeenCalled();

    await act(async () => button("삭제").click());
    expect(onDelete).not.toHaveBeenCalled();
    expect(onAsk).toHaveBeenCalledTimes(1);
    expect(onAsk.mock.calls[0]![0].label).toBe("삭제");
  });
});

describe("삭제 확인창 — ds Alert Dialog", () => {
  const flush = () => act(async () => void (await Promise.resolve()));

  it("제목 · 설명은 hook 이 넘긴 글이고 확인 버튼은 누른 동작의 라벨(삭제) · criticalSolid 다", async () => {
    await render(<SwipeConfirmDialog action={del()} onClose={() => {}} />);
    await flush();

    expect(
      document.querySelector("[data-slot=alert-dialog-title]")?.textContent,
    ).toBe("거래를 삭제할까요?");
    expect(
      document.querySelector("[data-slot=alert-dialog-description]")
        ?.textContent,
    ).toBe("되돌릴 수 없어요.");
    const ok = document.querySelector<HTMLButtonElement>(
      "[data-slot=alert-dialog-action]",
    )!;
    expect(ok.textContent).toBe("삭제");
    expect(ok.className).toContain("bg-bg-critical-solid");
  });

  it("[삭제] 를 누르면 한 번 실행하고 닫는다", async () => {
    const onSelect = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    await render(
      <SwipeConfirmDialog action={del(onSelect)} onClose={onClose} />,
    );
    await flush();

    await act(async () => {
      document
        .querySelector<HTMLButtonElement>("[data-slot=alert-dialog-action]")!
        .click();
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("실패하면 닫지 않는다 — 지워진 것은 없다", async () => {
    const onSelect = vi.fn().mockRejectedValue(new Error("boom"));
    const onClose = vi.fn();
    await render(
      <SwipeConfirmDialog action={del(onSelect)} onClose={onClose} />,
    );
    await flush();

    await act(async () => {
      document
        .querySelector<HTMLButtonElement>("[data-slot=alert-dialog-action]")!
        .click();
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
    expect(
      document.querySelector("[data-slot=alert-dialog-content]"),
    ).not.toBeNull();
  });

  it("동작이 없으면 아무것도 그리지 않는다", async () => {
    await render(<SwipeConfirmDialog action={null} onClose={() => {}} />);
    await flush();

    expect(
      document.querySelector("[data-slot=alert-dialog-content]"),
    ).toBeNull();
  });
});
