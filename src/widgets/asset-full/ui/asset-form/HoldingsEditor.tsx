import { Plus, Search, Trash2 } from "lucide-react";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { KRW } from "@/shared/lib/groo/format";
import { blockNonDigitKey } from "@/shared/lib/groo/amount";
import {
  type HoldingType,
  HOLDING_UNIT_KEY,
  HOLDING_TYPES,
  sanitizeQty,
  qtyNumber,
} from "@/entities/asset";
import { useStockSymbolName } from "@/features/stock/model/useStockMaster";
import { Button } from "@/shared/ui/button";
import { type EditHolding, nextHoldingKey } from "./form-lib";
import type { AssetForm } from "./use-asset-form";

/** 연동 항목 이름 — 저장돼 있던 항목은 심볼→마스터 이름 조회(캐시), 검색 추가분은 displayName. */
function LinkedHoldingName({ holding }: { holding: EditHolding }) {
  const { data: masterName } = useStockSymbolName(
    holding.displayName ? "" : (holding.tossSymbol ?? ""),
  );
  return <>{holding.displayName ?? masterName ?? holding.tossSymbol ?? ""}</>;
}

export function HoldingsEditor({ f }: { f: AssetForm }) {
  const {
    t,
    editingGroup,
    holdings,
    setHoldings,
    stockQ,
    setStockQ,
    liveEnabled,
    stockSearching,
    stockResults,
    holdingValueOf,
    holdingsTotal,
    allowStock,
    manualHoldingType,
    manualAddTypes,
  } = f;
  return (
    <>
      {/* 투자 — 보유 종목 편집 (design invest 분기: 검색→연동 추가 / 직접 추가, qty·평가액 인라인 편집) */}
      {editingGroup === "invest" && (
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <Label className="text-[13px] font-medium">
              {t("holdings.sectionTitle")}
            </Label>
            <span className="num text-[11px] text-[var(--fg-tertiary)]">
              {t("holdings.editSummary", {
                n: holdings.length,
                total: KRW(holdingsTotal),
              })}
            </span>
          </div>
          {allowStock && (
            <div className="relative mb-1">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-tertiary)]"
              />
              <Input
                search
                value={stockQ}
                onChange={(e) => setStockQ(e.target.value)}
                placeholder={t("holdings.searchPlaceholder")}
                className="pl-9"
              />
            </div>
          )}
          {allowStock && stockQ.trim().length > 0 && (
            <div
              className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] mb-2"
              style={{ maxHeight: 240, overflowY: "auto" }}
            >
              {stockResults.map((s) => (
                <button
                  key={`${s.marketCode}:${s.symbol}`}
                  type="button"
                  className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left hover:bg-[var(--color-bg-layer-default-pressed)] transition-colors"
                  style={{
                    background: "transparent",
                    border: 0,
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    // 시세 게이트 OFF(비구독·토스 미연결)면 연동해도 평가액을 못 구하므로
                    // 검색 결과도 수동 항목으로 추가 — 사용자가 평가액을 직접 입력해 합계에 반영(사용자 결정).
                    setHoldings((prev) => [
                      ...prev,
                      liveEnabled
                        ? {
                            key: nextHoldingKey(),
                            holdingType: "STOCK" as HoldingType,
                            linked: true,
                            // 검색 결과가 시장을 알고 있다 — 여기서 안 담으면 서버는
                            // 심볼로 되짚어야 하고, 여러 시장에 걸리면 확정하지 못한다.
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
                    setStockQ("");
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold text-[var(--fg-primary)]">
                      {s.nameKr}
                    </div>
                    <div className="num text-[11px] text-[var(--fg-tertiary)] mt-0.5">
                      {s.symbol} · {s.marketCode}
                    </div>
                  </div>
                </button>
              ))}
              {stockSearching && stockResults.length === 0 && (
                <div className="py-4 text-center text-[12px] text-[var(--fg-tertiary)]">
                  …
                </div>
              )}
              <button
                type="button"
                className="flex w-full items-center gap-1.5 px-3 py-2.5 text-[12.5px] font-bold text-[var(--fg-brand)]"
                style={{
                  background: "transparent",
                  border: 0,
                  borderTop: stockResults.length
                    ? "1px solid var(--border-subtle)"
                    : "none",
                  cursor: "pointer",
                }}
                onClick={() => {
                  setHoldings((prev) => [
                    ...prev,
                    {
                      key: nextHoldingKey(),
                      holdingType: manualHoldingType,
                      linked: false,
                      holdingName: stockQ.trim(),
                      holdingValue: 0,
                    },
                  ]);
                  setStockQ("");
                }}
              >
                <Plus size={13} strokeWidth={2.4} />{" "}
                {t("holdings.addManual", { name: stockQ.trim() })}
              </button>
            </div>
          )}
          {/* 금·코인은 검색 대상이 아니다(토스·마스터 모두 미제공) — 직접 추가로만 담는다.
                  기관이 유형을 정하므로 증권사면 아무것도 안 뜬다(주식은 위 검색으로 담는다). */}
          <div className="flex gap-1.5 mb-1">
            {manualAddTypes.map((type) => (
              <Button
                key={type}
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setHoldings((prev) => [
                    ...prev,
                    {
                      key: nextHoldingKey(),
                      holdingType: type,
                      linked: false,
                      holdingName: "",
                      holdingValue: 0,
                    },
                  ])
                }
              >
                <Plus size={13} strokeWidth={2.4} />
                {type === "GOLD"
                  ? t("holdings.addGold")
                  : t("holdings.addCrypto")}
              </Button>
            ))}
          </div>
          {holdings.length === 0 ? (
            <p className="text-[11.5px] text-[var(--fg-tertiary)] mt-1.5 leading-relaxed">
              {allowStock
                ? t("holdings.editEmptyHelp")
                : t("holdings.editEmptyHelpManual")}
            </p>
          ) : (
            <div>
              {HOLDING_TYPES.map(({ type, labelKey }) => {
                const rows = holdings.filter((h) => h.holdingType === type);
                if (rows.length === 0) return null;
                return (
                  <div key={type} className="mt-2 first:mt-0">
                    {/* 유형 라벨과 목록은 한 묶음 — 유형이 하나뿐이어도 어떤 단위인지 드러난다. */}
                    <div className="text-[11px] font-bold text-[var(--fg-tertiary)] pt-1.5">
                      {t(labelKey)}
                    </div>
                    {rows.map((h, i) => {
                      const val = holdingValueOf(h);
                      return (
                        <div
                          key={h.key}
                          className="flex items-center gap-2"
                          style={{
                            padding: "11px 2px",
                            borderTop:
                              i === 0
                                ? "none"
                                : "1px solid var(--border-subtle)",
                          }}
                        >
                          <div className="min-w-0 flex-1">
                            {h.linked ? (
                              <>
                                <div className="text-[13px] font-semibold text-[var(--fg-primary)] truncate">
                                  <LinkedHoldingName holding={h} />
                                  <span
                                    className="ml-1.5 rounded-full px-1.5 py-0.5 text-[9.5px] font-bold align-middle"
                                    style={{
                                      background: "var(--bg-brand-subtle)",
                                      color: "var(--fg-brand-strong)",
                                    }}
                                  >
                                    {t("holdings.linkedBadge")}
                                  </span>
                                </div>
                                <div className="num text-[11px] text-[var(--fg-tertiary)] mt-0.5">
                                  {t("holdings.editLinkedSub")}
                                </div>
                              </>
                            ) : (
                              // 미연동은 이름도 고칠 수 있어야 한다 — 금·코인은 검색으로 이름을 받지 못한다.
                              <Input
                                value={h.holdingName ?? ""}
                                placeholder={t("holdings.namePlaceholder")}
                                onChange={(e) =>
                                  setHoldings((prev) =>
                                    prev.map((x) =>
                                      x.key === h.key
                                        ? { ...x, holdingName: e.target.value }
                                        : x,
                                    ),
                                  )
                                }
                                className="h-[34px]"
                              />
                            )}
                            {/* 매수원가 — 실현손익의 기준. 매수·매도로 쌓이지만
                                    앱을 쓰기 전부터 갖고 있던 보유는 여기서 적어 넣어야 손익이 맞는다. */}
                            <div className="mt-1.5 flex items-center gap-1.5">
                              <span className="text-[11px] text-[var(--fg-tertiary)] shrink-0">
                                {t("holdings.totalCost")}
                              </span>
                              <Input
                                inputMode="numeric"
                                onKeyDown={blockNonDigitKey}
                                value={
                                  h.totalCost != null ? String(h.totalCost) : ""
                                }
                                placeholder="0"
                                onChange={(e) => {
                                  const v =
                                    parseInt(
                                      e.target.value.replace(/[^\d]/g, ""),
                                      10,
                                    ) || 0;
                                  setHoldings((prev) =>
                                    prev.map((x) =>
                                      x.key === h.key
                                        ? { ...x, totalCost: v }
                                        : x,
                                    ),
                                  );
                                }}
                                className="num h-[28px] w-[104px] px-2 text-right"
                              />
                              {h.totalCost != null &&
                              h.totalCost > 0 &&
                              qtyNumber(h.quantity) ? (
                                <span className="num text-[11px] text-[var(--fg-tertiary)]">
                                  {t("holdings.avgPriceInline", {
                                    avg: KRW(
                                      Math.round(
                                        h.totalCost /
                                          (qtyNumber(h.quantity) || 1),
                                      ),
                                    ),
                                  })}
                                </span>
                              ) : null}
                            </div>
                          </div>
                          {/* 수량 — 연동은 필수(시세×수량), 미연동은 선택. 소수 허용(0.05 BTC·3.75g) */}
                          <span className="inline-flex items-center gap-1 shrink-0">
                            <Input
                              inputMode="decimal"
                              value={h.quantity ?? ""}
                              onChange={(e) => {
                                const q = sanitizeQty(e.target.value);
                                setHoldings((prev) =>
                                  prev.map((x) =>
                                    x.key === h.key ? { ...x, quantity: q } : x,
                                  ),
                                );
                              }}
                              className="num h-[34px] w-[62px] px-2 text-right"
                            />
                            <span className="text-[12px] text-[var(--fg-tertiary)]">
                              {t(HOLDING_UNIT_KEY[h.holdingType])}
                            </span>
                          </span>
                          {/* 평가액 — 연동은 시세로 계산(읽기 전용), 미연동은 직접 입력 */}
                          {h.linked ? (
                            <span
                              className="num shrink-0 text-right text-[12.5px] font-bold text-[var(--fg-primary)]"
                              style={{ minWidth: 84 }}
                            >
                              {val != null ? `${KRW(val)}원` : "—"}
                            </span>
                          ) : (
                            <Input
                              inputMode="numeric"
                              onKeyDown={blockNonDigitKey}
                              value={
                                h.holdingValue != null
                                  ? String(h.holdingValue)
                                  : ""
                              }
                              onChange={(e) => {
                                const v =
                                  parseInt(
                                    e.target.value.replace(/[^\d]/g, ""),
                                    10,
                                  ) || 0;
                                setHoldings((prev) =>
                                  prev.map((x) =>
                                    x.key === h.key
                                      ? { ...x, holdingValue: v }
                                      : x,
                                  ),
                                );
                              }}
                              className="num h-[34px] w-[100px] px-2 text-right shrink-0"
                            />
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="shrink-0 h-8 w-8"
                            aria-label={t("holdings.remove")}
                            onClick={() =>
                              setHoldings((prev) =>
                                prev.filter((x) => x.key !== h.key),
                              )
                            }
                          >
                            <Trash2 size={13} />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </>
  );
}
