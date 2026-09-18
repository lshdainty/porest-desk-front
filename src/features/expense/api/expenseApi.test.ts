// 환불이 **보내는 것**을 고정한다 (설계서 3절 · 앱 desk-app 의 미러).
//
// 환불은 전용 경로다 — `POST /v1/expense/{id}/refund` 로 표식을 찍고
// `DELETE` 로 걷는다. 수정 PUT 으로는 환불을 만들 수도 풀 수도 없다
// (서버가 폐기된 `refundOfExpenseRowId` 를 EXP_044 로 막는다).
//
// - **환불일은 있을 때만 싣는다.** 안 고르면 본문을 비워 서버가 제 시각을 쓴다.
//   `{ refundedAt: undefined }` 를 실으면 직렬화에서 키째 빠지므로 결과는 같지만,
//   "안 골랐다" 를 본문 모양으로 드러내 두는 편이 읽기 쉽다.
// - **다른 칸은 안 싣는다.** 서버가 안 온 칸을 그대로 두므로(QA #96 · `Patch.from`)
//   금액·카테고리·일시를 다시 실을 이유가 없고, 다시 실으면 상세가 열려 있는 사이
//   앱에서 바뀐 값을 옛 값으로 덮는다.
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ExpenseFormValues } from "@/entities/expense";

const { put, post, del, get } = vi.hoisted(() => ({
  put: vi.fn(),
  post: vi.fn(),
  del: vi.fn(),
  get: vi.fn(),
}));

vi.mock("@/shared/api", () => ({
  apiClient: { put, post, get, delete: del },
}));

const { expenseApi } = await import("./expenseApi");

beforeEach(() => {
  get.mockReset().mockResolvedValue({
    data: { applies: false, refundAmount: 0, reason: "NOT_CARD" },
  });
  put.mockReset().mockResolvedValue({ data: { rowId: 77 } });
  post.mockReset().mockResolvedValue({ data: { rowId: 77 } });
  del.mockReset().mockResolvedValue({ data: { rowId: 77 } });
});

/**
 * 서버가 실제로 받는 본문.
 *
 * axios 는 객체를 `JSON.stringify` 로 보낸다 — 값이 `undefined` 인 키는 그때 통째로
 * 사라진다. 그래서 "키가 있느냐" 는 자바스크립트 객체가 아니라 **직렬화 결과**로 본다.
 */
const wire = () =>
  JSON.parse(JSON.stringify(put.mock.calls[0]![1])) as Record<string, unknown>;

describe("환불 마크·취소", () => {
  it("환불은 전용 경로로 POST 한다 — 수정 PUT 을 타지 않는다", async () => {
    post.mockResolvedValue({
      data: { rowId: 77, refundedAt: "2026-09-18T12:00:00" },
    });

    await expenseApi.refund(77, "2026-09-18T12:00:00");

    expect(post).toHaveBeenCalledWith("/v1/expense/77/refund", {
      refundedAt: "2026-09-18T12:00:00",
    });
    // 옛 모델처럼 수정 PUT 으로 환불을 만들면 안 된다 — 그쪽은 이제 400 이다.
    expect(put).not.toHaveBeenCalled();
  });

  it("환불일을 안 주면 본문을 비워 보낸다 — 서버가 지금으로 찍는다", async () => {
    post.mockResolvedValue({ data: { rowId: 77 } });

    await expenseApi.refund(77);

    expect(post).toHaveBeenCalledWith("/v1/expense/77/refund", {});
  });

  it("취소는 DELETE 다", async () => {
    del.mockResolvedValue({ data: { rowId: 77, refundedAt: null } });

    await expect(expenseApi.cancelRefund(77)).resolves.toEqual({
      rowId: 77,
      refundedAt: null,
    });
    expect(del).toHaveBeenCalledWith("/v1/expense/77/refund");
  });
});

describe("편집 저장은 환불 표식을 못 건드린다", () => {
  it("폼 본문에 환불 칸이 없으면 그대로 안 나간다", async () => {
    // 편집 시트가 만드는 본문에는 환불 칸이 없다. 통째로 흘려보내므로, 여기서 값을
    // 지어내지 않는다는 것만 확인하면 된다 — 찍고 걷는 자리는 전용 경로 둘뿐이다.
    // 폐기된 옛 키가 섞이면 서버가 EXP_044 로 400 을 낸다.
    const form = {
      expenseType: "EXPENSE",
      amount: 3000,
      categoryRowId: 11,
      expenseDate: "2026-09-05T12:30:00",
    } as unknown as ExpenseFormValues;
    await expenseApi.updateExpense(77, form);

    expect(wire()).not.toHaveProperty("refundedAt");
    expect(wire()).not.toHaveProperty("refundTransferRowId");
    expect(wire()).not.toHaveProperty("refundOfExpenseRowId");
  });
});

/**
 * 환급 미리보기 — 확인창이 저장하기 **전에** 금액을 묻는 자리(설계 13-1).
 *
 * 잠그는 것 둘: ① 쿼리를 비우면 삭제 미리보기다(수정 값을 지어내지 않는다)
 * ② 확인창을 네트워크에 묶지 않으려고 **3초**에서 끊는다.
 */
describe("환급 미리보기", () => {
  it("삭제 미리보기는 쿼리를 안 싣는다", async () => {
    get.mockResolvedValue({
      data: { applies: true, refundAmount: 58_600, reason: "OK" },
    });

    await expect(expenseApi.refundPreview(77)).resolves.toEqual({
      applies: true,
      refundAmount: 58_600,
      reason: "OK",
    });
    expect(get).toHaveBeenCalledWith("/v1/expense/77/refund-preview", {
      params: undefined,
      timeout: 3000,
    });
  });

  it("수정 미리보기는 바뀔 값만 싣는다", async () => {
    await expenseApi.refundPreview(77, {
      amount: 20_000,
      assetRowId: 9,
      expenseDate: "2026-09-10T12:00:00",
    });

    expect(get).toHaveBeenCalledWith("/v1/expense/77/refund-preview", {
      params: {
        amount: 20_000,
        assetRowId: 9,
        expenseDate: "2026-09-10T12:00:00",
      },
      timeout: 3000,
    });
  });
});

/**
 * 삭제 응답 — 결제계좌로 돌려준 금액이 함께 온다. 옛 서버는 `data` 가 없으므로
 * 그때도 깨지지 않아야 한다(응답을 읽는 쪽이 늘 객체를 받게 둔다).
 */
describe("삭제는 환급액을 돌려준다", () => {
  it("환급이 있으면 금액이 온다", async () => {
    del.mockResolvedValue({ data: { refundedAmount: 58_600 } });

    await expect(expenseApi.deleteExpense(77)).resolves.toEqual({
      refundedAmount: 58_600,
    });
    expect(del).toHaveBeenCalledWith("/v1/expense/77");
  });

  it("응답에 본문이 없어도 객체를 돌려준다", async () => {
    del.mockResolvedValue({ data: null });

    await expect(expenseApi.deleteExpense(77)).resolves.toEqual({
      refundedAmount: null,
    });
  });
});
