// 카드 상세 회차 선택기의 **닫힌 회차**(닫힌 회차 규칙 R2·R4).
//
// 과거 회차는 서버의 `closedCycles` 로 그린다. 종전엔 결제 기록(history)만 보고 그려서
// 뒤늦게 적은 거래가 떨어진 회차는 머리 금액에 안 들어가거나(목록과 금액이 어긋남) 결제
// 기록이 없으면 아예 고를 수 없었다. 머리 금액 = 결제한 금액 + 기록만 남긴 금액이고,
// 기록만 남긴 몫과 등록 전 회차는 한 줄씩 따로 말한다.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Asset } from "@/entities/asset";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: "ko" } }),
  // 금액을 가리는 문장은 Trans 로 그린다 — 키만 남겨 무엇을 골랐는지 본다.
  Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
  initReactI18next: { type: "3rdParty", init: () => {} },
}));
vi.mock("react-router-dom", () => ({ useNavigate: () => () => {} }));
vi.mock("sonner", () => ({ toast: { success: () => {}, error: () => {} } }));

// 화면 카드 가리기는 **꺼 둔다** — 자산 플래그만으로 가려지는지를 본다.
vi.mock("@/shared/lib/porest/hide-amounts-core", async (orig) => ({
  ...(await orig<Record<string, unknown>>()),
  useHideAmounts: () => false,
}));

// 차트·거래창·확인창은 이 주장과 무관하다 — 껍데기로 바꿔 recharts 까지 들어오지 않게 한다.
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
const billing = vi.hoisted(() => ({ data: undefined as unknown }));
vi.mock("@/features/asset", () => ({
  useAssets: () => ({ data: { assets: [] }, isLoading: false }),
  useAssetBalanceTrend: () => empty,
  useAssetTrades: () => empty,
  useAssetTransfers: () => empty,
  useCardBilling: () => ({ ...empty, data: billing.data }),
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
  rowId: 9,
  assetName: "현대카드",
  assetType: "CREDIT_CARD",
  balance: 0,
  cashBalance: 0,
  holdingBalance: 0,
  currency: "KRW",
  exchangeRate: 1,
  institution: "현대",
  memo: null,
  color: null,
  sortOrder: 0,
  isIncludedInTotal: "Y",
  isAmountHidden: "N",
  cardCatalog: null,
  paymentDay: 12,
  paymentAssetRowId: 1,
  creditLimit: 5_000_000,
  createAt: "2026-09-01T00:00:00",
  modifyAt: "2026-09-01T00:00:00",
} as Asset;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  billing.data = {
    cardAssetRowId: 9,
    upcomingAmount: 30_000,
    upcomingLumpSumAmount: 30_000,
    upcomingAlreadyPaidAmount: 0,
    upcomingInstallments: [],
    upcomingPeriodStart: "2026-09-01",
    upcomingPeriodEnd: "2026-09-30",
    nextPaymentDate: "2026-10-12",
    paymentDay: 12,
    paymentAssetRowId: 1,
    history: [],
    nextCycle: null,
    closedCycles: [
      {
        periodStart: "2026-08-01",
        periodEnd: "2026-08-31",
        paymentDate: "2026-09-12",
        paidAmount: 100_000,
        recordedOnlyAmount: 25_000,
        preRegistration: false,
        refundableUntil: "2026-09-30",
      },
      {
        periodStart: "2026-07-01",
        periodEnd: "2026-07-31",
        paymentDate: "2026-08-12",
        paidAmount: 0,
        recordedOnlyAmount: 40_000,
        preRegistration: true,
        refundableUntil: "2026-08-31",
      },
    ],
  };
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() =>
    root.render(
      <AssetDetailDialog asset={card} onClose={() => {}} mobile={false} />,
    ),
  );
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const buttonWith = (text: string) =>
  [...document.body.querySelectorAll("button")].find((b) =>
    (b.textContent ?? "").includes(text),
  );
const click = (el: Element) =>
  act(() => el.dispatchEvent(new MouseEvent("click", { bubbles: true })));

/** 회차 선택 시트를 열어 그 금액의 회차를 고른다. */
function pick(amountText: string) {
  click(buttonWith("assetDetail.scheduledTag")!);
  const row = [...document.body.querySelectorAll("button")].find(
    (b) =>
      (b.textContent ?? "").includes(amountText) &&
      !(b.textContent ?? "").includes("assetDetail.scheduledTag"),
  );
  if (!row) throw new Error(`회차를 찾지 못했다: ${amountText}`);
  click(row);
}

const byTestId = (id: string) =>
  document.body.querySelector(`[data-testid='${id}']`);

describe("닫힌 회차", () => {
  it("머리 금액은 결제한 금액 + 기록만 남긴 금액이고, 기록만 몫을 따로 말한다", () => {
    pick("125,000");

    expect(document.body.textContent).toContain("125,000");
    expect(byTestId("recorded-only-note")?.textContent).toBe(
      "assetDetail.recordedOnlyNote",
    );
    expect(byTestId("pre-registration-note")).toBeNull();
  });

  it("결제 기록이 없는 회차도 고를 수 있고, 등록 전 회차면 주의를 단다(R4)", () => {
    pick("40,000");

    expect(byTestId("recorded-only-note")).not.toBeNull();
    expect(byTestId("pre-registration-note")?.textContent).toBe(
      "assetDetail.preRegistrationNote",
    );
  });

  it("다가오는 회차에는 기록만 줄이 없다", () => {
    expect(byTestId("recorded-only-note")).toBeNull();
    expect(byTestId("pre-registration-note")).toBeNull();
  });
});
