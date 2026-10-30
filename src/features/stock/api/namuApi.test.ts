// 나무 탭은 늘 나무 경로를 부른다(I-13b 16) — 기본 증권사 경로(/v1/securities/*)를 타지 않는다
import { beforeEach, describe, expect, it, vi } from "vitest";

const get = vi.hoisted(() => vi.fn());
vi.mock("@/shared/api", () => ({ apiClient: { get } }));

const { namuApi } = await import("./namuApi");
const { securitiesApi, candlesPath } = await import("./securitiesApi");
const { stockApi } = await import("./stockApi");

beforeEach(() => {
  get.mockReset();
  get.mockResolvedValue({ data: [] });
});

describe("나무 새 경로", () => {
  it("관심 시세 · 환율 · 상세 · 체결 · 투자자별 · 증거금이 /v1/namu/* 로 나간다", async () => {
    await namuApi.getPrices(["005930", "AAPL"]);
    await namuApi.getExchangeRate();
    await namuApi.getQuote("KR", "005930");
    await namuApi.getQuote("US", "AAPL");
    await namuApi.getExecutions("KR", "005930");
    await namuApi.getExecutions("US", "AAPL", 12);
    await namuApi.getInvestors("005930");
    await namuApi.getMargin();
    const urls = get.mock.calls.map((c) => c[0]);
    expect(urls).toEqual([
      "/v1/namu/prices",
      "/v1/namu/exchange-rate",
      "/v1/namu/kr/quote",
      "/v1/namu/gb/quote",
      "/v1/namu/kr/executions",
      "/v1/namu/gb/executions",
      "/v1/namu/kr/investors",
      "/v1/namu/margin",
    ]);
    expect(urls.some((u) => u.startsWith("/v1/securities/"))).toBe(false);
  });
  it("시세는 심볼을 쉼표로 묶어 한 번에 보내고, 빈 목록은 부르지 않는다", async () => {
    await namuApi.getPrices([]);
    expect(get).not.toHaveBeenCalled();
    await namuApi.getPrices(["A", "B"]);
    expect(get.mock.calls[0]![1]).toEqual({ params: { symbols: "A,B" } });
  });
  it("체결 기본 20 · 투자자별 기본 5", async () => {
    await namuApi.getExecutions("KR", "X");
    await namuApi.getInvestors("X");
    expect(get.mock.calls[0]![1].params.count).toBe(20);
    expect(get.mock.calls[1]![1].params.count).toBe(5);
  });
  it("응답 data 가 비어 있어도 목록은 빈 배열이다(깨지지 않는다)", async () => {
    get.mockResolvedValue({});
    expect(await namuApi.getPrices(["A"])).toEqual([]);
    expect(await namuApi.getExecutions("KR", "A")).toEqual([]);
    expect(await namuApi.getInvestors("A")).toEqual([]);
  });
});

describe("캔들 경로는 그 탭의 증권사", () => {
  it("broker 에 따라 토스 · 나무 · 기본 증권사 경로", async () => {
    get.mockResolvedValue({ data: { content: [], meta: {} } });
    await securitiesApi.getCandles("A", "1d", { broker: "TOSS" });
    await securitiesApi.getCandles("A", "1d", { broker: "NAMU" });
    await securitiesApi.getCandles("A", "1d");
    expect(get.mock.calls.map((c) => c[0])).toEqual([
      "/v1/toss/candles",
      "/v1/namu/candles",
      "/v1/securities/candles",
    ]);
    expect(candlesPath(null)).toBe("/v1/securities/candles");
  });
  it("한 페이지는 200봉을 넘기지 않는다", async () => {
    get.mockResolvedValue({ data: { content: [], meta: {} } });
    await securitiesApi.getCandles("A", "1d", { count: 252, broker: "NAMU" });
    expect(get.mock.calls[0]![1].params.size).toBe(200);
  });
});

describe("토스 새 경로", () => {
  it("투자자별 · 주문 가능", async () => {
    await stockApi.getInvestorTrading("005930");
    await stockApi.getBuyingPower(1, "USD");
    expect(get.mock.calls[0]![0]).toBe(
      "/v1/toss/stocks/005930/investor-trading",
    );
    expect(get.mock.calls[1]![0]).toBe("/v1/toss/buying-power");
    expect(get.mock.calls[1]![1]).toEqual({
      params: { accountSeq: 1, currency: "USD" },
    });
  });
  it("심볼에 점이 있어도 경로가 안전하다", async () => {
    await stockApi.getInvestorTrading("BRK.B");
    expect(get.mock.calls[0]![0]).toContain("BRK.B");
  });
});

describe("임베드 broker 쿼리", () => {
  it("toss · namu(대소문자 무시)만 받는다", async () => {
    const { candleBrokerFromParam } = await import("./securitiesApi");
    expect(candleBrokerFromParam("toss")).toBe("TOSS");
    expect(candleBrokerFromParam("NAMU")).toBe("NAMU");
    expect(candleBrokerFromParam("Namu")).toBe("NAMU");
  });
  it("없거나 모르는 값은 undefined — 옛 앱은 /v1/securities/candles", async () => {
    const { candleBrokerFromParam } = await import("./securitiesApi");
    expect(candleBrokerFromParam(null)).toBeUndefined();
    expect(candleBrokerFromParam("")).toBeUndefined();
    expect(candleBrokerFromParam("kis")).toBeUndefined();
  });
});
