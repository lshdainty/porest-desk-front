import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePendingIds } from "@/shared/lib/porest/use-pending-ids";
import { memoKeys } from "@/shared/config";
import { memoApi } from "../api/memoApi";
import type { MemoListParams } from "../api/memoApi";
import type { MemoFormValues } from "@/entities/memo";

export const useMemos = (filters?: MemoListParams) => {
  return useQuery({
    queryKey: memoKeys.list(filters),
    queryFn: () => memoApi.getMemos(filters),
  });
};

export const useMemo = (id: number) => {
  return useQuery({
    queryKey: memoKeys.detail(id),
    queryFn: () => memoApi.getMemo(id),
    enabled: id > 0,
  });
};

export const useCreateMemo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: MemoFormValues) => memoApi.createMemo(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memoKeys.all });
    },
  });
};

export const useUpdateMemo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: MemoFormValues }) =>
      memoApi.updateMemo(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memoKeys.all });
    },
  });
};

export const useToggleMemoPin = () => {
  const queryClient = useQueryClient();
  const { pendingIds, begin, end } = usePendingIds();

  const mutation = useMutation({
    mutationFn: (id: number) => memoApi.togglePin(id),
    onMutate: (id: number) => begin(id),
    onSettled: (_data, _error, id) => end(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memoKeys.all });
    },
  });
  /** 진행 중인 항목 id — 그 항목만 스피너·잠금. */
  return { ...mutation, pendingIds };
};

export const useDeleteMemo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => memoApi.deleteMemo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memoKeys.all });
    },
  });
};
