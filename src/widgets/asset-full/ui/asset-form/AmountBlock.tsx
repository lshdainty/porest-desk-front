import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { KRW, formatDay, money } from "@/shared/lib/groo/format";
import {
  MAX_BALANCE,
  blockNonDigitKey,
  sanitizeAmountInput,
} from "@/shared/lib/groo/amount";
import {
  DEFAULT_CURRENCY,
  currencyUnit,
  formatOriginalAmount,
} from "@/shared/lib/groo/currency";
import { Badge } from "@/shared/ui/badge";

import type { AssetForm } from "./use-asset-form";

export function AmountBlock({ f }: { f: AssetForm }) {
  const {
    t,
    i18n,
    editingGroup,
    balanceStr,
    setBalanceStr,
    dueStr,
    setDueStr,
    currency,
    holdings,
    holdingsTotal,
    cardType,
    isOverdraft,
    unit,
    balanceLabel,
    isExistingCreditCard,
    carryoverLocked,
    currentUnpaid,
    newCardBillWindow,
    dueField,
    overLimitBy,
    item,
  } = f;
  return (
    <>
      {/* 체크카드는 잔액 개념이 없다 — 긁는 즉시 연결 계좌에서 빠지므로 카드가 들고 있을 금액이 없다.
              신용카드는 결제일까지 사용액을 들고 있으므로 그대로 입력받는다. */}
      {editingGroup === "card" && cardType === "CHECK" ? null : editingGroup ===
          "invest" && holdings.length > 0 ? (
        <div>
          {/* 연동 합계만은 통화를 안 따른다 — 시세를 원화로 환산해 더한 값이라
              (`live.unitKrw`) 고른 통화를 붙이면 라벨이 값을 속인다. */}
          <Label className="text-[13px] font-medium mb-2 block">
            {t("editDialog.balanceLabelInvest", {
              unit: currencyUnit(DEFAULT_CURRENCY),
            })}
          </Label>
          <div className="num rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-sunken)] px-3 py-2.5 text-[14px] font-bold text-[var(--fg-primary)]">
            {KRW(holdingsTotal)}원
          </div>
          <p className="text-[11.5px] text-[var(--fg-tertiary)] mt-1.5">
            {t("holdings.balanceAutoHelp")}
          </p>
        </div>
      ) : (
        <div>
          {/* 결제 대기 청구분(2026-09-22) — 결제일 전에 등록하면 지난달 청구분은 다가오는
              결제일에, 그 뒤 쓴 금액은 그다음 결제일에 빠진다. 칸 이름에 그 날짜를 쓴다. */}
          {dueField && (
            <div className="mb-4" data-testid="due-carryover">
              <Label
                htmlFor="asset-edit-due"
                className="text-[13px] font-medium mb-2 block"
              >
                {t("editDialog.dueCarryoverLabel", {
                  date: formatDay(dueField.paymentDate).md,
                  unit,
                })}
              </Label>
              <Input
                id="asset-edit-due"
                inputMode="numeric"
                disabled={dueField.locked}
                value={dueStr}
                onChange={(e) =>
                  setDueStr(sanitizeAmountInput(e.target.value, MAX_BALANCE))
                }
                onKeyDown={blockNonDigitKey}
                onBlur={() => {
                  const n = Number(dueStr) || 0;
                  setDueStr(n ? KRW(n) : "0");
                }}
                onFocus={() =>
                  setDueStr((prev) => {
                    const bare = prev.replace(/,/g, "");
                    return bare === "0" ? "" : bare;
                  })
                }
              />
              <p className="text-[11.5px] text-[var(--fg-tertiary)] mt-1.5">
                {dueField.locked
                  ? t("editDialog.carryoverLocked")
                  : t("editDialog.dueCarryoverHelp")}
              </p>
            </div>
          )}
          {/* 초과 배지는 **넘긴 값 옆**에 붙인다 — 한도 칸이 아니라 사용액 칸이
              사용자가 방금 고친 자리다. 저장은 그대로 열려 있다(QA #125). */}
          <div className="mb-2 flex items-center gap-2">
            <Label
              htmlFor="asset-edit-balance"
              className="text-[13px] font-medium"
            >
              {dueField
                ? t("editDialog.carryoverAfterLabel", { unit })
                : balanceLabel}
            </Label>
            {overLimitBy > 0 && (
              <Badge variant="error">{t("editDialog.overLimitBadge")}</Badge>
            )}
            {/* 이 칸은 이월 금액이라 지금 갚을 돈과 다르다 — 지금 미결제 잔액을 옆에 읽기
                전용으로 둬서 둘을 헷갈리지 않게 한다(D7). */}
            {isExistingCreditCard && (
              <span
                data-testid="current-unpaid"
                className="num ml-auto text-[11.5px] text-[var(--fg-tertiary)]"
              >
                {t("editDialog.currentUnpaid", {
                  balance: money(currentUnpaid),
                })}
              </span>
            )}
          </div>
          <Input
            id="asset-edit-balance"
            inputMode="numeric"
            disabled={carryoverLocked}
            value={balanceStr}
            onChange={(e) =>
              setBalanceStr(sanitizeAmountInput(e.target.value, MAX_BALANCE))
            }
            // `-` 도 여기서 막힌다 — 부호는 종류가 정한다(QA #19).
            onKeyDown={blockNonDigitKey}
            onBlur={() => {
              const n = Number(balanceStr) || 0;
              setBalanceStr(n ? KRW(n) : "0");
            }}
            onFocus={() =>
              setBalanceStr((prev) => {
                const bare = prev.replace(/,/g, "");
                // 기본값 `0` 은 지우고 시작한다 — 안 지우면 500 을 쳐서 0500 이 된다(QA #18).
                // 아무것도 안 치고 나가면 위 onBlur 가 다시 `0` 으로 되돌린다.
                return bare === "0" ? "" : bare;
              })
            }
          />
          {overLimitBy > 0 && (
            <p className="mt-1.5 text-[11.5px] text-[color:var(--status-danger-fg)]">
              {t("editDialog.overLimitHelp", {
                amount: formatOriginalAmount(
                  overLimitBy,
                  currency,
                  i18n.language,
                ),
              })}
            </p>
          )}
          {/* 이월 거래가 든 회차가 결제됐으면 그 금액은 이미 청구가 끝났다 — 고치면 끝난
              회차의 기록이 흔들린다(D15). 서버도 값이 달라지면 400 으로 막는다. */}
          {carryoverLocked ? (
            <p
              data-testid="carryover-locked"
              className="text-[11.5px] text-[var(--fg-tertiary)] mt-1.5"
            >
              {t("editDialog.carryoverLocked")}
            </p>
          ) : (
            editingGroup === "card" && (
              <p className="text-[11.5px] text-[var(--fg-tertiary)] mt-1.5">
                {dueField
                  ? newCardBillWindow
                    ? t("editDialog.carryoverAfterHelp", {
                        date: formatDay(newCardBillWindow.afterDate).md,
                      })
                    : t("editDialog.carryoverAfterHelpNoDate")
                  : t("editDialog.cardBalanceHelp")}
              </p>
            )
          )}
          {isOverdraft && (
            <p className="text-[11.5px] text-[var(--fg-tertiary)] mt-1.5">
              {t("editDialog.overdraftHelp")}
            </p>
          )}
          {/* 잔액 수동 수정 = 새 앵커. 그 시각 이전 내역은 이 잔액에 이미 들어 있는 것으로 보고
              이후 내역만 더해진다 — 모르고 고치면 방금 한 이체가 잔액에서 사라진 것처럼 보인다. */}
          {item && editingGroup !== "card" && (
            <p className="text-[11.5px] text-[var(--fg-tertiary)] mt-1.5">
              {t("editDialog.balanceEditHelp")}
            </p>
          )}
        </div>
      )}
    </>
  );
}
