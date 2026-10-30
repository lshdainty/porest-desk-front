// 토스 관심 시세 훅 본체 — 전일 종가는 시장 날짜로 가른다(검수 N1: 미국 종목이 한국 날짜로 가려 0.00% 가 되던 것) · 날이 바뀌면 다시 받는다(N10)
import { act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

const getPrices = vi.hoisted(() => vi.fn());
const getCandles = vi.hoisted(() => vi.fn());
vi.mock("../api/stockApi", async (orig) => ({
  ...(await orig<typeof import("../api/stockApi")>()),
  stockApi: { getPrices, getCandles },
}));

const { useTossWatchQuotes } = await import("./useWatchQuotes");

let root: Root;
let container: HTMLDivElement;
let qc: QueryClient;
const holder: { current: ReturnType<typeof useTossWatchQuotes> | null } = {
  current: null,
};
function Probe({ symbols }: { symbols: string[] }) {
  const v = useTossWatchQuotes(symbols);
  useEffect(() => {
    holder.current = v;
  });
  return null;
}
const mount = (symbols: string[]) =>
  act(async () => {
    root.render(
      <QueryClientProvider client={qc}>
        <Probe symbols={symbols} />
      </QueryClientProvider>,
    );
  });
/** 비동기 질의가 끝나길 기다린다 — 실제 타이머로 짧게 몇 번 */
const settle = async (until: () => boolean) => {
  for (let i = 0; i < 40 && !until(); i++)
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
};

// 한국 10-30 02:00 = 뉴욕 10-29 13:00 (미국 장중). 토스 1d 봉은 현지 자정 고정, 최신순.
const bar = (timestamp: string, closePrice: string) => ({
  timestamp,
  openPrice: closePrice,
  highPrice: closePrice,
  lowPrice: closePrice,
  closePrice,
  volume: "1",
});
const page = (candles: ReturnType<typeof bar>[]) => ({
  candles,
  nextBefore: null,
});

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-30T02:00:00+09:00"));
  qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  getPrices.mockReset();
  getCandles.mockReset();
  holder.current = null;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.useRealTimers();
});

describe("토스 관심 시세 — 전일 종가는 시장 날짜로(N1)", () => {
  it("미국 종목은 뉴욕 날짜로 가른다 — 진행 중인 오늘 봉(10-29)이 아니라 어제(10-28) 종가가 전일: 한국 02:00 에도 0.00% 가 아니다", async () => {
    getPrices.mockResolvedValue([
      { symbol: "AAPL", lastPrice: "231.40", currency: "USD", timestamp: null },
    ]);
    getCandles.mockResolvedValue(
      page([
        bar("2026-10-29T00:00:00-04:00", "231.40"), // 오늘 봉(뉴욕) — 진행 중, 종가 ≈ 현재가
        bar("2026-10-28T00:00:00-04:00", "225.00"),
        bar("2026-10-27T00:00:00-04:00", "222.00"),
      ]),
    );
    await mount(["AAPL"]);
    await settle(() => holder.current?.priceOf("AAPL").changePct != null);
    const q = holder.current!.priceOf("AAPL");
    expect(q.price).toBe(231.4);
    // 한국 날짜(10-30)로 가르면 10-29 봉이 전일이 되어 0.00% — 틀린 값
    expect(q.changePct).toBeCloseTo(((231.4 - 225) / 225) * 100, 4);
    expect(Math.abs(q.changePct!)).toBeGreaterThan(1);
  });
  it("국내 종목은 한국 날짜 — 장 시작 전(오늘 봉 없음)이면 가장 최근 봉이 전일", async () => {
    getPrices.mockResolvedValue([
      {
        symbol: "005930",
        lastPrice: "74500",
        currency: "KRW",
        timestamp: null,
      },
    ]);
    getCandles.mockResolvedValue(
      page([
        bar("2026-10-29T00:00:00+09:00", "74000"),
        bar("2026-10-28T00:00:00+09:00", "73000"),
      ]),
    );
    await mount(["005930"]);
    await settle(() => holder.current?.priceOf("005930").changePct != null);
    expect(holder.current!.priceOf("005930").changePct).toBeCloseTo(
      ((74500 - 74000) / 74000) * 100,
      4,
    );
  });
  it("시세가 오기 전(통화를 모를 때)에는 일봉을 부르지 않는다 — 한국 날짜로 잘못 집지 않게", async () => {
    let release: (v: unknown) => void = () => {};
    getPrices.mockReturnValue(new Promise((r) => (release = r)));
    getCandles.mockResolvedValue(page([]));
    await mount(["AAPL"]);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 30));
    });
    expect(getCandles).not.toHaveBeenCalled();
    release([
      { symbol: "AAPL", lastPrice: "231.40", currency: "USD", timestamp: null },
    ]);
    await settle(() => getCandles.mock.calls.length > 0);
    expect(getCandles).toHaveBeenCalledTimes(1);
  });
});
