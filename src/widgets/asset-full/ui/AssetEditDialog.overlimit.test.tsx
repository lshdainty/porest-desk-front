// 한도 초과는 **막지 않고 보인다** (QA #125 · D6).
//
// 사용자 결정은 "허용" 이다 — 마이너스통장·신용카드 사용액이 약정 한도를 넘어도
// 저장된다. 한도는 카드사·은행이 정하는 값이고 우리가 아는 건 사용자가 적어 둔
// 숫자라, 막아 버리면 실제로 한도를 올린 사람이 사용액을 못 고친다.
//
// 그래서 이 테스트가 잠그는 건 두 가지다:
// ① 넘겼을 때 화면에 **배지·문구가 뜬다**  ② 그래도 **저장이 나간다**.
// ②를 빼면 "경고를 붙였으니 막자" 는 쪽으로 조용히 되돌아간다 — 서버 검사도
// 넣지 않기로 한 결정이라 여기 말고는 그걸 지키는 자리가 없다.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { __resetPointerBlockForTest } from "@/shared/lib/porest/pointer-block";
import type { Asset } from "@/entities/asset";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

// 라벨 키를 그대로 흘려보내되, 보간값은 붙여 준다 — 초과 **금액**까지 봐야
// "배지만 뜨고 얼마인지는 안 알려 준다" 를 잡을 수 있다.
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (k: string, opts?: Record<string, unknown>) =>
      opts ? `${k}|${Object.values(opts).join("|")}` : k,
    i18n: { language: "ko" },
  }),
  initReactI18next: { type: "3rdParty", init: () => {} },
}));
vi.mock("@/features/asset", () => ({
  useAssets: () => ({ data: { assets: [] }, isLoading: false }),
}));
vi.mock("@/features/card-catalog", () => ({
  useCardCatalogs: () => ({ data: undefined, isFetching: false }),
}));
vi.mock("@/features/stock/model/useStockMaster", () => ({
  useStockSearch: () => ({ data: [], isFetching: false }),
  useStockSymbolName: () => ({ data: undefined }),
}));
vi.mock("@/features/stock/model/useLivePrices", () => ({
  useLivePrices: () => ({
    quoteOf: () => undefined,
    unitKrw: () => null,
    prevUnitKrw: () => null,
    currencyOf: () => undefined,
  }),
}));
vi.mock("@/features/subscription/model/useSubscription", () => ({
  useMyFeatures: () => ({ data: undefined }),
}));
// 설정의 기본 통화 — 실제 훅은 react-query 를 타므로 값만 흘려보낸다(D7).
vi.mock("@/features/user", () => ({
  useDefaultCurrency: () => "KRW",
}));

const { AssetEditDialog } = await import("./AssetEditDialog");

const baseAsset = {
  userRowId: 1,
  cashBalance: 0,
  holdingBalance: 0,
  color: null,
  sortOrder: 0,
  isIncludedInTotal: "Y",
  cardCatalog: null,
  currency: "KRW",
  exchangeRate: 1,
  memo: null,
  createAt: "2026-01-01T00:00:00",
  modifyAt: "2026-01-01T00:00:00",
} as const;

/** 한도 300만, 미결제 사용액 500만 — 200만 초과. */
const overCard: Asset = {
  ...baseAsset,
  rowId: 21,
  assetName: "신한 Deep Dream",
  assetType: "CREDIT_CARD",
  balance: -5_000_000,
  institution: "신한카드",
  creditLimit: 3_000_000,
  paymentDay: 14,
};

/** 한도 300만, 사용액 100만 — 안 넘겼다. */
const underCard: Asset = { ...overCard, rowId: 22, balance: -1_000_000 };

/** 한도를 안 적어 둔 카드 — 견줄 값이 없다. */
const noLimitCard: Asset = { ...overCard, rowId: 23, creditLimit: null };

