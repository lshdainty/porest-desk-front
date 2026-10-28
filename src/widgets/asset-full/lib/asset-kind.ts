import {
  Banknote,
  CalendarDays,
  Coins,
  CreditCard,
  Landmark,
  Percent,
  PiggyBank,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import type { Asset } from "@/entities/asset";
import { assetTypeToSub, type AccountSub } from "./account-sub";

/**
 * 추가 · 수정 폼의 "종류" 아홉(I-17 6) — 계좌 여섯(AccountSub) · 카드 둘 · 투자.
 *
 * 저장 종류(AssetType)와 1:1 이 아니다 — 예금 · 적금은 둘 다 SAVINGS 이고 마이너스 통장은 음수 BANK_ACCOUNT 다
 * (`account-sub.ts`). 값은 화면 개념의 이름표고 서버에 가는 값은 아니다.
 */
export type AssetKind = AccountSub | "신용카드" | "체크카드" | "투자";

export type AssetGroup = "account" | "card" | "invest";

export interface KindGroup {
  group: AssetGroup;
  /** 묶음 이름 키 — `asset` 네임스페이스 */
  labelKey: string;
  kinds: AssetKind[];
}

/** 1단계 묶음 셋과 그 안 차례(그림 `KINDS` `forms.py:84-86` 그대로) */
export const KIND_GROUPS: KindGroup[] = [
  {
    group: "account",
    labelKey: "group.account",
    kinds: ["입출금", "예금", "적금", "마이너스통장", "현금", "대출"],
  },
  { group: "card", labelKey: "group.card", kinds: ["신용카드", "체크카드"] },
  { group: "invest", labelKey: "group.invest", kinds: ["투자"] },
];

/** 종류 이름 키 — 기존 키를 그대로 쓴다(`accountSub.*` · `assetType.*`) */
export const KIND_LABEL_KEY: Record<AssetKind, string> = {
  입출금: "accountSub.checking",
  예금: "accountSub.deposit",
  적금: "accountSub.savings",
  마이너스통장: "accountSub.overdraft",
  현금: "accountSub.cash",
  대출: "accountSub.loan",
  신용카드: "assetType.creditcard",
  체크카드: "assetType.checkcard",
  투자: "assetType.investment",
};

/** 앞 아이콘 22 — 두 카드가 같은 아이콘인 것은 그림 그대로다(제목이 가른다) */
export const KIND_ICON: Record<AssetKind, LucideIcon> = {
  입출금: Landmark,
  예금: PiggyBank,
  적금: CalendarDays,
  마이너스통장: Percent,
  현금: Banknote,
  대출: Coins,
  신용카드: CreditCard,
  체크카드: CreditCard,
  투자: TrendingUp,
};

export const groupOfKind = (kind: AssetKind): AssetGroup =>
  kind === "신용카드" || kind === "체크카드"
    ? "card"
    : kind === "투자"
      ? "invest"
      : "account";

export const isAccountKind = (kind: AssetKind): kind is AccountSub =>
  groupOfKind(kind) === "account";

/** 같은 묶음의 종류 — 수정 폼의 "종류" 칸이 고를 수 있는 것 */
export const kindsOfSameGroup = (kind: AssetKind): AssetKind[] =>
  KIND_GROUPS.find((g) => g.group === groupOfKind(kind))?.kinds ?? [kind];

/** 저장된 자산 → 종류. 신용 · 체크 · 투자는 저장 종류로, 계좌는 잔액 부호까지 본다 */
export function kindOfAsset(asset: Asset): AssetKind {
  switch (asset.assetType) {
    case "CREDIT_CARD":
      return "신용카드";
    case "CHECK_CARD":
      return "체크카드";
    case "INVESTMENT":
      return "투자";
    default:
      return assetTypeToSub(asset.assetType, asset.balance ?? 0);
  }
}
