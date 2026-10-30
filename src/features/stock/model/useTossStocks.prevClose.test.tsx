// 전일 종가 질의 키 — 시장의 오늘이 들어 있다. 날이 바뀌면 키가 바뀌어 다시 받는다(검수 N10)
import { act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { stockKeys } from "@/shared/config";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

const getCandles = vi.hoisted(() => vi.fn());
vi.mock("../api/stockApi", async (orig) => ({
  ...(await orig<typeof import("../api/stockApi")>()),
  stockApi: { getCandles },
}));

const { usePrevClose } = await import("./useTossStocks");

let root: Root;
let container: HTMLDivElement;
let qc: QueryClient;
let seen: number | null | undefined;
function Probe({ symbol, tz }: { symbol: string; tz: string }) {
  const q = usePrevClose(symbol, tz);
  useEffect(() => {
    seen = q.data;
  });
  return null;
}
const mount = (tz = "Asia/Seoul") =>
  act(async () => {
    root.render(
      <QueryClientProvider client={qc}>
        <Probe symbol="005930" tz={tz} />
      </QueryClientProvider>,
    );
  });
const flush = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, 20));
  });

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  vi.useFakeTimers({ toFake: ["Date", "setInterval", "clearInterval"] });
  vi.setSystemTime(new Date("2026-10-29T13:00:00+09:00"));
  qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  getCandles.mockReset();
  getCandles.mockResolvedValue({
    candles: [
      {
        timestamp: "2026-10-28T00:00:00+09:00",
        openPrice: "1",
        highPrice: "1",
        lowPrice: "1",
        closePrice: "73000",
        volume: "1",
      },
    ],
    nextBefore: null,
  });
  seen = undefined;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.useRealTimers();
});

describe("전일 종가 질의 키", () => {
  it("키에 시간대와 그 시장의 오늘이 들어 있다 — 날이 바뀌면 키가 바뀐다", () => {
    const a = stockKeys.prevClose("005930", "Asia/Seoul", "2026-10-29");
    const b = stockKeys.prevClose("005930", "Asia/Seoul", "2026-10-30");
    expect(a).not.toEqual(b);
    expect(a).toContain("2026-10-29");
    expect(
      stockKeys.prevClose("AAPL", "America/New_York", "2026-10-29"),
    ).not.toEqual(stockKeys.prevClose("AAPL", "Asia/Seoul", "2026-10-29"));
  });
  it("같은 날에는 다시 받지 않는다(10분 캐시) — 다시 그려도 한 번", async () => {
    await mount();
    await flush();
    expect(seen).toBe(73000);
    await mount();
    await flush();
    expect(getCandles).toHaveBeenCalledTimes(1);
  });
  it("화면을 띄워 둔 채 날이 바뀌면(60초 신호) 새 키로 다시 받는다", async () => {
    await mount();
    await flush();
    expect(getCandles).toHaveBeenCalledTimes(1);
    vi.setSystemTime(new Date("2026-10-30T00:00:30+09:00"));
    await act(async () => {
      vi.advanceTimersByTime(60_000);
    });
    await flush();
    expect(getCandles).toHaveBeenCalledTimes(2);
  });
  it("미국 시간대는 뉴욕 날짜가 바뀔 때 — 한국 날짜가 바뀌어도(한국 자정) 아직 같은 키", async () => {
    vi.setSystemTime(new Date("2026-10-29T23:30:00+09:00")); // 뉴욕 10-29 10:30
    await mount("America/New_York");
    await flush();
    expect(getCandles).toHaveBeenCalledTimes(1);
    vi.setSystemTime(new Date("2026-10-30T00:30:00+09:00")); // 한국은 10-30, 뉴욕은 아직 10-29
    await act(async () => {
      vi.advanceTimersByTime(60_000);
    });
    await flush();
    expect(getCandles).toHaveBeenCalledTimes(1);
  });
});
