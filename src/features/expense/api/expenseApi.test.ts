// 환불 취소가 **보내는 것**을 고정한다 (D3 · 앱 desk-app #331 의 미러).
//
// 본문은 키 하나뿐이다 — `{ refundOfExpenseRowId: null }`.
//
// - **명시적 `null` 이어야 한다.** `undefined` 면 직렬화에서 키째 빠져
//   (`ExpenseApiDto.UpdateRequest` 의 `Optional<Long>`) 서버가 옛 연결을 지킨다.
//   화면은 끊긴 듯 닫히는데 원거래의 지출 상계는 그대로 남는다.
// - **다른 칸은 안 싣는다.** 서버가 안 온 칸을 그대로 두므로(QA #96 · `Patch.from`)
//   금액·카테고리·일시를 다시 실을 이유가 없고, 다시 실으면 상세가 열려 있는 사이
//   앱에서 바뀐 값을 옛 값으로 덮는다.
//
// 반대편도 잠근다 — `updateExpense` 는 이 키를 **못 싣는다**(QA #108). 편집 시트엔
// 환불 연결 칸이 없어서, 실었다가는 메모만 고쳐도 연결이 끊긴다.
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ExpenseFormValues } from "@/entities/expense";

const { put } = vi.hoisted(() => ({ put: vi.fn() }));

vi.mock("@/shared/api", () => ({
  apiClient: { put, post: vi.fn(), get: vi.fn(), delete: vi.fn() },
}));

const { expenseApi } = await import("./expenseApi");

beforeEach(() => {
  put.mockReset().mockResolvedValue({ data: { rowId: 77 } });
});

/**
 * 서버가 실제로 받는 본문.
 *
 * axios 는 객체를 `JSON.stringify` 로 보낸다 — 값이 `undefined` 인 키는 그때 통째로
 * 사라진다. 그래서 "키가 있느냐" 는 자바스크립트 객체가 아니라 **직렬화 결과**로 본다.
 */
const wire = () =>
  JSON.parse(JSON.stringify(put.mock.calls[0]![1])) as Record<string, unknown>;

describe("환불 취소 PUT 본문 (D3)", () => {
  it("연결 끊기 키 하나만, 명시적 null 로 나간다", async () => {
    await expenseApi.unlinkRefund(77);

    expect(put).toHaveBeenCalledTimes(1);
    expect(put.mock.calls[0]![0]).toBe("/v1/expense/77");
    // 직렬화 뒤에도 키가 남아 있어야 한다 — 빠지면 서버가 옛 연결을 지킨다.
    expect(wire()).toHaveProperty("refundOfExpenseRowId");
    expect(wire().refundOfExpenseRowId).toBeNull();
    expect(Object.keys(wire())).toEqual(["refundOfExpenseRowId"]);
  });

  it("서버가 다시 그려 준 거래를 돌려준다 — 상세가 그 자리에서 갱신된다", async () => {
    put.mockResolvedValue({ data: { rowId: 77, refundOfExpenseRowId: null } });

    await expect(expenseApi.unlinkRefund(77)).resolves.toEqual({
      rowId: 77,
      refundOfExpenseRowId: null,
    });
  });
});

describe("편집 저장은 환불 연결을 못 건드린다 (QA #108)", () => {
  it("폼 본문에 그 키가 없으면 그대로 안 나간다", async () => {
    // 편집 시트가 만드는 본문에는 이 키가 없다. 통째로 흘려보내므로, 여기서 값을
    // 지어내지 않는다는 것만 확인하면 된다 — 끊는 자리는 `unlinkRefund` 하나다.
    const form = {
      expenseType: "INCOME",
      amount: 3000,
      categoryRowId: 21,
      expenseDate: "2026-09-05T12:30:00",
    } as unknown as ExpenseFormValues;
    await expenseApi.updateExpense(77, form);

    expect(wire()).not.toHaveProperty("refundOfExpenseRowId");
  });
});
