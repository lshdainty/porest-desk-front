import type { YNType } from "@/shared/types";
export type AssetType =
  | "BANK_ACCOUNT"
  | "CREDIT_CARD"
  | "CHECK_CARD"
  | "CASH"
  | "SAVINGS"
  | "LOAN"
  | "INVESTMENT";

export interface AssetCardCatalogBrief {
  rowId: number;
  cardName: string;
  imgUrl: string | null;
  companyName: string | null;
  companyLogoUrl: string | null;
}

/**
 * 투자 자산 보유 항목 — 증권사(자산) 단위 아래 다건.
 * linked=true → tossSymbol+quantity(토스 현재가 × 수량으로 평가) /
 * linked=false → holdingName+holdingValue(직접 입력 평가액).
 */
/** 보유 유형 — 수량 단위가 다르다(주식 주 / 금 g / 코인 개). 토스 시세 연동은 STOCK 만 가능. */
export type HoldingType = "STOCK" | "GOLD" | "CRYPTO";

export interface AssetHolding {
  rowId?: number;
  /** 구버전 응답이면 없음 — STOCK 으로 간주 */
  holdingType?: HoldingType;
  linked: boolean;
  /**
   * 종목 마스터 기준 시장코드(NAS·KOSPI …) — 선택.
   *
   * 같은 티커가 여러 시장에 걸린다(SPY·IVV·JEPI·SOXL). 종목 검색 응답이 이미 들고 있으니
   * 저장할 때 그대로 돌려보내면 서버가 종목을 확정한다. 안 보내면 서버가 심볼로 해석하고,
   * 여러 시장에 걸리면 비워 둔다.
   */
  marketCode?: string | null;
  tossSymbol?: string | null;
  /**
   * 코인 0.05·금 3.75g 등 소수 허용. 미연동도 기록 가능(선택).
   * 서버는 decimal(28,8)/BigDecimal 이고 JS number 는 십진 소수를 정확히 담지 못한다 —
   * 왕복 정밀도를 지키려 문자열로 주고받는다(Jackson 이 문자열→BigDecimal 로 받는다).
   */
  quantity?: string | null;
  holdingName?: string | null;
  holdingValue?: number | null;
  /** 총 매수원가 (원화, 수수료 포함). 평가액과의 차이가 평가손익이다. */
  totalCost?: number | null;
  /** 평단가 — 총원가 / 수량. 서버 파생값이라 읽기 전용. */
  avgPrice?: string | null;
  sortOrder?: number;
}

/** 매수·매도 거래 유형. OPENING 은 앱을 쓰기 전부터 갖고 있던 보유라 돈이 오가지 않는다. */
export type TradeType = "OPENING" | "BUY" | "SELL";

export interface AssetTrade {
  rowId: number;
  assetRowId: number;
  tradeType: TradeType;
  holdingType: HoldingType;
  /** 종목 식별자 — 연동은 토스 종목코드, 미연동은 항목명. */
  holdingKey: string;
  linked: boolean;
  /** 소수 허용이라 문자열로 주고받는다(AssetHolding.quantity 와 같은 이유). */
  quantity: string;
  /** 거래대금 — 수수료 제외. */
  amount: number;
  fee: number;
  /** 실현손익 (매도 전용). 이익 양수 / 손실 음수. */
  realizedPl?: number | null;
  tradeDate: string;
  description?: string | null;
  /** 결제 계좌 — 지정하면 증권계좌 예수금 대신 이 계좌에서 오간다. */
  settlementAssetRowId?: number | null;
}

/**
 * 매매 미리보기 — 서버가 계산해 준다.
 *
 * <p>실현손익·평균단가는 이동평균 원가 규칙을 타는데, 그 규칙을 화면에도 적어 두면
 * 서버와 갈라진다. JS 는 수를 double 로 다뤄서 끝자리도 어긋난다.
 */
export interface AssetTradePreview {
  /** 이번에 파는 만큼의 취득원가 (매도 전용). */
  soldCost: number | null;
  /** 실현손익 — 이익 양수 / 손실 음수 (매도 전용). */
  realizedPl: number | null;
  /** 이 거래로 예수금이 움직이는 양 — 매수 음수 / 매도 양수. */
  cashDelta: number;
  /** 거래 후 예수금. */
  cashAfter: number;
  /** 예수금이 모자라 결제 계좌에서 끌어올 금액 — 0 이면 이체가 생기지 않는다. */
  fundingAmount: number;
}

