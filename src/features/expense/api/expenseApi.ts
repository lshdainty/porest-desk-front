import { apiClient } from "@/shared/api";
import type { ApiResponse } from "@/shared/types";
import type {
  Expense,
  ExpenseFormValues,
  DailySummary,
  RangeSummary,
  MonthlyTrend,
  MerchantSummary,
  AssetExpenseSummary,
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
   * 환불 연결만 끊는다 — 거래는 그대로 남는다 (D3).
   *
   * 본문은 **키 하나뿐**이다. 서버가 안 온 칸을 그대로 두므로(QA #96 · `Patch.from`)
   * 금액·카테고리·일시를 다시 실을 이유가 없고, 다시 실으면 상세가 열려 있는 사이
   * 앱에서 바뀐 값을 옛 값으로 덮는다. 그래서 `ExpenseFormValues` 를 재사용하지 않고
   * 전용 경로를 뒀다 — 그 타입은 금액·날짜를 required 로 잡는다.
   *
   * `updateExpense` 는 반대로 이 키를 **못 싣는다**. 편집 시트엔 환불 연결 칸이 없어서
   * 메모만 고쳐도 연결이 끊기던 자리다(QA #108). 끊는 자리는 여기 하나다.
   * 앱도 같은 판단이다(desk-app #331 `ExpenseRepository.unlinkRefund`).
   */
  unlinkRefund: async (id: number): Promise<Expense> => {
    const resp: ApiResponse<Expense> = await apiClient.put(
      `/v1/expense/${id}`,
      // 명시적 `null` 이어야 한다 — `undefined` 면 직렬화에서 키째 빠져 서버가 옛
      // 연결을 지킨다(`ExpenseApiDto.UpdateRequest` 의 `Optional<Long>`).
      { refundOfExpenseRowId: null },
    );
    return resp.data;
  },

  deleteExpense: async (id: number): Promise<void> => {
    const resp: ApiResponse<void> = await apiClient.delete(`/v1/expense/${id}`);
    return resp.data;
  },

  getDailySummary: async (date: string): Promise<DailySummary> => {
    const resp: ApiResponse<DailySummary> = await apiClient.get(
      "/v1/expenses/summary/daily",
      { params: { date } },
    );
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

  getAssetSummary: async (
    startDate?: string,
    endDate?: string,
  ): Promise<{ assets: AssetExpenseSummary[] }> => {
    const resp: ApiResponse<{ assets: AssetExpenseSummary[] }> =
      await apiClient.get("/v1/expenses/summary/by-asset", {
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

  getExpensesByCalendarEvent: async (eventId: number): Promise<Expense[]> => {
    const resp: ApiResponse<{ expenses: Expense[] }> = await apiClient.get(
      `/v1/calendar/event/${eventId}/expenses`,
    );
    return resp.data.expenses;
  },

  getExpensesByTodo: async (todoId: number): Promise<Expense[]> => {
    const resp: ApiResponse<{ expenses: Expense[] }> = await apiClient.get(
      `/v1/todo/${todoId}/expenses`,
    );
    return resp.data.expenses;
  },
};
