import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import { BottomSheet, BottomSheetContent } from "@/shared/ds/bottom-sheet";
import { useInputButtonSurface } from "@/shared/ds/input-button";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ds/popover";
import { ScrollFog } from "@/shared/ds/scroll-fog";
import {
  focusSearchableList,
  SearchableList,
  SearchableListEmpty,
  SearchableListError,
  SearchableListInput,
  SearchableListItem,
  SearchableListResults,
  SearchableListSkeleton,
} from "@/shared/ds/searchable-list";
import type { StockMasterItem } from "../../api/stockApi";
import { useStockSearch } from "../../model/useStockMaster";

/*
 * 종목 찾기(I-13 10 · 24) — 입구는 밑줄형 검색칸 모양의 단추, 누르면 1280 미만 Bottom Sheet · 이상 Popover 의 Searchable List.
 * 결과 줄은 종목 이름 + "{코드} · {시장} · {유형}", 앞 타일도 오른쪽 라디오도 없다(고르면 상세로 가는 찾기 — selectionMark off).
 * 서버 검색은 마지막 입력 뒤 300ms 에 한 번(ds 가 기다린다). 고르면 표면을 닫고 `onPick` 이 상세 주소로 보낸다.
 */

/** 입구 — Searchable List 칸 모양의 단추(밑줄형 large 40 · 앞 돋보기 24 · 글 t6) */
function SearchEntryButton({
  open,
  onClick,
  compact,
}: {
  open: boolean;
  onClick: () => void;
  /** 카드 머리(데스크톱 13-2)용 작은 크기 */
  compact?: boolean;
}) {
  const { t } = useTranslation("stocks");
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-label={t("search.label")}
      data-slot="stock-search-entry"
      onClick={onClick}
      className={
        compact
          ? "flex min-h-[34px] w-full cursor-pointer items-center gap-x2 py-x1_5 text-t5 text-fg-placeholder shadow-[inset_0_-1px_0_0_var(--color-stroke-neutral-weak)]"
          : "flex min-h-[40px] w-full cursor-pointer items-center gap-x2_5 py-x2 text-t6 text-fg-placeholder shadow-[inset_0_-1px_0_0_var(--color-stroke-neutral-weak)]"
      }
    >
      <Search
        aria-hidden
        className={compact ? "size-5 shrink-0" : "size-6 shrink-0"}
      />
      <span className="min-w-0 truncate text-start">
        {t("search.placeholder")}
      </span>
    </button>
  );
}

export function StockSearchEntry({
  onPick,
  className,
}: {
  onPick: (item: StockMasterItem) => void;
  className?: string;
}) {
  const { t } = useTranslation("stocks");
  const surface = useInputButtonSurface();
  const [open, setOpen] = useState(false);
  const entry = (
    <div className={className}>
      <SearchEntryButton open={open} onClick={() => setOpen(true)} />
    </div>
  );
  const body: ReactNode = open ? (
    <SearchBody
      onPick={(item) => {
        setOpen(false);
        onPick(item);
      }}
    />
  ) : null;
  return surface === "sheet" ? (
    <BottomSheet open={open} onOpenChange={setOpen}>
      {entry}
      <BottomSheetContent
        title={t("search.label")}
        onOpenAutoFocus={focusSearchableList}
      >
        <div className="flex min-h-0 flex-1 flex-col">{body}</div>
      </BottomSheetContent>
    </BottomSheet>
  ) : (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{entry}</PopoverTrigger>
      <PopoverContent
        aria-label={t("search.label")}
        align="start"
        onOpenAutoFocus={focusSearchableList}
      >
        <div className="flex min-h-0 flex-1 flex-col">{body}</div>
      </PopoverContent>
    </Popover>
  );
}

function SearchBody({ onPick }: { onPick: (item: StockMasterItem) => void }) {
  const { t } = useTranslation("stocks");
  const [typed, setTyped] = useState("");
  const [keyword, setKeyword] = useState("");
  const q = useStockSearch(keyword.trim(), 20);
  const results = q.data ?? [];
  const asked = typed.trim().length > 0;
  return (
    <SearchableList
      selectionMark="off"
      query={typed}
      onQueryChange={setTyped}
      onSearch={setKeyword}
      onValueChange={(v) => {
        const hit = results.find((s) => `${s.marketCode}:${s.symbol}` === v);
        if (hit) onPick(hit);
      }}
      className="flex min-h-0 flex-1 flex-col"
    >
      <SearchableListInput placeholder={t("search.placeholder")} />
      {!asked ? (
        <p className="m-0 px-x6 pt-x4 text-t4 text-fg-neutral-subtle">
          {t("search.hint")}
        </p>
      ) : (
        <ScrollFog use="overlayBody" className="min-h-0 flex-1">
          {q.isError ? (
            <SearchableListError
              title={t("search.failTitle")}
              retrying={q.isFetching}
              onRetry={() => void q.refetch()}
            />
          ) : q.isFetching && results.length === 0 ? (
            <SearchableListSkeleton />
          ) : results.length === 0 ? (
            <SearchableListEmpty />
          ) : (
            <SearchableListResults aria-label={t("search.label")}>
              {results.map((s) => (
                <SearchableListItem
                  key={`${s.marketCode}:${s.symbol}`}
                  value={`${s.marketCode}:${s.symbol}`}
                  title={s.nameKr}
                  detail={`${s.symbol} · ${t(`market.${s.marketCode}`, { defaultValue: s.marketCode })} · ${t(`securityType.${s.securityType}`, { defaultValue: s.securityType })}`}
                />
              ))}
            </SearchableListResults>
          )}
        </ScrollFog>
      )}
    </SearchableList>
  );
}
