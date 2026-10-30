/**
 * 나무증권(NH PLUG) 조회 API — 백엔드 프록시 `/v1/namu/**`.
 *
 * **토스와 나눠 둔 이유** — 인증·경로·응답 칸이 증권사마다 달라 서버가 증권사별 경로를 따로 둔다.
 * 화면은 두 증권사가 공통으로 보이는 것(호가 · 체결 · 상하한가 · 투자 유의 · 기본 정보 · 장 상태)을
 * 같은 모양으로 그리고, 응답 모양을 맞추는 일(토스 `Orderbook` · `Trade` 와 같은 이름)은 서버가 한다.
 *
 * **나무 탭은 늘 나무 값을 부른다** — 관심 시세 · 상세 시세 · 차트 · 환율을 `/v1/securities/**`
 * (사용자의 기본 증권사)가 아니라 `/v1/namu/**` 로. 기본이 토스인 사용자의 나무 탭에 토스 값이 나오지 않게 한다.
 * 모든 숫자 칸은 문자열이고(정밀도) 모든 칸이 null 일 수 있다 — 값이 없으면 그 줄을 그리지 않는다.
 */
import { apiClient } from "@/shared/api";
import type { ApiResponse } from "@/shared/types";
import type {
  InvestorTradingDay,
  TossOrderbook,
  TossStockWarning,
  TossTrade,
} from "./stockApi";

/** 나무 계좌 1건. */
export interface NamuAccount {
  accountNo: string;
  accountType: string;
}

/** 보유 종목 1건. 국내·해외 필드명 차이는 서버가 흡수해 이 모양으로 준다. */
export interface NamuHoldingItem {
  symbol: string;
  name: string;
  /** 금액·수량은 문자열로 온다 — 서버가 그렇게 주는 이유가 정밀도 보존이다. */
  quantity: string;
  avgPrice: string;
  currentPrice: string;
  evalAmount: string;
  profitLoss: string;
  /** 매도 가능 수량 — 미국만 온다. 국내 잔고에는 이 칸이 없어 null */
  sellableQuantity?: string | null;
}

/** 계좌 하나의 보유 현황 — 요약 + 종목별. */
export interface NamuHoldings {
  accountNo: string;
  currency: string;
  totalEvalAmount: string;
  totalProfitLoss: string;
  profitRate: string;
  items: NamuHoldingItem[];
  /** 예수금 — 국내(KRW) 잔고만. 해외는 null */
  deposit?: string | null;
  /** 주문 가능 금액(100%) — 국내(KRW) 잔고만. 해외는 null */
  orderableAmount?: string | null;
}

/** 목록 시세 한 줄 — 가격은 JSON 숫자, `marketState` 는 서버 어휘(아래 {@link NamuMarketState}) */
export interface NamuListQuote {
  symbol: string;
  price: number;
  currency: string;
  previousClose: number | null;
  marketState: NamuMarketState | null;
}

/** 장 상태 — 서버 어휘. 모르는 값은 서버가 null 로 준다 */
export type NamuMarketState =
  | "PRE"
  | "REGULAR"
  | "AFTER"
  | "DAYTIME"
  | "SINGLE_PRICE"
  | "HALTED"
  | "BEFORE_OPEN"
  | "CLOSED";

/** 종목 상세 시세 — 국내 `currentPrice`(UNT) · 미국 `current` · ETF `etfCurrent` 를 한 모양으로. 칸마다 null 일 수 있다 */
export interface NamuQuoteDetail {
  symbol: string | null;
  name: string | null;
  currency: string | null;
  price: string | null;
  previousClose: string | null;
  open: string | null;
  high: string | null;
  low: string | null;
  volume: string | null;
  upperLimit: string | null;
  lowerLimit: string | null;
  /** 토스 `Orderbook` 과 같은 이름 */
  orderbook: TossOrderbook | null;
  warnings: Pick<TossStockWarning, "warningType">[] | null;
  marketState: NamuMarketState | null;
  sector: string | null;
  /** 원 단위 */
  marketCap: string | null;
  listingDate: string | null;
  listedShares: string | null;
  per: string | null;
  pbr: string | null;
  eps: string | null;
  high52w: string | null;
  low52w: string | null;
  foreignRate: string | null;
  extendedSession: {
    session: string | null;
    price: string | null;
    changeRate: string | null;
    changeSign: string | null;
  } | null;
  etf: Record<string, string | null> | null;
}

