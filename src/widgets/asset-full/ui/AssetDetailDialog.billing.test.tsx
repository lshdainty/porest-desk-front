// 청구 예정액이 **한도 사용(=잔액)과 다른 이유**를 그 자리에서 밝힌다 (2026-09-18 제보).
//
// 사용자가 같은 카드에서 두 숫자가 다르다고 알렸다 — 자산 목록·한도 사용은 466,800,
// 카드 상세 청구 예정은 527,100. 둘은 서로 다른 양이다.
//
//   · 잔액은 `effective_at <= 지금` 인 이력만 센다 → **아직 안 온 거래를 안 센다**
//   · 청구 예정은 회차 기간 전체를 센다 → 반복 거래가 미리 만들어 둔 것까지 센다
//
// 서버가 그 차이(`upcomingScheduledAmount`)를 내려주므로 화면이 숫자 밑에서 말해 준다.
// 아무 말도 없으면 사용자는 어느 쪽이 맞는지 알 수 없다.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Asset, CardBilling } from "@/entities/asset";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

// 라벨 키를 그대로 흘려보낸다 — 여기서 보는 건 "말하는가 / 안 하는가" 다.
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (k: string, o?: Record<string, unknown>) =>
      o ? `${k}|${JSON.stringify(o)}` : k,
    i18n: { language: "ko" },
  }),
  Trans: ({ children }: { children?: React.ReactNode }) => children ?? null,
  initReactI18next: { type: "3rdParty", init: () => {} },
}));
vi.mock("react-router-dom", () => ({ useNavigate: () => () => {} }));
vi.mock("sonner", () => ({ toast: { success: () => {}, error: () => {} } }));
vi.mock("@/shared/lib/porest/hide-amounts-core", async (orig) => ({
  ...(await orig<Record<string, unknown>>()),
  useHideAmounts: () => false,
}));
vi.mock("recharts", () => ({
  Area: () => null,
  AreaChart: () => null,
  CartesianGrid: () => null,
  XAxis: () => null,
  YAxis: () => null,
}));
vi.mock("@/shared/ui/chart", () => ({
  ChartContainer: () => null,
  ChartTooltip: () => null,
}));
vi.mock("./AssetTradeDialog", () => ({ AssetTradeDialog: () => null }));
vi.mock("@/widgets/account-settings/ui/HideAmountsUnlockDialog", () => ({
  HideAmountsUnlockDialog: () => null,
}));

const empty = { data: undefined, isLoading: false, isFetching: false };
const state = vi.hoisted(() => ({ billing: undefined as unknown }));
vi.mock("@/features/asset", () => ({
  useAssets: () => ({ data: { assets: [] }, isLoading: false }),
  useAssetBalanceTrend: () => empty,
  useAssetTrades: () => empty,
  useAssetTransfers: () => empty,
  useCardBilling: () => ({ ...empty, data: state.billing }),
  useCardPerformance: () => empty,
  useInvestValuation: () => empty,
  useDeleteTrade: () => ({ mutate: () => {} }),
  useCancelCardPayment: () => ({ mutate: () => {} }),
  useInstallmentPayoff: () => ({ mutate: () => {} }),
  usePayCard: () => ({ mutate: () => {} }),
  useUpdateAsset: () => ({ mutate: () => {} }),
  holdingsOf: () => [],
}));
vi.mock("@/features/expense", () => ({ useSearchExpenses: () => empty }));
vi.mock("@/features/card-performance", () => ({
  useCardPerformance: () => empty,
}));
vi.mock("@/features/subscription/model/useSubscription", () => ({
  useMyFeatures: () => ({ data: undefined }),
}));
vi.mock("@/features/stock/model/useLivePrices", () => ({
  useLivePrices: () => ({
    quoteOf: () => undefined,
    unitKrw: () => null,
    prevUnitKrw: () => null,
    currencyOf: () => undefined,
  }),
}));
vi.mock("@/features/stock/model/useStockMaster", () => ({
  useStockSymbolName: () => ({ data: undefined }),
}));
vi.mock("@/entities/expense", () => ({
  ExpenseRow: () => null,
  isScheduledTx: () => false,
}));

const { AssetDetailDialog } = await import("./AssetDetailDialog");

const card: Asset = {
  userRowId: 1,
  rowId: 42,
  assetName: "네이버 현대카드",
  assetType: "CREDIT_CARD",
  balance: -466_800,
  cashBalance: 0,
  holdingBalance: 0,
  currency: "KRW",
  exchangeRate: 1,
  institution: "현대카드",
  memo: null,
  color: null,
  sortOrder: 0,
  isIncludedInTotal: "Y",
  isAmountHidden: "N",
  cardCatalog: null,
  creditLimit: 21_000_000,
  paymentDay: 12,
  createAt: "2026-01-01T00:00:00",
  modifyAt: "2026-01-01T00:00:00",
};

const billing = (scheduled?: number | null): CardBilling => ({
  cardAssetRowId: 42,
  upcomingAmount: 527_100,
  upcomingLumpSumAmount: 527_100,
  upcomingScheduledAmount: scheduled,
  upcomingPeriodStart: "2026-09-01",
  upcomingPeriodEnd: "2026-09-30",
  nextPaymentDate: "2026-10-12",
  paymentDay: 12,
  paymentAssetRowId: null,
  history: [],
});

let container: HTMLDivElement;
let root: Root;

function render(b: CardBilling) {
  state.billing = b;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() =>
    root.render(
      <AssetDetailDialog asset={card} onClose={() => {}} mobile={false} />,
    ),
  );
  return document.body.textContent ?? "";
}

const KEY = "assetDetail.billingScheduledPortion";

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  state.billing = undefined;
});

describe("카드 청구 — 예정분 안내", () => {
  it("예정분이 있으면 얼마가 아직 안 온 것인지 밝힌다", () => {
    const text = render(billing(60_300));
    expect(text).toContain(KEY);
    expect(text).toContain("60,300");
  });

  it("예정분이 0 이면 아무 말도 안 한다 — 잔액과 어긋날 이유가 없다", () => {
    const text = render(billing(0));
    expect(text).not.toContain(KEY);
    // 시트가 안 그려졌는데 통과하는 걸 막는다.
    expect(text).toContain("527,100");
  });

  // 옛 서버는 이 칸을 안 내려준다.
  it("칸이 없어도 아무 말 없이 지나간다", () => {
    const text = render(billing(undefined));
    expect(text).not.toContain(KEY);
    expect(text).toContain("527,100");
  });
});
