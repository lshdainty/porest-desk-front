import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { memoTagKeys, memoKeys } from "@/shared/config";
import { memoTagApi } from "../api/memoTagApi";
import type { MemoTagFormValues } from "@/entities/memo-tag";

export const useMemoTags = () => {
  return useQuery({
    queryKey: memoTagKeys.list(),
    queryFn: () => memoTagApi.getTags(),
  });
};

export const useCreateMemoTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: MemoTagFormValues) => memoTagApi.createTag(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memoTagKeys.all });
    },
  });
};

/**
 * 개명은 메모까지 바꾼다 — 서버가 `memo.tag` 문자열을 새 이름으로 옮기기 때문이다
 * (`MemoTagServiceImpl.updateTag`). 메모 캐시를 안 버리면 화면엔 옛 이름이 남고,
 * 그 메모를 다음에 저장할 때 옛 이름의 태그가 새로 만들어진다(QA #88 의 되살아남).
 */
export const useUpdateMemoTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: MemoTagFormValues }) =>
      memoTagApi.updateTag(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memoTagKeys.all });
      queryClient.invalidateQueries({ queryKey: memoKeys.all });
    },
  });
};

/** 삭제도 메모를 바꾼다 — 그 태그를 쓰던 메모의 태그가 서버에서 비워진다. */
export const useDeleteMemoTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => memoTagApi.deleteTag(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memoTagKeys.all });
      queryClient.invalidateQueries({ queryKey: memoKeys.all });
    },
  });
};
