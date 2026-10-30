// 토스 폰 화면 — 띠 차례 · 금액 줄바꿈 · 부호 · 지수 이름 · 칩 글 · 출처 줄 · 실패/비었음 갈래 (I-13 P 절 5 ~ 12)
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

const st = vi.hoisted(() => ({
  holdings: "ok" as "ok" | "error" | "empty",
  accounts: "ok" as "ok" | "empty",
}));

const amt = (n: number) => ({ krw: String(n), usd: null });
const item = (symbol: string, name: string, cur: string, v: number) => ({
  symbol,
  name,
  marketCountry: cur === "USD" ? "US" : "KR",
  currency: cur,
  quantity: "10",
  lastPrice: "1",
  averagePurchasePrice: "1",
  marketValue: {
    purchaseAmount: "1",
    amount: String(v),
    amountAfterCost: String(v),
  },
  profitLoss: {
    amount: "5",
    amountAfterCost: "5",
    rate: "12.34",
    rateAfterCost: "12",
  },
  dailyProfitLoss: { amount: "-3", rate: "-0.5" },
  cost: { commission: "0", tax: null },
});

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (k: string, o?: Record<string, unknown>) => {
      const names: Record<string, string> = {
        "market.KOSPI": "코스피",
        "market.KOSDAQ": "코스닥",
      };
      if (k in names) return names[k];
      if (k.startsWith("market.") && o && "defaultValue" in o)
        return String(o.defaultValue);
      return k;
    },
  }),
  initReactI18next: { type: "3rdParty", init: () => {} },
}));
vi.mock("@/features/stock/model/useTossStocks", () => {
  const q = (data: unknown, extra = {}) => ({
    data,
    isLoading: false,
    isError: false,
    isSuccess: true,
    refetch: () => {},
    ...extra,
  });
  return {
    useTossAccounts: () =>
      q(
        st.accounts === "empty"
          ? []
          : [{ accountSeq: 1, accountNo: "1", accountType: "G" }],
      ),
    // 계좌가 없으면(accountSeq null) 진짜 훅은 꺼져 있어 데이터가 없다
    useTossHoldings: (seq: number | null) =>
      seq == null
        ? q(undefined, { isSuccess: false })
        : st.holdings === "error"
          ? q(undefined, { isError: true, isSuccess: false })
          : q({
              totalPurchaseAmount: amt(1500000000),
              marketValue: {
                amount: amt(1834567890),
                amountAfterCost: amt(1834567890),
              },
              profitLoss: {
                amount: amt(334567890),
                amountAfterCost: amt(0),
                rate: "22.30",
                rateAfterCost: "0",
              },
              dailyProfitLoss: { amount: amt(-12345678), rate: "-0.67" },
              items:
                st.holdings === "empty"
                  ? []
                  : [
                      item("U1", "미국종목", "USD", 6185.55),
                      item("K1", "한국종목", "KRW", 8760000),
                    ],
            }),
    useTossExchangeRate: () => q({ rate: "1385.20" }),
    useTossIndicatorPrices: () =>
      q([
        { symbol: "KOSPI", timestamp: null, lastPrice: "2651.12" },
        { symbol: "KR3Y", timestamp: null, lastPrice: "3.1" },
      ]),
    useTossIndicatorCandles: () => new Map<string, number[]>(),
    useTossMarketCalendarKr: () => q(undefined),
    useTossMarketCalendarUs: () => q(undefined),
    useTossRankings: () => q({ rankings: [] }),
    useTossStockInfo: () => q([]),
  };
});
vi.mock("@/features/stock/api/watchlistApi", () => ({
  useWatchGroups: () => ({
    data: [],
    isLoading: false,
    isError: false,
    refetch: () => {},
  }),
  useCreateWatchGroup: () => ({ isPending: false, mutate: () => {} }),
  useRenameWatchGroup: () => ({ isPending: false, mutate: () => {} }),
  useDeleteWatchGroup: () => ({ isPending: false, mutateAsync: () => {} }),
}));
vi.mock("@/features/stock/model/useWatchQuotes", () => ({
  useTossWatchQuotes: () => ({
    isLoading: false,
    isError: false,
    priceOf: () => ({ price: null, changePct: null }),
  }),
  useNamuWatchQuotes: () => ({
    isLoading: false,
    isError: false,
    priceOf: () => ({ price: null, changePct: null }),
  }),
}));
vi.mock("@/features/stock/ui/phone/stock-search", () => ({
  StockSearchEntry: () => <button data-slot="stock-search-entry" />,
}));

const { TossStocksMobile } = await import("./TossStocksMobile");
let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  window.matchMedia ??= ((q: string) => ({
    matches: false,
    media: q,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
  st.holdings = "ok";
  st.accounts = "ok";
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});
const render = () =>
  act(() =>
    root.render(
      <MemoryRouter initialEntries={["/desk/stocks/toss"]}>
        <TossStocksMobile />
      </MemoryRouter>,
    ),
  );

describe("토스 폰 화면", () => {
  it("띠 차례는 내 투자 → 시장 → 종목", () => {
    render();
    const secs = [...container.querySelectorAll("[data-band]")].map((e) =>
      e.getAttribute("data-section"),
    );
    expect(secs).toEqual(["invest", "market", "stocks"]);
  });
  it("머리는 TopNavigation(← + 증권)", () => {
    render();
    expect(
      container.querySelector("header[data-slot=top-navigation]"),
    ).not.toBeNull();
    expect(container.querySelector("h1")!.textContent).toBe("nav.title");
  });
  it("지표 금액은 쉼표 뒤에서만 줄바꿈하고(wbr), 증감에 +/− 부호가 없다", () => {
    render();
    const v = container.querySelector("[data-slot=card-stat-value]")!;
    expect(v.querySelectorAll("wbr").length).toBeGreaterThan(0);
    const delta = container.querySelector("[data-slot=delta-value]")!;
    expect(delta.textContent).toMatch(/^▲/);
    expect(delta.textContent).not.toMatch(/[+−-]/);
  });
  it("모르는 지수 심볼(KR3Y)은 코스닥으로 접히지 않고 그리지 않는다", () => {
    render();
    const m = container.querySelector("[data-section=market]")!.textContent!;
    expect(m).toContain("코스피");
    expect(m).not.toContain("코스닥");
    expect(m).not.toContain("3.1");
  });
  it("칩 글에 숫자가 없고 출처 줄이 있다", () => {
    render();
    const chips = [...container.querySelectorAll("[role=tab]")].map(
      (e) => e.textContent,
    );
    expect(chips).toEqual([
      "segments.holdings",
      "segments.watch",
      "segments.discover",
    ]);
    expect(chips.join("")).not.toMatch(/\d/);
    expect(container.textContent).toContain("market.dataNotice");
  });
  it("미국 보유는 달러 표기(원 없음)", () => {
    render();
    const rows = container.querySelector("[data-section=stocks]")!.textContent!;
    expect(rows).toContain("$6,185.55");
    expect(rows).toContain("한국종목");
  });
  it("보유 질의 실패는 '불러오지 못했어요' 한 벌이고 연결 안내가 아니다", () => {
    st.holdings = "error";
    render();
    expect(container.textContent).toContain("invest.failTitle");
    expect(container.textContent).toContain("holdings.failTitle");
    expect(container.textContent).not.toContain("connect.");
  });
  it("계좌 목록이 빈 목록이면 빈 상태(지표 0 · '보유 중인 종목이 없어요')", () => {
    st.accounts = "empty";
    render();
    expect(container.textContent).not.toContain("invest.failTitle");
    expect(container.textContent).toContain("holdings.empty");
  });
});
