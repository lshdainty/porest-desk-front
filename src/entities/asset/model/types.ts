export type AssetType = 'BANK_ACCOUNT' | 'CREDIT_CARD' | 'CHECK_CARD' | 'CASH' | 'SAVINGS' | 'LOAN' | 'INVESTMENT'
export type YNType = 'Y' | 'N'

export interface AssetCardCatalogBrief {
  rowId: number
  cardName: string
  imgUrl: string | null
  companyName: string | null
  companyLogoUrl: string | null
}

export interface Asset {
  rowId: number
  userRowId: number
  assetName: string
  assetType: AssetType
  balance: number
  currency: string
  icon: string | null
  color: string | null
  institution: string | null
  memo: string | null
  sortOrder: number
  isIncludedInTotal: YNType
  cardCatalog: AssetCardCatalogBrief | null
  createAt: string
  modifyAt: string
}

export interface AssetFormValues {
  assetName: string
  assetType: AssetType
  balance: number
  currency?: string
  icon?: string
  color?: string
  institution?: string
  memo?: string
  sortOrder?: number
  cardCatalogRowId?: number | null
}

export interface AssetUpdateFormValues {
  assetName: string
  assetType: AssetType
  balance: number
  currency?: string
  icon?: string
  color?: string
  institution?: string
  memo?: string
  isIncludedInTotal?: YNType
  cardCatalogRowId?: number | null
}

export interface AssetSummary {
  totalBalance: number
  totalAssets: number
  totalDebt: number
  netWorth: number
  lastMonthNetWorth: number
  changeAmount: number
  changePercent: number
  byType: AssetTypeSummary[]
}

export interface AssetTypeSummary {
  assetType: AssetType
  totalBalance: number
  count: number
}

export interface NetWorthTrendPoint {
  year: number
  month: number
  netWorth: number
}

export interface AssetBalancePoint {
  /** 주 시작일 (월요일) — "YYYY-MM-DD" */
  weekStart: string
  /** 해당 주 말 시점 자산 잔액 */
  balance: number
}

export interface AssetTransfer {
  rowId: number
  userRowId: number
  fromAssetRowId: number
  fromAssetName: string
  toAssetRowId: number
  toAssetName: string
  amount: number
  fee: number
  description: string | null
  transferDate: string
  createAt: string
}

export interface AssetTransferFormValues {
  fromAssetRowId: number
  toAssetRowId: number
  amount: number
  fee?: number
  description?: string
  transferDate: string
}

export interface ReorderItem {
  assetId: number
  sortOrder: number
}
