import { i18n } from "@/shared/i18n/config";
import type { AssetType } from "../model/types";

/** assetType → asset ns i18n 키. 계좌유형 enum 라벨은 번역 대상(#17 은 은행/브랜드명만 한글 유지). */
const ASSET_TYPE_KEY: Record<AssetType, string> = {
  BANK_ACCOUNT: "assetType.checking",
  SAVINGS: "assetType.savings",
  CASH: "assetType.cash",
  CREDIT_CARD: "assetType.creditcard",
  CHECK_CARD: "assetType.checkcard",
  INVESTMENT: "assetType.investment",
  LOAN: "assetType.loan",
};

/**
 * assetType → 로케일 라벨 (프리뷰 메타 표시용). ko 는 기존과 동일(입출금/적금/현금/…).
 *
 * 잔액을 함께 받는다 — 마이너스통장은 별도 `AssetType` 이 아니라 **잔액이 음수인
 * `BANK_ACCOUNT`** 라(QA #17) 타입만으로는 입출금과 구별되지 않는다.
 */
export const assetTypeLabel = (type: AssetType, balance = 0): string => {
  if (type === "BANK_ACCOUNT" && balance < 0)
    return i18n.t("asset:assetType.overdraft");
  return ASSET_TYPE_KEY[type]
    ? i18n.t(`asset:${ASSET_TYPE_KEY[type]}`)
    : String(type);
};
