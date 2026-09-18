import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { expenseKeys, invalidateFor } from "@/shared/config";
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
    onSuccess: () => invalidateFor(queryClient, "ledger"),
  });
};

export const useUpdateExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ExpenseFormValues }) =>
      expenseApi.updateExpense(id, data),
    onSuccess: () => invalidateFor(queryClient, "ledger"),
  });
};

/**
 * 환불 마크·취소.
 *
 * 무효화 범위가 이 훅의 핵심이다. 환불은 **원거래 달**의 합계를 바꾼다 — 오늘 누른
 * 환불이 지난달 지출을 줄인다. 그래서 이 거래의 달만 털면 안 되고, 다른 거래 변경과
 * 같은 범위(`"ledger"`)로 통째로 턴다. 카드였다면 **잔액·이체까지 움직이므로**
 * 자산 쪽도 함께 무효화되는 그 범위가 맞다.
 */
export const useRefundExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, refundedAt }: { id: number; refundedAt?: string }) =>
      expenseApi.refund(id, refundedAt),
    onSuccess: () => invalidateFor(queryClient, "ledger"),
  });
};

export const useCancelRefund = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => expenseApi.cancelRefund(id),
    onSuccess: () => invalidateFor(queryClient, "ledger"),
  });
};

/**
 * 삭제·수정 확인창이 열릴 때 도는 환급 미리보기(설계 13-1).
 *
 * `enabled` 로 확인창이 열린 동안만 돈다 — 상세를 열기만 해도 부르면 목록을 훑는 동안
 * 쓸데없는 요청이 쌓인다. 실패는 재시도하지 않는다: 확인창은 3초를 넘기면 금액 없는
 * 문구로 넘어가야 하고, 재시도가 그 폴백을 뒤로 밀면 사용자가 빈 자리를 더 오래 본다.
 */
export const useRefundPreview = (
  id: number | null,
  enabled: boolean,
  params?: {
    amount?: number;
    assetRowId?: number | null;
    expenseDate?: string;
  },
) =>
  useQuery({
    queryKey: ["expense", "refund-preview", id, params ?? null],
    queryFn: () => expenseApi.refundPreview(id!, params),
    enabled: enabled && id != null,
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });

export const useDeleteExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => expenseApi.deleteExpense(id),
    onSuccess: () => invalidateFor(queryClient, "ledger"),
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

export const useSearchExpenses = (params: ExpenseSearchParams) => {
  return useQuery({
    queryKey: expenseKeys.search(params),
    queryFn: () => expenseApi.searchExpenses(params),
    enabled: Object.values(params).some((v) => v !== undefined && v !== ""),
  });
};
