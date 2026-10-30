// 폰 "거래를 고정으로 정리하기" 페이지(I-08 Q5-A) — 대화상자가 아니라 페이지, 바닥 [적용] 하나, 줄 이름 줄바꿈
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
const snacks: {
  message: string;
  tone?: string;
  action?: { label: string; onClick: () => void };
}[] = [];
vi.mock("@/shared/ds/snackbar", () => ({
  useSnackbar: () => ({
    show: (o: (typeof snacks)[number]) => snacks.push(o),
    dismiss: () => {},
  }),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
const mutate = vi.fn();
const refetch = vi.fn();
const qState = { error: false };
vi.mock("../model/useExpenses", () => ({
  useExpenses: () => ({
    isLoading: false,
    isError: qState.error,
    refetch,
    data: qState.error
      ? undefined
      : [
          {
            rowId: 1,
            expenseType: "EXPENSE",
            amount: 1_234_567_890,
            description: "월세",
            merchant:
              "월세 아주 긴 이름의 거래처 이십사 글자를 넘기는 이름이에요",
            isFixed: false,
            expenseDate: "2026-10-01T09:00:00",
          },
        ],
  }),
  useBulkMarkFixed: () => ({ mutate, isPending: false }),
}));

const { FixedBulkPage } = await import("./FixedBulkPage");

let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  qState.error = false;
  snacks.length = 0;
  mutate.mockReset();
  act(() => root.unmount());
  container.remove();
});

describe("폰 고정 정리 페이지", () => {
  it("페이지(role=dialog 전체 화면) — 상단 바 ← + 제목 + 바닥 버튼 하나, 처음엔 적용이 막혀 있다", () => {
    act(() =>
      root.render(
        <FixedBulkPage
          startDate="2026-10-01"
          endDate="2026-10-31"
          onClose={() => {}}
        />,
      ),
    );
    const page = document.querySelector("[data-slot=fixed-bulk-page]")!;
    expect(page).not.toBeNull();
    expect(page.querySelector("[data-slot=top-navigation]")).not.toBeNull();
    const apply = Array.from(page.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("fixed.bulk.apply"),
    ) as HTMLButtonElement;
    expect(apply.disabled).toBe(true);
  });

  it("줄 이름이 말줄임 없이 모두 보인다 · 묶음을 고르면 [적용] 이 풀린다", () => {
    act(() =>
      root.render(
        <FixedBulkPage
          startDate="2026-10-01"
          endDate="2026-10-31"
          onClose={() => {}}
        />,
      ),
    );
    const page = document.querySelector("[data-slot=fixed-bulk-page]")!;
    expect(page.textContent).toContain("월세 아주 긴 이름의 거래처");
    expect(page.querySelector("fieldset")!.innerHTML).not.toMatch(
      /text-ellipsis|truncate/,
    );
    const check = page.querySelector("[role=checkbox]") as HTMLElement;
    act(() => check.click());
    const apply = Array.from(page.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("fixed.bulk.apply"),
    ) as HTMLButtonElement;
    expect(apply.disabled).toBe(false);
    act(() => apply.click());
    expect(mutate).toHaveBeenCalledTimes(1);
  });

  it("[적용] 이 실패하면 critical 스낵바 + [다시 시도] — 같은 id · 방향을 다시 묻지 않고 바로 보낸다 (요청은 silent)", () => {
    mutate.mockImplementation((_v: unknown, o: { onError?: () => void }) =>
      o.onError?.(),
    );
    act(() =>
      root.render(
        <FixedBulkPage
          startDate="2026-10-01"
          endDate="2026-10-31"
          onClose={() => {}}
        />,
      ),
    );
    const page = document.querySelector("[data-slot=fixed-bulk-page]")!;
    act(() => (page.querySelector("[role=checkbox]") as HTMLElement).click());
    const apply = Array.from(page.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("fixed.bulk.apply"),
    ) as HTMLButtonElement;
    act(() => apply.click());

    expect(mutate.mock.calls[0]![0]).toEqual({
      ids: [1],
      isFixed: true,
      silent: true,
    });
    expect(snacks).toHaveLength(1);
    expect(snacks[0]).toMatchObject({
      message: "fixed.bulk.failed",
      tone: "critical",
      action: { label: "fixed.bulk.retry" },
    });
    // 다시 시도 — 같은 요청을 바로(확인 · 선택 단계 없이)
    act(() => snacks[0]!.action!.onClick());
    expect(mutate).toHaveBeenCalledTimes(2);
    expect(mutate.mock.calls[1]![0]).toEqual(mutate.mock.calls[0]![0]);
    expect(snacks).toHaveLength(2);
  });

  it("거래 질의가 실패하면 빈 목록 글이 아니라 실패 상자 + 다시 시도", () => {
    qState.error = true;
    act(() =>
      root.render(
        <FixedBulkPage
          startDate="2026-10-01"
          endDate="2026-10-31"
          onClose={() => {}}
        />,
      ),
    );
    const page = document.querySelector("[data-slot=fixed-bulk-page]")!;
    expect(page.textContent).toContain("fixed.bulk.loadFailed");
    expect(page.textContent).not.toContain("fixed.bulk.empty");
    const retry = page.querySelector(
      "[data-slot=result-section] button",
    ) as HTMLButtonElement | null;
    expect(retry).not.toBeNull();
    act(() => retry!.click());
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
