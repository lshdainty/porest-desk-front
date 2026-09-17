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
  force,
}: {
  children: ReactNode;
  mask?: ReactNode;
  card?: HideCardKey | HideCardKey[];
  /** 이 금액이 어떤 거래의 것인가 — 화면 카드와 합집합으로 판정한다. */
  kind?: HideKind;
  /**
   * 화면 카드와 **무관하게** 가린다 — 자산 하나에 붙은 `isAmountHidden` 같은 것.
   *
   * <p>두 축은 **합집합**이다. 카드 가리기는 "이 화면의 이 묶음을 가린다" 는 사용자
   * 설정이고, 이건 "이 자산은 늘 가린다" 는 대상의 속성이라 서로를 덮지 않는다.
   *
   * <p>새 훅을 만들지 않는 이유 — 부르는 자리(자산 행·상세)는 이미 asset 객체를 손에
   * 쥐고 있어 판정이 한 줄이다. 훅을 만들면 그 객체를 다시 찾아 오게 된다.
   */
  force?: boolean;
}) {
  const hidden = useHideAmounts(useHideCard(card), kind) || !!force;
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
  force,
}: {
  children: ReactNode;
  card?: HideCardKey | HideCardKey[];
  kind?: HideKind;
  /** {@link MaskAmount} 의 같은 이름과 같은 뜻 — 카드와 합집합이다. */
  force?: boolean;
}) {
  const hidden = useHideAmounts(useHideCard(card), kind) || !!force;
  return <Activity mode={hidden ? "hidden" : "visible"}>{children}</Activity>;
}
