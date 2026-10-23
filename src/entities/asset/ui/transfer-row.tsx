import { useTranslation } from "react-i18next";
import { Badge } from "@/shared/ds/badge";
import { List, ListButtonItem, ListItem, ListTile } from "@/shared/ds/list";
import { TagGroup, TagGroupItem } from "@/shared/ds/tag-group";
import { cn } from "@/shared/lib/cn";
import { KRW, MINUS, isEn } from "@/shared/lib/groo/format";
import { HideUnit, MaskAmount } from "@/shared/lib/groo/hide-amounts";
import {
  isScheduledDate,
  txDateFull,
  txTimeLabel,
} from "@/shared/lib/groo/ledger-format";
import { Icon } from "@/shared/ui/groo/primitives";
import type { AssetTransfer } from "../model/types";

/**
 * 이체 한 건.
 *
 * 거래 줄(`ExpenseRow`)과 같은 ds List 줄 값이다(I-07 5 — list.md): 앞 타일 40 · 모서리 12 · **회색**(이체는 회색 —
 * list.md Prefix), 제목 t5 · 400 줄바꿈, 설명 t3 한 줄 말줄임(Tag Group), 뒤 금액 t5 · 700 · 원까지 한 줄. 예정 이체는
 * 흐리게 하지 않고 금액만 fg-neutral-subtle — 배지가 말한다.
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
  gutter = false,
}: {
  transfer: AssetTransfer;
  perspectiveAssetRowId?: number;
  onClick?: (t: AssetTransfer) => void;
  showDate?: boolean;
  /**
   * **임시 인자 — 거래 줄(`ExpenseRow`)의 `gutter` 와 같은 뜻이다.** 줄이 제 좌우 24 를 갖는가(ds List 기본). 기본 false 는
   * 호스트(가계부 · 자산 상세 · 거래 상세)가 아직 바깥 24 를 쥐고 있어서다. I-06 이 머지된 뒤 가계부가 두 줄을 함께 켠다(I-07 4).
   */
  gutter?: boolean;
}) {
  const { t } = useTranslation("expense");
  const { t: tc } = useTranslation("common");
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
  // 이체도 미래 날짜로 넣을 수 있다 — 거래와 같은 표시를 준다. 합계에 안 드는 줄이라 금액만 옅게
  const scheduled = isScheduledDate(transfer.transferDate);
  const time = txTimeLabel(transfer.transferDate);

  const title = (
    <>
      {transfer.description || t("addTx.transfer")}
      {scheduled && (
        <Badge
          variant="weak"
          tone="neutral"
          size="medium"
          className="ml-x1_5 align-middle"
        >
          {tc("scheduled")}
        </Badge>
      )}
    </>
  );

  const detail = (
    <TagGroup size="t3" truncate>
      <TagGroupItem>
        {transfer.fromAssetName} → {transfer.toAssetName}
      </TagGroupItem>
      {fee > 0 && (
        <TagGroupItem>
          {t("transferFeePrefix")}{" "}
          {/* 수수료도 금액이다 — 위 이체 금액은 가려지는데 여기만 그대로 남아
              있었다(2026-09-17 설계 조사). 같은 카드·같은 종류로 판정한다. */}
          <MaskAmount card="ledger.txList" kind="transfer" mask="•••">
            {KRW(fee, { abs: true })}
          </MaskAmount>
        </TagGroupItem>
      )}
      {showDate ? (
        <TagGroupItem>{txDateFull(transfer.transferDate)}</TagGroupItem>
      ) : (
        time && <TagGroupItem>{time}</TagGroupItem>
      )}
    </TagGroup>
  );

  const suffix = (
    <span
      className={cn(
        "whitespace-nowrap font-bold tabular-nums",
        scheduled ? "text-fg-neutral-subtle" : "text-fg-neutral",
      )}
    >
      <MaskAmount card="ledger.txList" kind="transfer">
        {signed == null ? "" : signed < 0 ? MINUS : "+"}
        {isEn() ? "₩" : ""}
        {KRW(signed ?? transfer.amount, { abs: true })}
      </MaskAmount>
      <HideUnit card="ledger.txList" kind="transfer">
        {isEn() ? "" : "원"}
      </HideUnit>
    </span>
  );

  // 이체는 회색 타일(list.md Prefix "이체 줄은 회색") — chart-gray-weak 바탕 + chart-gray 아이콘 20
  const prefix = (
    <ListTile
      style={{
        background: "var(--color-chart-gray-weak)",
        color: "var(--color-chart-gray)",
      }}
      aria-hidden
    >
      <Icon name="arrow-left-right" size={20} />
    </ListTile>
  );

  return (
    <List
      className={cn(
        // 임시 — 호스트가 바깥 24 를 쥔 동안 줄의 좌우 24 를 걷는다(gutter 인자 주석)
        !gutter && "[&_[data-slot=list-content]]:px-0",
      )}
    >
      {onClick ? (
        <ListButtonItem
          title={title}
          detail={detail}
          prefix={prefix}
          suffix={suffix}
          align="top"
          onClick={() => onClick(transfer)}
        />
      ) : (
        <ListItem
          title={title}
          detail={detail}
          prefix={prefix}
          suffix={suffix}
          align="top"
        />
      )}
    </List>
  );
}
