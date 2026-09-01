/**
 * 관심목록 패널 — 그룹 탭 + 이름 변경/추가 버튼 + 종목 행.
 *
 * **시세는 여기서 안 부른다.** 증권사마다 시세 조달 방식이 달라서다 — 토스는 다건 시세 1콜에
 * 전일종가만 종목별 캔들로 따로 받고, 나무는 다건 API 가 없어 서버 대리 조회(`/v1/securities/prices`)로
 * 전일종가까지 한 번에 받는다. 그 차이를 패널이 알 필요는 없으므로 `priceOf` 로 주입받는다.
 * 여기서 종목마다 훅을 걸면 나무에서 종목 수만큼 호출이 나가 유량 제한에 걸린다.
 */
import { useTranslation } from "react-i18next";
import { Pencil, Plus } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import type { WatchGroup } from "../api/stockApi";
import type { Watchlist } from "../model/useWatchlist";
import { ListWrap, StockRow } from "./stock-row";

/** 한 종목의 표시용 시세. 못 구한 값은 null — 행이 '—' 로 접는다. */
export interface RowQuote {
  price: number | null;
  changePct: number | null;
}

export function WatchlistPanel({
  watchlist,
  mobile,
  selected,
  onSelect,
  onEditGroup,
  priceOf,
}: {
  watchlist: Watchlist;
  mobile: boolean;
  selected: string | null;
  onSelect: (symbol: string) => void;
  onEditGroup: (group: WatchGroup | null) => void;
  priceOf: (symbol: string) => RowQuote;
}) {
  const { t } = useTranslation("stocks");
  const { groups, activeGroup, activeGroupId, setActiveGroupId } = watchlist;
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {groups.length > 0 && (
          <Tabs
            value={String(activeGroupId ?? "")}
            onValueChange={(val) => val && setActiveGroupId(Number(val))}
          >
            <TabsList variant="pill" size="sm">
              {groups.map((g) => (
                <TabsTrigger
                  key={g.rowId}
                  variant="pill"
                  value={String(g.rowId)}
                >
                  {g.groupName}{" "}
                  <span style={{ opacity: 0.7 }}>{g.items.length}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}
        <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
          {activeGroup && (
            <Button
              variant="ghost"
              size="icon"
              title={t("watch.groupRename")}
              onClick={() => onEditGroup(activeGroup)}
            >
              <Pencil size={14} />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            title={t("watch.groupAdd")}
            onClick={() => onEditGroup(null)}
          >
            <Plus size={15} />
          </Button>
        </div>
      </div>
      <ListWrap mobile={mobile}>
        {!activeGroup || activeGroup.items.length === 0 ? (
          <div
            style={{
              padding: "32px 20px",
              textAlign: "center",
              color: "var(--fg-tertiary)",
              fontSize: "var(--text-label-sm)",
            }}
          >
            {t("watch.empty")}
          </div>
        ) : (
          activeGroup.items.map((i) => {
            const quote = priceOf(i.symbol);
            return (
              <StockRow
                mobile={mobile}
                key={i.rowId}
                stock={{
                  symbol: i.symbol,
                  name: i.nameKr,
                  countryCode: i.countryCode,
                  currency: i.currency,
                }}
                sub={t(`market.${i.marketCode}`, {
                  defaultValue: i.marketCode,
                })}
                price={quote.price}
                changePct={quote.changePct}
                active={selected === i.symbol}
                onClick={() => onSelect(i.symbol)}
              />
            );
          })
        )}
      </ListWrap>
    </>
  );
}
