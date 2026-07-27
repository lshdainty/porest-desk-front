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
  color: string | null
  institution: string | null
  memo: string | null
  sortOrder: number
  isIncludedInTotal: YNType
  cardCatalog: AssetCardCatalogBrief | null
  /** 신용카드 한도 (CREDIT_CARD 전용, nullable) */
  creditLimit?: number | null
  /** 결제일 1~31 (CREDIT_CARD 전용, nullable) */
  paymentDay?: number | null
  /** 결제 출금계좌 자산 rowId (CREDIT_CARD 전용, nullable) */
  paymentAssetRowId?: number | null
  /** 토스 연동 종목코드 (INVESTMENT 시세×수량 평가, nullable) */
  tossSymbol?: string | null
  /** 토스 연동 보유수량 (INVESTMENT 시세×수량 평가, nullable) */
  tossQuantity?: number | null
  createAt: string
  modifyAt: string
}

export interface AssetFormValues {
  assetName: string
  assetType: AssetType
  balance: number
  currency?: string
  color?: string
  institution?: string
  memo?: string
  sortOrder?: number
  isIncludedInTotal?: YNType
  cardCatalogRowId?: number | null
  creditLimit?: number | null
  paymentDay?: number | null
  paymentAssetRowId?: number | null
}

export interface AssetUpdateFormValues {
  assetName: string
  assetType: AssetType
  balance: number
  currency?: string
  color?: string
  institution?: string
  memo?: string
  isIncludedInTotal?: YNType
  cardCatalogRowId?: number | null
  creditLimit?: number | null
  paymentDay?: number | null
  paymentAssetRowId?: number | null
}

export type BillingStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'SKIPPED'

export interface BillingItem {
  rowId: number
  cardAssetRowId: number
  paymentAssetRowId: number | null
  billingAmount: number
  /** "yyyy-MM-dd" */
  periodStart: string
  /** "yyyy-MM-dd" */
  periodEnd: string
  /** "yyyy-MM-dd" */
  paymentDate: string
  status: BillingStatus
  transferRowId: number | null
  failureReason: string | null
}

export interface CardBilling {
  cardAssetRowId: number
  /**
   * 다가오는 결제 회차의 결제예정액 = 청구 기간(결제일의 전월 1일~말일) 순사용액
   * − 같은 회차 기결제액(선결제 차감). 결제일 미설정 시 잔액 전액 fallback.
   */
  upcomingAmount: number
  /** 다가오는 회차 청구 기간 "yyyy-MM-dd" | null (결제일 미설정 시 null) */
  upcomingPeriodStart: string | null
  upcomingPeriodEnd: string | null
  /** "yyyy-MM-dd" | null */
  nextPaymentDate: string | null
  paymentDay: number | null
  paymentAssetRowId: number | null
  history: BillingItem[]
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
