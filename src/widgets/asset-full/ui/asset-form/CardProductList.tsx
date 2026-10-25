import {
  SearchableList,
  SearchableListItem,
} from "@/shared/ui/searchable-list";
import { Switch } from "@/shared/ui/switch";
import { getBrandColor } from "@/shared/lib/groo/bank-colors";
import { Skeleton as SkeletonBase } from "@/shared/ui/skeleton";

import type { AssetForm } from "./use-asset-form";

export function CardProductList({ f }: { f: AssetForm }) {
  const {
    t,
    cardKeyword,
    setCardKeyword,
    includeDiscontinued,
    setIncludeDiscontinued,
    selectedCard,
    setSelectedCard,
    catalogQ,
    catalogItems,
  } = f;
  return (
    <>
      <SearchableList
        label={t("editDialog.cardProduct")}
        totalCount={catalogQ.data?.meta?.totalElements}
        searchValue={cardKeyword}
        onSearchChange={setCardKeyword}
        placeholder={t("editDialog.cardSearchPlaceholder")}
        isLoading={catalogQ.isLoading}
        loadingSkeleton={
          <div className="flex flex-col">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-3 py-2.5"
                style={{
                  borderBottom:
                    i < 4 ? "1px solid var(--border-subtle)" : "none",
                }}
              >
                <SkeletonBase className="h-7 w-11 rounded-sm shrink-0" />
                <div className="flex-1 min-w-0">
                  <SkeletonBase className="h-3.5 w-2/3 mb-1.5" />
                  <SkeletonBase className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        }
        headerExtras={
          <label
            className="inline-flex items-center cursor-pointer select-none gap-1.5 text-caption text-text-tertiary"
            title={t("editDialog.includeDiscontinuedTooltip")}
          >
            <Switch
              checked={includeDiscontinued}
              onCheckedChange={setIncludeDiscontinued}
            />
            {t("editDialog.includeDiscontinued")}
          </label>
        }
      >
        {catalogItems.map((c) => {
          const active = selectedCard?.rowId === c.rowId;
          const discontinued = c.isDiscontinued === "Y";
          const thumbnail = c.imgUrl ? (
            <img
              src={c.imgUrl}
              alt=""
              className="rounded object-cover"
              style={{ width: 44, height: 28 }}
            />
          ) : (
            <span
              className="rounded flex items-center justify-center text-static-white text-xs font-bold"
              style={{
                width: 44,
                height: 28,
                background:
                  getBrandColor(c.company?.name)?.bg ??
                  "var(--color-chart-brown)",
              }}
            >
              {(c.company?.name ?? c.cardName).slice(0, 1)}
            </span>
          );
          return (
            <SearchableListItem
              key={c.rowId}
              active={active}
              dim={discontinued}
              onClick={() => setSelectedCard(c)}
              thumbnail={thumbnail}
              title={
                <>
                  <span className="truncate">{c.cardName}</span>
                  {discontinued && (
                    <span
                      className="inline-flex items-center px-1.5 py-px rounded text-[10px] font-semibold flex-shrink-0"
                      style={{
                        background: "var(--bg-disabled)",
                        color: "var(--fg-tertiary)",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {t("editDialog.discontinued")}
                    </span>
                  )}
                </>
              }
              subtitle={
                <>
                  {c.company?.name ?? "—"} ·{" "}
                  {c.cardType === "CREDIT"
                    ? t("cardTypeShort.credit")
                    : t("cardTypeShort.check")}
                  {/* 연회비 정보가 없으면(null) 좁은 목록에선 생략. 0원이면 '무료'로 구분해 보인다. */}
                  {c.annualFee &&
                    (c.annualFee.amount > 0 ? (
                      <>
                        {" "}
                        ·{" "}
                        {t("editDialog.annualFeeValue", {
                          amount: c.annualFee.amount.toLocaleString("ko-KR"),
                        })}
                      </>
                    ) : (
                      <> · {t("editDialog.annualFeeFree")}</>
                    ))}
                </>
              }
            />
          );
        })}
      </SearchableList>
    </>
  );
}
