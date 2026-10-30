import { beforeEach, describe, expect, it, vi } from "vitest";

const del = vi.hoisted(() => vi.fn());
const post = vi.hoisted(() => vi.fn());
const put = vi.hoisted(() => vi.fn());
vi.mock("@/shared/api", () => ({
  apiClient: { delete: del, post, put },
}));

const { expenseBudgetApi } = await import("./expenseBudgetApi");

const ok = { data: { rowId: 1 } };
beforeEach(() => {
  del.mockReset().mockResolvedValue(ok);
  post.mockReset().mockResolvedValue(ok);
  put.mockReset().mockResolvedValue(ok);
});

describe("expenseBudgetApi 전역 오류 토스트(M5)", () => {
  it("삭제는 늘 silent — 호출처 스낵바가 실패를 알린다", async () => {
    await expenseBudgetApi.deleteBudget(7);
    expect(del).toHaveBeenCalledWith("/v1/expense/budget/7", { silent: true });
  });

  it("만들기 · 고치기는 옵션을 줄 때만 silent, 안 주면 켜 둔다(폼 저장)", async () => {
    const d = {
      categoryRowId: null,
      budgetAmount: 1,
      budgetYear: 2026,
      budgetMonth: 10,
    };
    await expenseBudgetApi.createBudget(d, { silent: true });
    expect(post.mock.calls[0]![2]).toEqual({ silent: true });
    await expenseBudgetApi.createBudget(d);
    expect(post.mock.calls[1]![2]?.silent).toBeUndefined();
    await expenseBudgetApi.updateBudget(
      3,
      { budgetAmount: 2 },
      { silent: true },
    );
    expect(put.mock.calls[0]![2]).toEqual({ silent: true });
    await expenseBudgetApi.updateBudget(3, { budgetAmount: 2 });
    expect(put.mock.calls[1]![2]?.silent).toBeUndefined();
  });
});