/**
 * 약정 한도 100만, 쓴 돈 250만 — 150만 초과.
 *
 * 마이너스통장은 별도 타입이 아니라 **잔액이 음수인 `BANK_ACCOUNT`** 다(QA #17) —
 * 그래서 편집을 열면 '마이너스통장' 탭으로 잡힌다(`assetTypeToSub`).
 */
const overOverdraft: Asset = {
  ...baseAsset,
  rowId: 24,
  assetName: "신한 마통",
  assetType: "BANK_ACCOUNT",
  balance: -2_500_000,
  institution: "신한",
  creditLimit: 1_000_000,
};

const mounted: { container: HTMLDivElement; root: Root }[] = [];

function unmountAll() {
  for (const m of mounted.splice(0)) {
    act(() => m.root.unmount());
    m.container.remove();
  }
}

function open(item: Asset, group: "account" | "card" | "invest") {
  unmountAll();
  __resetPointerBlockForTest();
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  mounted.push({ container, root });
  let update: Record<string, unknown> | null = null;
  act(() =>
    root.render(
      <AssetEditDialog
        item={item}
        group={group}
        mobile={false}
        onClose={() => {}}
        onCreate={() => {}}
        onUpdate={(v) => {
          update = v as unknown as Record<string, unknown>;
        }}
      />,
    ),
  );
  return {
    save: () => {
      const btn = [...document.body.querySelectorAll("button")].find(
        (b) => b.textContent?.trim() === "save",
      );
      if (!btn) throw new Error("저장 버튼을 찾지 못했다");
      act(() => btn.dispatchEvent(new MouseEvent("click", { bubbles: true })));
      return { update: update as Record<string, unknown> | null, btn };
    },
  };
}

/** 초과 배지 — Badge 는 div 라 텍스트로 찾는다. */
const badge = () =>
  [...document.body.querySelectorAll("div")].find(
    (d) => d.textContent?.trim() === "editDialog.overLimitBadge",
  ) ?? null;

const overHelp = () =>
  [...document.body.querySelectorAll("p")].find((p) =>
    p.textContent?.startsWith("editDialog.overLimitHelp"),
  ) ?? null;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(unmountAll);

describe("한도 초과 — 보이되 막지 않는다 (QA #125)", () => {
  it("신용카드: 사용액이 한도를 넘으면 배지와 초과 금액이 뜬다", () => {
    open(overCard, "card");
    expect(badge()).not.toBeNull();
    // 초과분 200만원을 통화 표기로 알려 준다 — 배지만으로는 얼마인지 모른다.
    expect(overHelp()?.textContent).toBe("editDialog.overLimitHelp|₩2,000,000");
  });

  it("신용카드: 넘겨도 저장이 나간다 — 서버 검사도 없다", () => {
    const { save } = open(overCard, "card");
    const { update, btn } = save();
    expect(btn.hasAttribute("disabled")).toBe(false);
    expect(update).not.toBeNull();
    // 넘긴 값 그대로 나간다(카드 잔액은 미결제라 음수).
    expect(update!.balance).toBe(-5_000_000);
    expect(update!.creditLimit).toBe(3_000_000);
  });

  it("마이너스통장: 쓴 돈이 약정 한도를 넘으면 배지가 뜨고 저장도 된다", () => {
    const { save } = open(overOverdraft, "account");
    expect(badge()).not.toBeNull();
    expect(overHelp()?.textContent).toBe("editDialog.overLimitHelp|₩1,500,000");
    const { update } = save();
    expect(update!.balance).toBe(-2_500_000);
    expect(update!.creditLimit).toBe(1_000_000);
  });

  it("한도 안쪽이면 아무 말도 안 한다", () => {
    open(underCard, "card");
    expect(badge()).toBeNull();
    expect(overHelp()).toBeNull();
  });

  it("한도를 안 적어 뒀으면 견줄 값이 없어 조용하다", () => {
    open(noLimitCard, "card");
    expect(badge()).toBeNull();
    expect(overHelp()).toBeNull();
  });
});
