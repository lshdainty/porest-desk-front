export type AssetType = 'BANK_ACCOUNT' | 'CREDIT_CARD' | 'CHECK_CARD' | 'CASH' | 'SAVINGS' | 'LOAN' | 'INVESTMENT'
export type YNType = 'Y' | 'N'

export interface AssetCardCatalogBrief {
  rowId: number
  cardName: string
  imgUrl: string | null
  companyName: string | null
  companyLogoUrl: string | null
}

/**
 * 투자 자산 보유 항목 — 증권사(자산) 단위 아래 다건.
 * linked=true → tossSymbol+quantity(토스 현재가 × 수량으로 평가) /
 * linked=false → holdingName+holdingValue(직접 입력 평가액).
 */
/** 보유 유형 — 수량 단위가 다르다(주식 주 / 금 g / 코인 개). 토스 시세 연동은 STOCK 만 가능. */
export type HoldingType = 'STOCK' | 'GOLD' | 'CRYPTO'

export interface AssetHolding {
  rowId?: number
  /** 구버전 응답이면 없음 — STOCK 으로 간주 */
  holdingType?: HoldingType
  linked: boolean
  tossSymbol?: string | null
  /**
   * 코인 0.05·금 3.75g 등 소수 허용. 미연동도 기록 가능(선택).
   * 서버는 decimal(28,8)/BigDecimal 이고 JS number 는 십진 소수를 정확히 담지 못한다 —
   * 왕복 정밀도를 지키려 문자열로 주고받는다(Jackson 이 문자열→BigDecimal 로 받는다).
   */
  quantity?: string | null
  holdingName?: string | null
  holdingValue?: number | null
  sortOrder?: number
}

export interface Asset {
  rowId: number
  userRowId: number
  assetName: string
  assetType: AssetType
  balance: number
  /** 예수금·현금 잔액 (투자 계좌의 매수 대기 자금). balance = cashBalance + holdingBalance */
  cashBalance: number
  /** 보유 종목 평가금액. 보유가 없으면 0 */
  holdingBalance: number
  currency: string
  /** 원화 환산율 (통화 1단위당 원화). KRW 는 1 — 순자산은 balance × 이 값으로 환산된다 */
  exchangeRate: number
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
  /** 토스 연동 종목코드 (INVESTMENT 시세×수량 평가, nullable) — holdings 도입으로 deprecated */
  tossSymbol?: string | null
  /** 토스 연동 보유수량 (INVESTMENT 시세×수량 평가, nullable) — holdings 도입으로 deprecated */
  tossQuantity?: number | null
  /** 투자 보유 항목들 (INVESTMENT 전용, 구버전 응답이면 없음) */
  holdings?: AssetHolding[]
  createAt: string
  modifyAt: string
}

export interface AssetFormValues {
  assetName: string
  assetType: AssetType
  /** 미전달 = 서버 산정. 투자+holdings 는 서버가 평가액을 BigDecimal 로 잡으므로 보내지 않는다 */
  balance?: number
  currency?: string
  /** 원화 환산율 (외화 자산 전용). 미전달·KRW 면 1 */
  exchangeRate?: number | null
  color?: string
  institution?: string
  memo?: string
  sortOrder?: number
  isIncludedInTotal?: YNType
  cardCatalogRowId?: number | null
  creditLimit?: number | null
  paymentDay?: number | null
  paymentAssetRowId?: number | null
  /** 투자 보유 항목 전체 교체 (INVESTMENT 전용, 미전달 시 유지) */
  holdings?: AssetHolding[]
}

export interface AssetUpdateFormValues {
  assetName: string
  assetType: AssetType
  /** 미전달 = 기존 잔액 유지(투자+holdings 는 서버 산정) */
  balance?: number
  currency?: string
  /** 원화 환산율 (외화 자산 전용). 미전달·KRW 면 1 */
  exchangeRate?: number | null
  color?: string
  institution?: string
  memo?: string
  isIncludedInTotal?: YNType
  cardCatalogRowId?: number | null
  creditLimit?: number | null
  paymentDay?: number | null
  paymentAssetRowId?: number | null
  /** 투자 보유 항목 전체 교체 (INVESTMENT 전용, 미전달 시 유지) */
  holdings?: AssetHolding[]
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
  /** 이자 (대출 상환 시). amount 중 이 금액은 부채를 줄이지 않고 지출로 잡힌다. */
  interestAmount: number
  /** 원금 = amount − interestAmount. 입금 자산(대출)에 실제로 반영된 금액. */
  principalAmount: number
  description: string | null
  /** ISO-LOCAL-DATETIME (YYYY-MM-DDTHH:mm:ss) */
  transferDate: string
  createAt: string
}

export interface AssetTransferFormValues {
  fromAssetRowId: number
  toAssetRowId: number
  amount: number
  fee?: number
  /** 이자 (대출 상환 시). 상환액 중 이자 몫 — 부채는 amount − interestAmount 만큼만 줄어든다. */
  interestAmount?: number
  description?: string
  /** ISO-LOCAL-DATETIME (YYYY-MM-DDTHH:mm:ss) */
  transferDate: string
}

export interface ReorderItem {
  assetId: number
  sortOrder: number
}
