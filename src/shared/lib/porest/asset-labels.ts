import type { AssetType } from '@/entities/asset'

/** assetType → 한글 라벨 (프리뷰 메타 표시용) */
export const ASSET_TYPE_LABEL: Record<AssetType, string> = {
  BANK_ACCOUNT: '입출금',
  SAVINGS: '적금',
  CASH: '현금',
  CREDIT_CARD: '신용카드',
  CHECK_CARD: '체크카드',
  INVESTMENT: '투자',
  LOAN: '대출',
}

export const assetTypeLabel = (type: AssetType): string => ASSET_TYPE_LABEL[type] ?? String(type)
