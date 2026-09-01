/**
 * 나무증권(NH PLUG) 조회 API — 백엔드 프록시 `/v1/namu/**`.
 *
 * **토스와 나눠 둔 이유** — 두 증권사가 주는 데이터가 겹치지 않는다. 한 모듈에 합치면
 * 함수 절반이 "이 증권사는 미지원" 이 된다.
 */
import { apiClient } from "@/shared/api";
import type { ApiResponse } from "@/shared/types";

/**
 * 증권사 무관 현재가. 백엔드가 증권사별 필드명 차이를 흡수해 이 모양으로 준다
 * (나무 국내 `stck_prpr` / 나무 해외 `trdprc`).
 */
export interface BrokerPrice {
  symbol: string;
  price: number;
  currency: string;
}

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
}

/** 계좌 하나의 보유 현황 — 요약 + 종목별. */
export interface NamuHoldings {
  accountNo: string;
  currency: string;
  totalEvalAmount: string;
  totalProfitLoss: string;
  profitRate: string;
  items: NamuHoldingItem[];
}

export const namuApi = {
  /** 국내주식 현재가. marketCode 는 KRX(기본)·NXT·UNT — NXT 대상 여부는 서버 stock_master 가 안다. */
  getKrPrice: async (
    symbol: string,
    marketCode?: string,
  ): Promise<BrokerPrice | null> => {
    const resp: ApiResponse<BrokerPrice | null> = await apiClient.get(
      "/v1/namu/kr/price",
      {
        params: { symbol, ...(marketCode ? { marketCode } : {}) },
      },
    );
    return resp.data ?? null;
  },

  /** 해외주식 현재가. */
  getGbPrice: async (symbol: string): Promise<BrokerPrice | null> => {
    const resp: ApiResponse<BrokerPrice | null> = await apiClient.get(
      "/v1/namu/gb/price",
      {
        params: { symbol },
      },
    );
    return resp.data ?? null;
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
