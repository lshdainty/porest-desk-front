import { apiClient } from "@/shared/api";
import type { ApiResponse } from "@/shared/types";
import type {
  Expense,
  ExpenseFormValues,
  RangeSummary,
  MonthlyTrend,
  MerchantSummary,
  HeatmapCell,
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

  deleteExpense: async (id: number): Promise<void> => {
    const resp: ApiResponse<void> = await apiClient.delete(`/v1/expense/${id}`);
    return resp.data;
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
