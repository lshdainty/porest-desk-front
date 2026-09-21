import { apiClient } from "@/shared/api";
import type { QuietRequestConfig } from "@/shared/api";
import type { ApiResponse } from "@/shared/types";
import type {
  Expense,
  ExpenseFormValues,
  RangeSummary,
  MonthlyTrend,
  MerchantSummary,
  HeatmapCell,
  DeleteExpenseResult,
} from "@/entities/expense";

export interface ExpenseListParams {
  expenseType?: string;
  categoryId?: number;
  assetId?: number;
  startDate?: string;
  endDate?: string;
}

export interface ExpenseSearchParams {
  categoryId?: number;
  assetId?: number;
  expenseType?: string;
  keyword?: string;
  merchant?: string;
  minAmount?: number;
  maxAmount?: number;
  startDate?: string;
  endDate?: string;
}

export const expenseApi = {
  createExpense: async (data: ExpenseFormValues): Promise<Expense> => {
    const resp: ApiResponse<Expense> = await apiClient.post(
      "/v1/expense",
      data,
    );
    return resp.data;
  },

  getExpenses: async (params?: ExpenseListParams): Promise<Expense[]> => {
    const resp: ApiResponse<{ expenses: Expense[] }> = await apiClient.get(
      "/v1/expenses",
      { params },
    );
    return resp.data.expenses;
  },

  updateExpense: async (
    id: number,
    data: ExpenseFormValues,
  ): Promise<Expense> => {
    const resp: ApiResponse<Expense> = await apiClient.put(
      `/v1/expense/${id}`,
      data,
    );
    return resp.data;
  },

  /**
   * 고쳐 쓰기(D13) — 결제가 끝나 돈 칸이 잠긴 거래를 **새 거래로 교체**한다.
   *
   * 본문은 새로 만들 때(`POST /expense`)와 같다. 서버가 한 트랜잭션에서 옛 거래를 지우고
   * 새 거래를 만들며 분할·더치페이·반복 연결·일정·할 일 연결을 옮긴다. `splits` 를 실으면
   * 그 분할로 옮기고, 안 실으면 옛 분할을 그대로 옮긴다(합이 새 금액과 안 맞으면 400).
   *
   * 응답은 **새 거래**다(새 rowId). 선결제 환급이 생겼으면 `refundedAmount` 가 실린다.
   *
   * 404 는 전역 토스트로 띄우지 않는다(`silentStatuses`). 옛 거래가 이미 없다는 뜻인데, 응답만
   * 못 받고 다시 누른 경우라면 교체는 앞선 요청에서 이미 끝났다 — "찾을 수 없어요" 는 거짓
   * 안내다. 호출처가 목록을 다시 읽고 시트를 닫는다(QA 26 5).
   */
  replaceExpense: async (
    id: number,
    data: ExpenseFormValues,
  ): Promise<Expense> => {
    const config: QuietRequestConfig = { silentStatuses: [404] };
    const resp: ApiResponse<Expense> = await apiClient.post(
      `/v1/expense/${id}/replace`,
      data,
      config,
    );
    return resp.data;
  },

  /**
   * 환불 마크 — 원거래에 표식을 찍는다. 수입 행을 만들지 않는다.
   *
   * 환불일을 안 주면 서버가 지금으로 찍는다. 환불일은 거래일부터 오늘까지다(D16).
   * 결제가 끝난 회차의 카드 거래면 통계에서만 빠지고 통장은 그대로다(D1). 열린 회차에서
   * 미리 낸 돈이 남으면 결제계좌로 돌려준다(응답의 `refundedAmount`, D3·D4).
   */
  refund: async (id: number, refundedAt?: string): Promise<Expense> => {
    const resp: ApiResponse<Expense> = await apiClient.post(
      `/v1/expense/${id}/refund`,
      refundedAt ? { refundedAt } : {},
    );
    return resp.data;
  },

  /**
   * 환불 취소 — 표식을 걷고 원거래를 되살린다. 옛 환불이 만든 환급 이체가 묶여 있으면
   * (`refundTransferRowId`) 그 이체도 되돌린다.
   */
  cancelRefund: async (id: number): Promise<Expense> => {
    const resp: ApiResponse<Expense> = await apiClient.delete(
      `/v1/expense/${id}/refund`,
    );
    return resp.data;
  },

  /**
   * 지운다. 열린 회차에서 미리 낸 돈이 남아 결제계좌로 돌려줬다면 그 금액이 함께 온다 —
   * 화면이 "미리 낸 돈 중 N원이 계좌로 돌아왔어요" 를 말할 재료다(D4).
   */
  deleteExpense: async (id: number): Promise<DeleteExpenseResult> => {
    const resp: ApiResponse<DeleteExpenseResult | null> =
      await apiClient.delete(`/v1/expense/${id}`);
    return resp.data ?? { refundedAmount: null };
  },

  getRangeSummary: async (
    startDate: string,
    endDate: string,
    assetId?: number | null,
  ): Promise<RangeSummary> => {
    const resp: ApiResponse<RangeSummary> = await apiClient.get(
      "/v1/expenses/summary/range",
      { params: { startDate, endDate, assetId } },
    );
    return resp.data;
  },

  getMonthlyTrend: async (months = 6): Promise<MonthlyTrend[]> => {
    const resp: ApiResponse<{ trends: MonthlyTrend[] }> = await apiClient.get(
      "/v1/expenses/summary/trend",
      { params: { months } },
    );
    return resp.data.trends;
  },

  getMerchantSummary: async (
    startDate?: string,
    endDate?: string,
  ): Promise<{ merchants: MerchantSummary[] }> => {
    const resp: ApiResponse<{ merchants: MerchantSummary[] }> =
      await apiClient.get("/v1/expenses/summary/by-merchant", {
        params: { startDate, endDate },
      });
    return resp.data;
  },

  getHeatmap: async (
    startDate: string,
    endDate: string,
  ): Promise<HeatmapCell[]> => {
    const resp: ApiResponse<{ cells: HeatmapCell[] }> = await apiClient.get(
      "/v1/expenses/summary/heatmap",
      { params: { startDate, endDate } },
    );
    return resp.data.cells;
  },

  searchExpenses: async (params: ExpenseSearchParams): Promise<Expense[]> => {
    const resp: ApiResponse<{ expenses: Expense[] }> = await apiClient.get(
      "/v1/expenses/search",
      { params },
    );
    return resp.data.expenses;
  },
};