export interface AssetTradeFormValues {
  assetRowId: number;
  tradeType: TradeType;
  holdingType: HoldingType;
  holdingKey: string;
  linked: boolean;
  quantity: string;
  amount: number;
  fee?: number;
  tradeDate: string;
  description?: string;
  settlementAssetRowId?: number | null;
}

export interface Asset {
  rowId: number;
  userRowId: number;
  assetName: string;
  assetType: AssetType;
  balance: number;
  /** 예수금·현금 잔액 (투자 계좌의 매수 대기 자금). balance = cashBalance + holdingBalance */
  cashBalance: number;
  /** 보유 종목 평가금액. 보유가 없으면 0 */
  holdingBalance: number;
  currency: string;
  /** 원화 환산율 (통화 1단위당 원화). KRW 는 1 — 순자산은 balance × 이 값으로 환산된다 */
  exchangeRate: number;
  color: string | null;
  institution: string | null;
  memo: string | null;
  sortOrder: number;
  isIncludedInTotal: YNType;
  cardCatalog: AssetCardCatalogBrief | null;
  /** 신용카드 한도 (CREDIT_CARD 전용, nullable) */
  creditLimit?: number | null;
  /** 결제일 1~31 (CREDIT_CARD 전용, nullable) */
  paymentDay?: number | null;
  /** 결제 출금계좌 자산 rowId (CREDIT_CARD 전용, nullable) */
  paymentAssetRowId?: number | null;
  /** 연동 종목의 시장코드 (nullable) — 서버가 확정 못 했으면 없다 */
  marketCode?: string | null;
  /** 토스 연동 종목코드 (INVESTMENT 시세×수량 평가, nullable) — holdings 도입으로 deprecated */
  tossSymbol?: string | null;
  /** 토스 연동 보유수량 (INVESTMENT 시세×수량 평가, nullable) — holdings 도입으로 deprecated */
  tossQuantity?: number | null;
  /** 투자 보유 항목들 (INVESTMENT 전용, 구버전 응답이면 없음) */
  holdings?: AssetHolding[];
  /** 이번 달(1일~말일) 사용 합계 — CHECK_CARD 전용, 서버 계산(예정 제외·환불 상계).
      연결계좌 즉시 차감으로 잔액이 늘 0 이라, 행·상세는 잔액 대신 이 값을 보여준다 */
  monthlyUsedAmount?: number | null;
  createAt: string;
  modifyAt: string;
}

export interface AssetFormValues {
  assetName: string;
  assetType: AssetType;
  /** 미전달 = 서버 산정. 투자+holdings 는 서버가 평가액을 BigDecimal 로 잡으므로 보내지 않는다 */
  balance?: number;
  currency?: string;
  /** 원화 환산율 (외화 자산 전용). 미전달·KRW 면 1 */
  exchangeRate?: number | null;
  color?: string;
  institution?: string;
  memo?: string;
  sortOrder?: number;
  isIncludedInTotal?: YNType;
  cardCatalogRowId?: number | null;
  creditLimit?: number | null;
  paymentDay?: number | null;
  paymentAssetRowId?: number | null;
  /** 투자 보유 항목 전체 교체 (INVESTMENT 전용, 미전달 시 유지) */
  holdings?: AssetHolding[];
}

export interface AssetUpdateFormValues {
  assetName: string;
  assetType: AssetType;
  /** 미전달 = 기존 잔액 유지(투자+holdings 는 서버 산정) */
  balance?: number;
  currency?: string;
  /** 원화 환산율 (외화 자산 전용). 미전달·KRW 면 1 */
  exchangeRate?: number | null;
  color?: string;
  institution?: string;
  memo?: string;
  isIncludedInTotal?: YNType;
  cardCatalogRowId?: number | null;
  creditLimit?: number | null;
  paymentDay?: number | null;
  paymentAssetRowId?: number | null;
  /** 투자 보유 항목 전체 교체 (INVESTMENT 전용, 미전달 시 유지) */
  holdings?: AssetHolding[];
}

export type BillingStatus = "PENDING" | "COMPLETED" | "FAILED" | "SKIPPED";

export interface BillingItem {
  rowId: number;
  cardAssetRowId: number;
  paymentAssetRowId: number | null;
  billingAmount: number;
  /** "yyyy-MM-dd" */
  periodStart: string;
  /** "yyyy-MM-dd" */
  periodEnd: string;
  /** "yyyy-MM-dd" */
  paymentDate: string;
  status: BillingStatus;
  transferRowId: number | null;
  failureReason: string | null;
}

