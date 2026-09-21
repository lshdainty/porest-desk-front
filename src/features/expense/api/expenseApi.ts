import { apiClient } from "@/shared/api";
import type { ApiResponse } from "@/shared/types";
import type {
  Expense,
  ExpenseFormValues,
  RangeSummary,
  MonthlyTrend,
  MerchantSummary,
  HeatmapCell,
  RefundPreview,
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
   * 환불 마크 — 원거래에 표식을 찍는다. 수입 행을 만들지 않는다.
   *
   * 환불일을 안 주면 서버가 지금으로 찍는다. 카드였고 그 회차를 이미 냈다면 남는 돈만큼
   * 결제계좌로 환급 이체가 함께 생긴다(응답의 `refundTransferRowId`).
   */
  refund: async (id: number, refundedAt?: string): Promise<Expense> => {
    const resp: ApiResponse<Expense> = await apiClient.post(
      `/v1/expense/${id}/refund`,
      refundedAt ? { refundedAt } : {},
    );
    return resp.data;
  },

  /** 환불 취소 — 표식·환급 이체를 무르고 원거래를 되살린다. */
  cancelRefund: async (id: number): Promise<Expense> => {
    const resp: ApiResponse<Expense> = await apiClient.delete(
      `/v1/expense/${id}/refund`,
    );
    return resp.data;
  },

  /**
   * 지우면 결제계좌로 얼마가 돌아오는지 **미리** 센다(설계 13-1).
   *
   * 쿼리를 비우면 삭제 미리보기다. 수정 미리보기는 바뀔 값만 싣는다. 서버는 DB 를
   * 바꾸지 않는다.
   *
   * 확인창을 네트워크에 묶지 않으려고 **3초**에서 끊는다 — 그때는 화면이 금액 없는
   * 문구로 넘어간다(`paidDeleteFallback`). 확인 버튼은 이 호출을 기다리지 않는다.
   */
  refundPreview: async (
    id: number,
    params?: {
      amount?: number;
      assetRowId?: number | null;
      expenseDate?: string;
      installmentMonths?: number | null;
    },
  ): Promise<RefundPreview> => {
    const resp: ApiResponse<RefundPreview> = await apiClient.get(
      `/v1/expense/${id}/refund-preview`,
      { params, timeout: 3000 },
    );
    return resp.data;
  },

  /**
   * 새 카드 지출을 저장하면 어떻게 되는지 **미리** 센다 — 결제가 끝난 회차면 기록만
   * 남고(`newRecordAmount`), 오늘이 결제일이면 결제계좌에서 추가로 빠진다
   * (`sameDayExtraPayment`). 서버는 DB 를 바꾸지 않는다. 3초에서 끊는다 — 저장 확인을
   * 네트워크에 묶지 않는다.
   */
  cardSavePreview: async (params: {
    assetRowId: number;
    amount: number;
    expenseDate: string;
    installmentMonths?: number | null;
  }): Promise<RefundPreview> => {
    const resp: ApiResponse<RefundPreview> = await apiClient.get(
      `/v1/expense/card-save-preview`,
      { params, timeout: 3000 },
    );
    return resp.data;
  },

  /**
   * 지운다. 결제 완료 회차의 카드 거래였다면 결제계좌로 돌려준 금액이 함께 온다 —
   * 화면이 "결제계좌로 N원이 환급됐어요" 를 말할 재료다(설계 13-1).
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
