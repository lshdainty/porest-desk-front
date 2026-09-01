import { useTranslation } from "react-i18next";
import { KRW, isEn } from "@/shared/lib/porest/format";
import { HideUnit, MaskAmount } from "@/shared/lib/porest/hide-amounts";
import {
  isScheduledDate,
  txDateFull,
  txTimeLabel,
} from "@/shared/lib/porest/ledger-format";
import { CategoryChip } from "@/shared/ui/porest/category-chip";
import {
  LedgerRow,
  LedgerRowAmt,
  LedgerRowMain,
  LedgerRowSep,
  LedgerRowSub,
  LedgerRowTitle,
  ScheduledBadge,
} from "@/shared/ui/porest/ledger";
import type { AssetTransfer } from "../model/types";

/**
 * 이체 한 건.
 *
 * 지출/수입과 달리 한 건이 자산 두 개에 걸쳐서, 부호가 "보는 관점"에 따라 달라진다.
 * - `perspectiveAssetRowId` 없음(전체 거래 목록): 관점이 없으므로 중립 — "A → B" 와 금액만.
 *   이체는 순자산 증감이 0(수수료 제외)이라 +/- 를 붙이면 지출·수입 합계와 헷갈린다.
 * - `perspectiveAssetRowId` 있음(자산 상세): 그 자산 기준으로 출금이면 -(금액+수수료), 입금이면 +금액.
 *   수수료는 보내는 쪽에서만 빠진다(백엔드 recordTransfer 와 동일 규칙).
 */
export function TransferRow({
  transfer,
  perspectiveAssetRowId,
  onClick,
  showDate,
}: {
  transfer: AssetTransfer;
  perspectiveAssetRowId?: number;
  onClick?: (t: AssetTransfer) => void;
  showDate?: boolean;
}) {
  const { t } = useTranslation("expense");
  const fee = transfer.fee ?? 0;
  const isOut =
    perspectiveAssetRowId != null &&
    transfer.fromAssetRowId === perspectiveAssetRowId;
  const isIn =
    perspectiveAssetRowId != null &&
    transfer.toAssetRowId === perspectiveAssetRowId;
  const signed = isOut
    ? -(transfer.amount + fee)
    : isIn
      ? transfer.amount
      : null;

  return (
    <LedgerRow
      onClick={onClick ? () => onClick(transfer) : undefined}
      dim={isScheduledDate(transfer.transferDate)}
    >
      <CategoryChip color="var(--fg-tertiary)" icon="arrow-left-right" />
      <LedgerRowMain as={onClick ? "button" : "div"}>
        <LedgerRowTitle className="flex items-center gap-[5px] overflow-visible">
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              minWidth: 0,
            }}
          >
            {transfer.description || t("addTx.transfer")}
          </span>
          {/* 이체도 미래 날짜로 넣을 수 있다 — 거래와 같은 표시를 준다. */}
          {isScheduledDate(transfer.transferDate) && (
            <ScheduledBadge label={t("scheduled", { ns: "common" })} />
          )}
        </LedgerRowTitle>
        <LedgerRowSub>
          <span>
            {transfer.fromAssetName} → {transfer.toAssetName}
          </span>
          {fee > 0 && (
            <>
              <LedgerRowSep />
              <span>
                {t("transferFeePrefix")} {KRW(fee, { abs: true })}
              </span>
            </>
          )}
          {showDate ? (
            <>
              <LedgerRowSep />
              <span>{txDateFull(transfer.transferDate)}</span>
            </>
          ) : (
            txTimeLabel(transfer.transferDate) && (
              <>
                <LedgerRowSep />
                <span>{txTimeLabel(transfer.transferDate)}</span>
              </>
            )
          )}
        </LedgerRowSub>
      </LedgerRowMain>
      <div>
        <LedgerRowAmt>
          <MaskAmount card="ledger.txList" kind="transfer">
            {signed == null ? "" : signed < 0 ? "-" : "+"}
            {isEn() ? "₩" : ""}
            {KRW(signed ?? transfer.amount, { abs: true })}
          </MaskAmount>
          <HideUnit card="ledger.txList" kind="transfer">
            {isEn() ? "" : "원"}
          </HideUnit>
        </LedgerRowAmt>
      </div>
    </LedgerRow>
  );
}
