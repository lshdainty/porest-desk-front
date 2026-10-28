import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/shared/ds/button";
import {
  SearchableList,
  SearchableListEmpty,
  SearchableListInput,
  SearchableListItem,
  SearchableListResults,
  SearchableListSkeleton,
} from "@/shared/ds/searchable-list";
import { useStockSearch } from "@/features/stock/model/useStockMaster";
import type { HoldingType } from "@/entities/asset";
import { nextHoldingKey } from "./form-lib";
import { PickerSurface } from "./PickerField";
import type { AssetForm } from "./use-asset-form";

const MANUAL = "__manual__";

/**
 * 종목 추가(I-17 20) — Button "종목 추가" → 종목 검색 시트(1280 이상 팝오버). 서버 검색은 마지막 입력 뒤 300ms 에 한 번.
 * 줄은 "고르면 그 종목을 더한다"(이미 담은 연동 종목은 목록에서 뺀다), 검색어가 있으면 맨 아래 "직접 추가 — 평가액 입력".
 * 시세 게이트가 꺼져 있으면(비구독 · 토스 미연결) 연동해도 평가액을 못 구하므로 검색 결과도 직접 입력 줄로 더한다(사용자 결정).
 */
export function StockAddButton({ f }: { f: AssetForm }) {
  const { t, holdings, setHoldings, liveEnabled, manualHoldingType } = f;
  return (
    <PickerSurface
      surfaceTitle={t("holdings.addStockTitle")}
      trigger={({ open, show }) => (
        <Button
          type="button"
          variant="neutralOutline"
          size="small"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={show}
        >
          <Plus aria-hidden />
          {t("holdings.addStock")}
        </Button>
      )}
    >
      {({ close }) => (
        <StockSearchList
          t={t}
          linkedSymbols={holdings
            .filter((h) => h.linked && h.tossSymbol)
            .map((h) => h.tossSymbol as string)}
          onAddFound={(s) => {
            setHoldings((prev) => [
              ...prev,
              liveEnabled
                ? {
                    key: nextHoldingKey(),
                    holdingType: "STOCK" as HoldingType,
                    linked: true,
                    // 검색 결과가 시장을 알고 있다 — 여기서 안 담으면 서버는 심볼로 되짚어야 하고, 여러 시장에 걸리면 확정하지 못한다.
                    marketCode: s.marketCode,
                    tossSymbol: s.symbol,
                    quantity: "1",
                    displayName: s.nameKr,
                  }
                : {
                    key: nextHoldingKey(),
                    holdingType: manualHoldingType,
                    linked: false,
                    holdingName: s.nameKr,
                    holdingValue: 0,
                  },
            ]);
            close();
          }}
          onAddManual={(name) => {
            setHoldings((prev) => [
              ...prev,
              {
                key: nextHoldingKey(),
                holdingType: manualHoldingType,
                linked: false,
                holdingName: name,
                holdingValue: 0,
              },
            ]);
            close();
          }}
        />
      )}
    </PickerSurface>
  );
}

function StockSearchList({
  t,
  linkedSymbols,
  onAddFound,
  onAddManual,
}: {
  t: AssetForm["t"];
  linkedSymbols: string[];
  onAddFound: (s: {
    symbol: string;
    marketCode: string;
    nameKr: string;
  }) => void;
  onAddManual: (name: string) => void;
}) {
  const [typed, setTyped] = useState("");
  const [keyword, setKeyword] = useState("");
  const { data: matches = [], isFetching } = useStockSearch(keyword.trim());
  const results = matches
    .filter((s) => !linkedSymbols.includes(s.symbol))
    .slice(0, 6);
  const query = typed.trim();
  return (
    <SearchableList
      onValueChange={(v) => {
        if (v === MANUAL) return onAddManual(query);
        const s = results.find((r) => `${r.marketCode}:${r.symbol}` === v);
        if (s) onAddFound(s);
      }}
      query={typed}
      onQueryChange={setTyped}
      onSearch={setKeyword}
    >
      <SearchableListInput placeholder={t("holdings.searchPlaceholder")} />
      {query === "" ? null : isFetching && results.length === 0 ? (
        <SearchableListSkeleton rows={3} />
      ) : (
        <SearchableListResults aria-label={t("holdings.sectionTitle")}>
          {results.map((s) => (
            <SearchableListItem
              key={`${s.marketCode}:${s.symbol}`}
              value={`${s.marketCode}:${s.symbol}`}
              title={s.nameKr}
              detail={`${s.symbol} · ${s.marketCode}`}
              className="[&_[data-slot=searchable-list-item-radio]]:hidden"
            />
          ))}
          <SearchableListItem
            value={MANUAL}
            prefix={<Plus className="size-5" />}
            title={t("holdings.addManual", { name: query })}
            className="[&_[data-slot=searchable-list-item-radio]]:hidden"
          />
        </SearchableListResults>
      )}
      {query !== "" && results.length === 0 && !isFetching && (
        <SearchableListEmpty />
      )}
    </SearchableList>
  );
}