/** 해외 증거금 — 통화별 행 중 USD. 주문 가능 칸은 없다(예수금 `foreignDeposit` 을 "예수금 · 달러" 로 보인다) */
export interface NamuMargin {
  currency: string | null;
  foreignDeposit: string | null;
  foreignWithdrawable: string | null;
  baseExchangeRate: string | null;
}

export interface NamuExchangeRate {
  base: string;
  quote: string;
  /** 못 구하면 null */
  rate: number | null;
}

export const namuApi = {
  /**
   * 관심 시세 다건(상한 50 · 서버 캐시 20초 · 예산 4초). 종목마다 장 상태가 딸려 온다.
   * 응답이 비어도 오류가 아니다 — 못 받은 종목은 줄에서 빠진다.
   */
  getPrices: async (symbols: string[]): Promise<NamuListQuote[]> => {
    if (symbols.length === 0) return [];
    const resp: ApiResponse<NamuListQuote[]> = await apiClient.get(
      "/v1/namu/prices",
      { params: { symbols: symbols.join(",") } },
    );
    return resp.data ?? [];
  },

  /** 원화 환산 환율(캐시 10분). 못 구하면 rate 가 null */
  getExchangeRate: async (base = "USD"): Promise<NamuExchangeRate> => {
    const resp: ApiResponse<NamuExchangeRate> = await apiClient.get(
      "/v1/namu/exchange-rate",
      { params: { base } },
    );
    return resp.data;
  },

  /** 종목 상세 시세 하나 — 머리 · 오늘 시세 · 호가 · 기본 정보 · 투자 지표가 이 응답이다(서버 캐시 20초) */
  getQuote: async (
    market: "KR" | "US",
    symbol: string,
  ): Promise<NamuQuoteDetail> => {
    const resp: ApiResponse<NamuQuoteDetail> = await apiClient.get(
      `/v1/namu/${market === "KR" ? "kr" : "gb"}/quote`,
      { params: { symbol } },
    );
    return resp.data;
  },

  /** 최근 체결(최신이 먼저) — 토스 `Trade` 와 같은 이름. 서버 캐시 없음 */
  getExecutions: async (
    market: "KR" | "US",
    symbol: string,
    count = 20,
  ): Promise<TossTrade[]> => {
    const resp: ApiResponse<TossTrade[]> = await apiClient.get(
      `/v1/namu/${market === "KR" ? "kr" : "gb"}/executions`,
      { params: { symbol, count } },
    );
    return resp.data ?? [];
  },

  /** 투자자별 매매동향(국내 종목만) — 최신이 먼저 */
  getInvestors: async (
    symbol: string,
    count = 5,
  ): Promise<InvestorTradingDay[]> => {
    const resp: ApiResponse<InvestorTradingDay[]> = await apiClient.get(
      "/v1/namu/kr/investors",
      { params: { symbol, count } },
    );
    return resp.data ?? [];
  },

  /** 해외 증거금(USD 행). 행이 없으면 모든 칸이 null */
  getMargin: async (): Promise<NamuMargin> => {
    const resp: ApiResponse<NamuMargin> =
      await apiClient.get("/v1/namu/margin");
    return resp.data;
  },

  /** 본인 계좌 목록. */
  getAccounts: async (): Promise<NamuAccount[]> => {
    const resp: ApiResponse<NamuAccount[]> =
      await apiClient.get("/v1/namu/accounts");
    return resp.data ?? [];
  },

  /**
   * 보유 종목. currency 가 KRW 면 국내, 그 밖(USD·CNY·HKD·JPY)이면 해외.
   * accountNo 를 안 주면 서버가 첫 계좌를 쓴다.
   */
  getHoldings: async (
    currency = "KRW",
    accountNo?: string,
  ): Promise<NamuHoldings> => {
    const resp: ApiResponse<NamuHoldings> = await apiClient.get(
      "/v1/namu/holdings",
      {
        params: { currency, ...(accountNo ? { accountNo } : {}) },
      },
    );
    return resp.data;
  },
};
