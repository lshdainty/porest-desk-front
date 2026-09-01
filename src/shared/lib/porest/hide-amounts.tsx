import { Activity, type ReactNode } from "react";
import {
  HideCardContext,
  useHideCard,
} from "@/shared/lib/porest/hide-card-context";
import { isEn } from "@/shared/lib/porest/format";
import {
  HIDE_AMOUNTS_MASK,
  useHideAmounts,
} from "@/shared/lib/porest/hide-amounts-core";
import type {
  HideCardKey,
  HideKind,
} from "@/shared/lib/porest/hide-amounts-cards";

export function HideCard({
  card,
  children,
}: {
  card: HideCardKey;
  children: ReactNode;
}) {
  return (
    <HideCardContext.Provider value={card}>{children}</HideCardContext.Provider>
  );
}

/**
 * 통화 접미 단위 — 기존 `<HideUnit>원</HideUnit>` 대체.
 * ko: `원`(마스킹 시 숨김, 기존 동일) / en: 없음(접두 ₩ 로 대체됨).
 */
export function WonUnit({
  card,
  kind,
}: { card?: HideCardKey | HideCardKey[]; kind?: HideKind } = {}) {
  return (
    <HideUnit card={card} kind={kind}>
      {isEn() ? "" : "원"}
    </HideUnit>
  );
}

export function MaskAmount({
  children,
  mask = HIDE_AMOUNTS_MASK,
  card,
  kind,
}: {
  children: ReactNode;
  mask?: ReactNode;
  card?: HideCardKey | HideCardKey[];
  /** 이 금액이 어떤 거래의 것인가 — 화면 카드와 합집합으로 판정한다. */
  kind?: HideKind;
}) {
  const hidden = useHideAmounts(useHideCard(card), kind);
  return (
    <>
      <Activity mode={hidden ? "hidden" : "visible"}>{children}</Activity>
      <Activity mode={hidden ? "visible" : "hidden"}>{mask}</Activity>
    </>
  );
}

export function HideUnit({
  children,
  card,
  kind,
}: {
  children: ReactNode;
  card?: HideCardKey | HideCardKey[];
  kind?: HideKind;
}) {
  const hidden = useHideAmounts(useHideCard(card), kind);
  return <Activity mode={hidden ? "hidden" : "visible"}>{children}</Activity>;
}
