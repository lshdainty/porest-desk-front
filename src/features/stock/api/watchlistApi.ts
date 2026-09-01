/**
 * 증권 관심목록 react-query 훅 (서버 stock-watch — 게이트 없음, 로그인만).
 * 관심목록은 그룹(탭) + 소속 종목 구조. 종목 마스터 정보(이름·시장·통화)는 서버가 조인해 내려준다.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { stockKeys } from "@/shared/config";
import { stockApi, type WatchGroup } from "./stockApi";

export function useWatchGroups(enabled = true) {
  return useQuery({
    queryKey: stockKeys.watchGroups(),
    queryFn: () => stockApi.getWatchGroups(),
    enabled,
    retry: false,
    staleTime: 60_000,
  });
}

function useInvalidateWatch() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: stockKeys.watchGroups() });
}

export function useCreateWatchGroup() {
  const invalidate = useInvalidateWatch();
  return useMutation({
    mutationFn: (groupName: string) => stockApi.createWatchGroup(groupName),
    onSuccess: invalidate,
  });
}

export function useRenameWatchGroup() {
  const invalidate = useInvalidateWatch();
  return useMutation({
    mutationFn: ({
      groupId,
      groupName,
    }: {
      groupId: number;
      groupName: string;
    }) => stockApi.renameWatchGroup(groupId, groupName),
    onSuccess: invalidate,
  });
}

export function useDeleteWatchGroup() {
  const invalidate = useInvalidateWatch();
  return useMutation({
    mutationFn: (groupId: number) => stockApi.deleteWatchGroup(groupId),
    onSuccess: invalidate,
  });
}

export function useAddWatchItem() {
  const invalidate = useInvalidateWatch();
  return useMutation({
    mutationFn: ({
      groupId,
      symbol,
      marketCode,
    }: {
      groupId: number;
      symbol: string;
      marketCode?: string;
    }) => stockApi.addWatchItem(groupId, symbol, marketCode),
    onSuccess: invalidate,
  });
}

export function useRemoveWatchItem() {
  const invalidate = useInvalidateWatch();
  return useMutation({
    mutationFn: (itemId: number) => stockApi.removeWatchItem(itemId),
    onSuccess: invalidate,
  });
}

/** 전 그룹에서 심볼이 담긴 그룹/항목을 찾는다 (별 토글 판정·전체 해제용). */
export function findWatchEntries(
  groups: WatchGroup[] | undefined,
  symbol: string,
) {
  if (!groups) return [];
  return groups.flatMap((g) =>
    g.items
      .filter((i) => i.symbol === symbol)
      .map((i) => ({ group: g, item: i })),
  );
}
