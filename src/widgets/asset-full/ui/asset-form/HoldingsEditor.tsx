import { Plus, Search, Trash2 } from "lucide-react";
import { Input as LegacyInput } from "@/shared/ui/input";
import { Button as LegacyButton } from "@/shared/ui/button";
import { Badge } from "@/shared/ds/badge";
import { Button } from "@/shared/ds/button";
import { Input } from "@/shared/ds/input";
import { ListHeader } from "@/shared/ds/list";
import { Field } from "@/shared/ds/field";
import { AmountInput } from "@/shared/ui/groo/amount-input";
import { KRW } from "@/shared/lib/groo/format";
import { MAX_BALANCE } from "@/shared/lib/groo/amount";
import {
  HOLDING_UNIT_KEY,
  HOLDING_TYPES,
  sanitizeQty,
  qtyNumber,
} from "@/entities/asset";
import { useStockSymbolName } from "@/features/stock/model/useStockMaster";
import { type EditHolding, nextHoldingKey } from "./form-lib";
import type { AssetForm } from "./use-asset-form";
import { type HoldingType } from "@/entities/asset";

/** 연동 항목 이름 — 저장돼 있던 항목은 심볼→마스터 이름 조회(캐시), 검색 추가분은 displayName. */
function LinkedHoldingName({ holding }: { holding: EditHolding }) {
  const { data: masterName } = useStockSymbolName(
    holding.displayName ? "" : (holding.tossSymbol ?? ""),
  );
  return <>{holding.displayName ?? masterName ?? holding.tossSymbol ?? ""}</>;
}

/**
 * 투자의 "보유 종목" 칸(I-17 16) — 머리(칸 이름 + 오른쪽 요약), 종목 추가 줄, 유형 묶음(주식 · 금 · 코인)별 보유 줄.
 * 보유 줄은 이름(연동 = 글 + "연동" Badge · 직접 = Input) · 수량 · 평가액(연동 = 읽기 전용 · 직접 = 금액 칸) · 매수원가 · 지우기.
 * 저장 본문의 보유 목록 계약(전체 교체 · sortOrder · 연동 · 직접 키)은 껍데기 handleSubmit 이 그대로 쥔다.
 */
export function HoldingsEditor({ f }: { f: AssetForm }) {
  const {
    t,
    tCommon,
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
  const patch = (key: string, p: Partial<EditHolding>) =>
    setHoldings((prev) =>
      prev.map((x) => (x.key === key ? { ...x, ...p } : x)),
    );
  return (
    <div className="flex flex-col gap-x2">
      {/* 칸 머리 — Field 머리와 같은 모양(라벨 t5 · 500 + 오른쪽 값 글) */}
      <div className="flex items-center justify-between gap-x2_5 px-x0_5">
        <span className="min-w-0 font-sans text-t5 font-medium text-fg-neutral">
          {t("holdings.sectionTitle")}
        </span>
        <span className="num shrink-0 font-sans text-t4 text-fg-neutral-subtle">
          {t("holdings.editSummary", {
            n: holdings.length,
            total: KRW(holdingsTotal),
          })}
        </span>
      </div>
      <div>
        {allowStock && (
          <div className="relative mb-1">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-tertiary)]"
            />
            <LegacyInput
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
            <LegacyButton
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
            </LegacyButton>
          ))}
        </div>
      </div>
      {holdings.length === 0 ? (
        <p className="m-0 px-x0_5 font-sans text-t4 text-fg-neutral-subtle">
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
              <section key={type} aria-label={t(labelKey)}>
                <ListHeader as="h3" className="px-0">
                  {t(labelKey)}
                </ListHeader>
                {rows.map((h) => {
                  const val = holdingValueOf(h);
                  const nameOf = h.linked ? undefined : (h.holdingName ?? "");
                  return (
                    <div
                      key={h.key}
                      data-slot="holding-row"
                      className="flex flex-col gap-x3 py-x3"
                    >
                      <div className="flex items-center gap-x2">
                        <div className="min-w-0 flex-1">
                          {h.linked ? (
                            <>
                              <div className="flex flex-wrap items-center gap-x2 font-sans text-t5 font-medium text-fg-neutral">
                                <span className="min-w-0 break-keep">
                                  <LinkedHoldingName holding={h} />
                                </span>
                                <Badge variant="weak" tone="informative">
                                  {t("holdings.linkedBadge")}
                                </Badge>
                              </div>
                              <div className="num font-sans text-t3 text-fg-neutral-subtle">
                                {t("holdings.editLinkedSub")}
                              </div>
                            </>
                          ) : (
                            // 미연동은 이름도 고칠 수 있어야 한다 — 금·코인은 검색으로 이름을 받지 못한다.
                            <Input
                              aria-label={t("holdings.nameLabel")}
                              value={nameOf}
                              placeholder={t("holdings.namePlaceholder")}
                              onChange={(e) =>
                                patch(h.key, { holdingName: e.target.value })
                              }
                            />
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          ghostColor="neutralSubtle"
                          layout="iconOnly"
                          size="small"
                          aria-label={t("holdings.removeOf", {
                            name: h.linked
                              ? (h.displayName ?? h.tossSymbol ?? "")
                              : (h.holdingName ?? ""),
                          })}
                          onClick={() =>
                            setHoldings((prev) =>
                              prev.filter((x) => x.key !== h.key),
                            )
                          }
                        >
                          <Trash2 />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-x-x3 gap-y-x3">
                        {/* 수량 — 연동은 필수(시세×수량), 미연동은 선택. 소수 허용(0.05 BTC·3.75g) */}
                        <Field label={t("holdings.quantity")}>
                          <Input
                            inputMode="decimal"
                            value={h.quantity ?? ""}
                            suffix={t(HOLDING_UNIT_KEY[h.holdingType])}
                            onChange={(e) =>
                              patch(h.key, {
                                quantity: sanitizeQty(e.target.value),
                              })
                            }
                          />
                        </Field>
                        {/* 평가액 — 연동은 시세로 계산(읽기 전용), 미연동은 직접 입력 */}
                        <Field label={t("holdings.value")}>
                          {h.linked ? (
                            <Input
                              readOnly
                              value={val != null ? KRW(val) : "—"}
                              suffix={tCommon("searchWon")}
                            />
                          ) : (
                            <AmountInput
                              max={MAX_BALANCE}
                              value={
                                h.holdingValue != null
                                  ? String(h.holdingValue)
                                  : ""
                              }
                              onValueChange={(v) =>
                                patch(h.key, {
                                  holdingValue: parseInt(v, 10) || 0,
                                })
                              }
                            />
                          )}
                        </Field>
                        {/* 매수원가 — 실현손익의 기준. 매수·매도로 쌓이지만
                            앱을 쓰기 전부터 갖고 있던 보유는 여기서 적어 넣어야 손익이 맞는다. */}
                        <Field
                          label={t("holdings.totalCost")}
                          description={
                            h.totalCost != null &&
                            h.totalCost > 0 &&
                            qtyNumber(h.quantity)
                              ? t("holdings.avgPriceInline", {
                                  avg: KRW(
                                    Math.round(
                                      h.totalCost /
                                        (qtyNumber(h.quantity) || 1),
                                    ),
                                  ),
                                })
                              : undefined
                          }
                          className="col-span-2"
                        >
                          <AmountInput
                            max={MAX_BALANCE}
                            value={
                              h.totalCost != null ? String(h.totalCost) : ""
                            }
                            onValueChange={(v) =>
                              patch(h.key, { totalCost: parseInt(v, 10) || 0 })
                            }
                          />
                        </Field>
                      </div>
                    </div>
                  );
                })}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
