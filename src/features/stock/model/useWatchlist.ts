/**
 * 관심목록 한 벌 — 그룹 탭 상태 + 별 토글.
 *
 * **관심목록은 증권사와 무관하다.** 서버 `stock_watch` 는 종목 마스터(`stock_master_row_id`)를
 * 가리킬 뿐 증권사 컬럼이 없고, `/api/v1/stock-watch/**` 도 증권사를 묻지 않는다. 그래서
 * 토스에서 등록한 종목이 나무 화면에도 그대로 별로 보인다 — 사용자 한 명의 관심 종목이지
 * 계좌별 목록이 아니다.
 *
 * 토스 페이지 안에 있던 로직을 그대로 끌어냈다. 나무가 자기 토글을 새로 쓰면 "첫 등록이면
 * 기본 그룹부터 만든다" · "해제는 전 그룹에서 지운다" 같은 규칙이 한쪽에만 남는다.
 */
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { WatchGroup } from "../api/stockApi";
import {
  findWatchEntries,
  useAddWatchItem,
  useCreateWatchGroup,
  useRemoveWatchItem,
  useWatchGroups,
} from "../api/watchlistApi";

export interface Watchlist {
  groups: WatchGroup[];
  /** 지금 열린 그룹. 그룹이 하나도 없으면 null. */
  activeGroup: WatchGroup | null;
  activeGroupId: number | null;
  setActiveGroupId: (id: number) => void;
  /** 전 그룹을 합친 관심 종목 집합 — 별 판정용. */
  watchedSymbols: Set<string>;
  isWatched: (symbol: string) => boolean;
  /** 별 토글. 등록돼 있으면 전 그룹에서 빼고, 아니면 지금 그룹에 넣는다. */
  toggleWatch: (symbol: string, marketCode?: string) => void;
}

export function useWatchlist(): Watchlist {
  const { t } = useTranslation("stocks");
  const watchQ = useWatchGroups();
  const groups = useMemo(() => watchQ.data ?? [], [watchQ.data]);

  // 열린 그룹은 **저장하지 않고 유도한다.** 사용자가 고른 것만 들고, 그게 없거나(첫 로드)
  // 사라졌으면(그룹 삭제) 첫 그룹으로 접는다. 예전엔 이펙트로 상태를 되돌려 맞췄는데,
  // 그러면 목록이 올 때마다 렌더가 한 번 더 돌고 "고른 값" 과 "실제 값" 이 한 프레임 어긋난다.
  const [pickedGroupId, setPickedGroupId] = useState<number | null>(null);
  const activeGroup =
    groups.find((g) => g.rowId === pickedGroupId) ?? groups[0] ?? null;
  const activeGroupId = activeGroup?.rowId ?? null;

  const createGroupMut = useCreateWatchGroup();
  const addItemMut = useAddWatchItem();
  const removeItemMut = useRemoveWatchItem();

  const watchedSymbols = useMemo(
    () => new Set(groups.flatMap((g) => g.items.map((i) => i.symbol))),
    [groups],
  );

  const toggleWatch = (symbol: string, marketCode?: string) => {
    const entries = findWatchEntries(groups, symbol);
    if (entries.length > 0) {
      // 별 해제 = 모든 그룹에서 제거 (기존 UX 유지)
      for (const e of entries) removeItemMut.mutate(e.item.rowId);
      return;
    }
    if (groups.length === 0) {
      // 첫 관심 등록이면 기본 그룹부터 만든다.
      createGroupMut.mutate(t("watch.defaultGroupName"), {
        onSuccess: (g) =>
          addItemMut.mutate({ groupId: g.rowId, symbol, marketCode }),
        onError: () => toast.error(t("watch.addFail")),
      });
      return;
    }
    const groupId = activeGroupId ?? groups[0]!.rowId;
    addItemMut.mutate(
      { groupId, symbol, marketCode },
      { onError: () => toast.error(t("watch.addFail")) },
    );
  };

  return {
    groups,
    activeGroup,
    activeGroupId,
    setActiveGroupId: setPickedGroupId,
    watchedSymbols,
    isWatched: (symbol: string) => watchedSymbols.has(symbol),
    toggleWatch,
  };
}
