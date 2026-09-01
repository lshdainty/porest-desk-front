/**
 * 증권사 무관 시세 API — 백엔드 프록시 `/v1/securities/**`.
 *
 * **왜 토스 경로를 안 쓰나** — 가계부 자산 화면은 현재가와 환율만 있으면 되는데,
 * `/v1/toss/**` 를 직접 부르면 **나무만 연결한 사용자가 403 을 맞아 평가액이 0/누락으로**
 * 보인다. 여기서는 서버가 사용자가 고른 기본 소스로 대신 조회한다.
 *
 * 증권사별 조회(`/v1/toss/**` · `/v1/namu/**`)는 증권 화면이 그대로 쓴다 — 증권사마다
 * 보여주는 게 달라 합칠 수 없다.
 */
import { apiClient } from "@/shared/api";
import type { ApiResponse } from "@/shared/types";

/** 증권사 무관 현재가. 금액은 JSON 숫자로 온다(서버가 BigDecimal 로 계산해 내린다). */
export interface BrokerQuote {
  symbol: string;
  price: number;
  currency: string;
  /**
   * 전일 종가. **못 주는 증권사가 있어 null 이 될 수 있다** — 나무는 시세 응답에 전일대비가
   * 딸려 와 공짜로 채우지만, 토스는 캔들을 종목마다 따로 받아야 해서 비어 온다.
   * 등락 표시에만 쓰이고 평가액에는 영향이 없다.
   */
  previousClose: number | null;
}

/**
 * 캔들 한 봉. **필드 이름이 토스 응답과 같은 것은 의도된 것이다** — 백엔드가 증권사 무관
 * 경로에서도 같은 모양으로 내려 주므로 차트는 고칠 게 없다.
 *
 * 금액이 문자열인 이유 — 증권사마다 소수 자릿수가 다르다(원화 0자리 · 달러 2자리).
 * 숫자로 받으면 뒤 0 이 잘린다. 파싱은 차트가 한다.
 */
export interface BrokerCandle {
  /** 오프셋이 붙은 ISO-8601(`2026-08-26T09:00:00+09:00`). 거래소 현지시각 기준이다. */
  timestamp: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  closePrice: string;
  volume: string;
  currency: string;
}

/** 백엔드 원형 — porest-core `CursorResponse<SecuritiesCandle>`. */
export interface BrokerCandleCursorPage {
  content: BrokerCandle[];
  meta: { size: number; hasNext: boolean; nextCursor: string | null };
}

/** 클라 내부 정규화 (content→candles, meta.nextCursor→nextBefore). */
export interface BrokerCandlePage {
  candles: BrokerCandle[];
  nextBefore: string | null;
}

/**
 * 한 페이지의 봉 수 상한. 서버도 같은 값으로 자르므로 넘겨 봐야 잘린다 —
 * 더 필요하면 `nextBefore` 로 이어 받는다(차트가 그렇게 동작한다).
 */
const CANDLE_PAGE_MAX = 200;

export interface BrokerExchangeRate {
  base: string;
  quote: string;
  /** 못 구하면 null — 나무는 해당 통화 보유 종목이 있어야 환율이 나온다. */
  rate: number | null;
}

export const securitiesApi = {
  getPrices: async (symbols: string[]): Promise<BrokerQuote[]> => {
    if (symbols.length === 0) return [];
    const resp: ApiResponse<BrokerQuote[]> = await apiClient.get(
      "/v1/securities/prices",
      {
        params: { symbols: symbols.join(",") },
      },
    );
    return resp.data ?? [];
  },

  /**
   * 캔들 한 페이지. **증권사는 서버가 고른다.**
   *
   * 예전엔 차트가 `/v1/toss/candles` 를 직접 불러 **나무만 연결한 사용자는 차트를 아예
   * 못 봤다**(토스 키가 없으면 403). 이제 사용자가 고른 소스로 서버가 대신 조회하고,
   * 그 소스가 캔들을 못 주면 연결된 다른 증권사로 넘어간다.
   *
   * `커서`(= 직전 응답의 `nextBefore`)의 **뜻은 증권사가 정한다** — 토스는 자기가 준 불투명
   * 문자열, 나무는 날짜다. 클라이언트는 받은 것을 그대로 돌려주기만 한다.
   */
  getCandles: async (
    symbol: string,
    interval: "1m" | "1d",
    opts?: { count?: number; before?: string; adjusted?: boolean },
  ): Promise<BrokerCandlePage> => {
    const resp: ApiResponse<BrokerCandleCursorPage> = await apiClient.get(
      "/v1/securities/candles",
      {
        params: {
          symbol,
          interval,
          size: opts?.count ? Math.min(opts.count, CANDLE_PAGE_MAX) : undefined,
          cursor: opts?.before,
          adjusted: opts?.adjusted,
        },
      },
    );
    return {
      candles: resp.data?.content ?? [],
      nextBefore: resp.data?.meta?.nextCursor ?? null,
    };
  },

  getExchangeRate: async (
    base = "USD",
    quote = "KRW",
  ): Promise<BrokerExchangeRate> => {
    const resp: ApiResponse<BrokerExchangeRate> = await apiClient.get(
      "/v1/securities/exchange-rate",
      {
        params: { base, quote },
      },
    );
    return resp.data;
  },
};