/** 다가오는 회차에 빠지는 할부 한 건 — 명세서의 "원금·N개월 중 k회차" 표시용. */
export interface InstallmentDue {
  expenseRowId: number;
  merchant: string | null;
  description: string | null;
  /** 할부 원금(거래 전액). */
  principalAmount: number;
  /** 총 회차 수(N). */
  installmentMonths: number;
  /** 이번이 몇 회차인지(1-base). */
  sequence: number;
  /** 이번 회차에 빠지는 금액. 나머지는 1회차에 몰린다(카드사 관행). */
  amount: number;
  /** 중도 전액 상환으로 남은 원금을 몰아 받은 회차인지 — "정리됨" 배지 + 되돌리기를 그린다. */
  paidOff: boolean;
}

export interface CardBilling {
  cardAssetRowId: number;
  /**
   * 다가오는 결제 회차의 결제예정액 = 청구 기간(결제일의 전월 1일~말일) 순사용액
   * − 같은 회차 기결제액(선결제 차감). 결제일 미설정 시 잔액 전액 fallback.
   */
  upcomingAmount: number;
  /** 회차 내 일시불 순사용액(환불 상계, 음수 가능). 옛 서버 호환으로 옵셔널. */
  upcomingLumpSumAmount?: number | null;
  /** 같은 회차에 이미 낸 금액(선결제 차감분). */
  upcomingAlreadyPaidAmount?: number | null;
  /** 이 회차에 빠지는 할부 구성 — 예정액이 이용 내역 합과 다른 이유를 설명한다. */
  upcomingInstallments?: InstallmentDue[];
  /** 다가오는 회차 청구 기간 "yyyy-MM-dd" | null (결제일 미설정 시 null) */
  upcomingPeriodStart: string | null;
  upcomingPeriodEnd: string | null;
  /** "yyyy-MM-dd" | null */
  nextPaymentDate: string | null;
  paymentDay: number | null;
  paymentAssetRowId: number | null;
  history: BillingItem[];
}

export interface AssetSummary {
  totalBalance: number;
  totalAssets: number;
  totalDebt: number;
  netWorth: number;
  lastMonthNetWorth: number;
  changeAmount: number;
  changePercent: number;
  byType: AssetTypeSummary[];
}

export interface AssetTypeSummary {
  assetType: AssetType;
  totalBalance: number;
  count: number;
}

export interface NetWorthTrendPoint {
  year: number;
  month: number;
  netWorth: number;
}

export interface AssetBalancePoint {
  /** 주 시작일 (월요일) — "YYYY-MM-DD" */
  weekStart: string;
  /** 해당 주 말 시점 자산 잔액 */
  balance: number;
}

export interface AssetTransfer {
  rowId: number;
  userRowId: number;
  fromAssetRowId: number;
  fromAssetName: string;
  toAssetRowId: number;
  toAssetName: string;
  amount: number;
  fee: number;
  /** 이자 (대출 상환 시). amount 중 이 금액은 부채를 줄이지 않고 지출로 잡힌다. */
  interestAmount: number;
  /** 원금 = amount − interestAmount. 입금 자산(대출)에 실제로 반영된 금액. */
  principalAmount: number;
  description: string | null;
  /**
   * 시스템이 만든 이체의 출처 — `TRADE_SETTLEMENT`(매수 예수금 충당) /
   * `CARD_PAYMENT`(카드 자동결제) / `CARD_REFUND`(카드 과납금을 결제계좌로 환급).
   * null 이면 사용자가 직접 만든 이체다.
   *
   * <p>값이 있으면 금액이 원본(매수·청구)과 묶여 있어 고칠 수 없다. 화면은 수정·삭제
   * 버튼을 감춘다.
   */
  autoSource: string | null;
  /** ISO-LOCAL-DATETIME (YYYY-MM-DDTHH:mm:ss) */
  transferDate: string;
  createAt: string;
}

export interface AssetTransferFormValues {
  fromAssetRowId: number;
  toAssetRowId: number;
  amount: number;
  fee?: number;
  /** 이자 (대출 상환 시). 상환액 중 이자 몫 — 부채는 amount − interestAmount 만큼만 줄어든다. */
  interestAmount?: number;
  description?: string;
  /** ISO-LOCAL-DATETIME (YYYY-MM-DDTHH:mm:ss) */
  transferDate: string;
}

export interface ReorderItem {
  assetId: number;
  sortOrder: number;
}
