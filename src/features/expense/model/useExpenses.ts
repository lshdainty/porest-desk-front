import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { assetKeys, expenseKeys, expenseSplitKeys } from "@/shared/config";
import { expenseApi } from "../api/expenseApi";
import type { ExpenseListParams, ExpenseSearchParams } from "../api/expenseApi";
import type { ExpenseFormValues } from "@/entities/expense";

export const useExpenses = (filters?: ExpenseListParams) => {
  return useQuery({
    queryKey: expenseKeys.list(filters),
    queryFn: () => expenseApi.getExpenses(filters),
  });
};

export const useCreateExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ExpenseFormValues) => expenseApi.createExpense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.all });
      // 거래는 자산 잔액에 영향 — 자산 잔액/상세/추이도 무효화.
      queryClient.invalidateQueries({ queryKey: assetKeys.all });
    },
  });
};

export const useUpdateExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ExpenseFormValues }) =>
      expenseApi.updateExpense(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.all });
      // 거래는 자산 잔액에 영향 — 자산 잔액/상세/추이도 무효화.
      queryClient.invalidateQueries({ queryKey: assetKeys.all });
      // 분할 동시 수정(splits 전달)으로 분할 내역이 교체될 수 있음 — 분할 쿼리도 무효화.
      queryClient.invalidateQueries({ queryKey: expenseSplitKeys.all });
    },
  });
};

/**
 * 환불 연결 끊기 (D3) — 거래는 남고 연결만 사라진다.
 *
 * 무효화 범위가 이 훅의 핵심이다. **원거래가 다른 달일 수 있다** — 이 거래의 달만
 * 무효화하면 원거래가 있는 달 목록이 옛 환불 배지·환불액을 들고 남는다. 그래서
 * `expenseKeys.all` 로 통째로 턴다(수정·삭제와 같은 범위).
 *
 * 자산 잔액은 안 건드린다 — 금액도 자산도 그대로고 종류(수입)도 안 바뀐다. 바뀌는 건
 * 통계에서 이 수입이 지출을 상계하느냐뿐이고, 그 집계는 전부 `expenseKeys` 아래다.
 */
export const useUnlinkRefund = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => expenseApi.unlinkRefund(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.all });
    },
  });
};

export const useDeleteExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => expenseApi.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.all });
      // 거래는 자산 잔액에 영향 — 자산 잔액/상세/추이도 무효화.
      queryClient.invalidateQueries({ queryKey: assetKeys.all });
    },
  });
};

export const useDailySummary = (date: string) => {
  return useQuery({
    queryKey: expenseKeys.dailySummary(date),
    queryFn: () => expenseApi.getDailySummary(date),
    enabled: !!date,
  });
};

export const useRangeSummary = (
  startDate: string,
  endDate: string,
  assetId?: number | null,
) => {
  return useQuery({
    queryKey: expenseKeys.rangeSummary(startDate, endDate, assetId),
    queryFn: () => expenseApi.getRangeSummary(startDate, endDate, assetId),
    enabled: !!startDate && !!endDate,
  });
};

export const useMonthlyTrend = (months = 6) => {
  return useQuery({
    queryKey: expenseKeys.monthlyTrend(months),
    queryFn: () => expenseApi.getMonthlyTrend(months),
    enabled: months > 0,
  });
};

export const useMerchantSummary = (startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: expenseKeys.merchantSummary({ startDate, endDate }),
    queryFn: () => expenseApi.getMerchantSummary(startDate, endDate),
  });
};

export const useExpenseHeatmap = (startDate: string, endDate: string) => {
  return useQuery({
    queryKey: expenseKeys.heatmap(startDate, endDate),
    queryFn: () => expenseApi.getHeatmap(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });
};

export const useAssetExpenseSummary = (
  startDate?: string,
  endDate?: string,
) => {
  return useQuery({
    queryKey: expenseKeys.assetSummary({ startDate, endDate }),
    queryFn: () => expenseApi.getAssetSummary(startDate, endDate),
  });
};

export const useSearchExpenses = (params: ExpenseSearchParams) => {
  return useQuery({
    queryKey: expenseKeys.search(params),
    queryFn: () => expenseApi.searchExpenses(params),
    enabled: Object.values(params).some((v) => v !== undefined && v !== ""),
  });
};

export const useExpensesByCalendarEvent = (eventId: number) => {
  return useQuery({
    queryKey: expenseKeys.byCalendarEvent(eventId),
    queryFn: () => expenseApi.getExpensesByCalendarEvent(eventId),
    enabled: eventId > 0,
  });
};

export const useExpensesByTodo = (todoId: number) => {
  return useQuery({
    queryKey: expenseKeys.byTodo(todoId),
    queryFn: () => expenseApi.getExpensesByTodo(todoId),
    enabled: todoId > 0,
  });
};
