// 자산 편집이 **보내는 것**을 고정한다 (QA #106 · #110 · D1).
//
// 규칙은 하나다 — 이 다이얼로그가 **가진 칸만** 싣는다.
// PUT 은 세 갈래이므로(`Patch`: 키 없음=유지 · null=지움 · 값=교체, QA #96)
// 칸이 있으면 지금 상태를 그대로(비었으면 `null`) 싣고, 칸이 없으면 키를 뺀다.
//
// - 통화: 이제 세 묶음 모두 **칸이 있다**(D1) → 싣는다. 종전엔 칸도 없이 `"KRW"` 를
//   실어 보내 외화 자산이 편집 한 번에 원화가 됐고 서버가 환산율까지 1 로 정규화해
//   총자산이 환산 없이 합쳐졌다(QA #106) — 그래서 키를 뺐었다. 칸이 생겼으므로 다시
//   싣되, **읽어 온 값으로 열어야** 그대로 저장했을 때 값이 안 바뀐다. 그 두 가지를
//   여기서 함께 잠근다(앱 desk-app #330 과 같은 판단).
// - 환율: 원화로 되돌리면 **명시적 `null`** 이다. 키를 빼면 서버가 옛 환율을 지켜
//   원화 잔액이 1380 배가 된다.
// - 메모: 계좌·투자엔 칸이 **있다** → 비우면 `null` 을 싣는다(안 그러면 안 지워졌다).
//   카드엔 칸이 **없다**(입력이 `editingGroup !== "card"` 안에 있다) — 그래도 상태가
//   서버 값에서 출발하므로 그대로 되돌려 보낸다. 지어낸 값이 아니다.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { __resetPointerBlockForTest } from "@/shared/lib/porest/pointer-block";
import type { Asset } from "@/entities/asset";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

// 라벨 키를 그대로 흘려보낸다 — 여기서 보는 건 페이로드뿐이다.
vi.mock("react-i18next", () => ({
  // `i18n` 까지 흉내 낸다 — 다이얼로그가 금액을 통화 표기로 쓸 때 `i18n.language` 를
  // 본다. 빼 두면 그 경로가 닿는 순간 테스트가 아니라 목이 터진다.
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: "ko" } }),
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

const { AssetEditDialog } = await import("./AssetEditDialog");

const baseAsset = {
  userRowId: 1,
  cashBalance: 0,
  holdingBalance: 0,
  color: null,
  sortOrder: 0,
  isIncludedInTotal: "Y",
  cardCatalog: null,
  createAt: "2026-01-01T00:00:00",
  modifyAt: "2026-01-01T00:00:00",
} as const;

/** 웹에서 USD 로 만든 해외 증권계좌 — 이 화면엔 통화 칸이 없다. */
const usdInvest: Asset = {
  ...baseAsset,
  rowId: 12,
  assetName: "IBKR",
  assetType: "INVESTMENT",
  balance: 5_000,
  currency: "USD",
  exchangeRate: 1_380,
  institution: "키움증권",
  memo: "해외 배당 계좌",
};

/** USD 로 만든 해외 입출금 계좌. */
const usdAccount: Asset = {
  ...baseAsset,
  rowId: 8,
  assetName: "Chase Checking",
  assetType: "BANK_ACCOUNT",
  balance: 3_000,
  currency: "USD",
  exchangeRate: 1_380,
  institution: "신한",
  memo: "출장비 계좌",
};

/** 원화 입출금 계좌 — 환율 칸이 안 뜨는 쪽. */
const krwAccount: Asset = {
  ...baseAsset,
  rowId: 9,
  assetName: "신한 주거래",
  assetType: "BANK_ACCOUNT",
  balance: 1_200_000,
  currency: "KRW",
  // 서버는 원화 자산에도 환산율 1 을 준다(`Asset.normalizeRate`).
  exchangeRate: 1,
  institution: "신한",
  memo: null,
};

/** USD 로 만든 해외 신용카드 — 카드 묶음엔 메모 칸도 없다. */
const usdCard: Asset = {
  ...baseAsset,
  rowId: 7,
  assetName: "Chase Sapphire",
  assetType: "CREDIT_CARD",
  balance: -1_200,
  currency: "USD",
  exchangeRate: 1_380,
  institution: "신한카드",
  memo: "계좌 화면에서 적어 둔 메모",
  creditLimit: 5_000_000,
  paymentDay: 14,
};

// 한 케이스에서 다이얼로그를 두 번 띄우는 일이 있어(생성 두 묶음) 마운트를 매번 새로 판다 —
// 같은 root 에 다시 render 하면 앞 다이얼로그의 상태·포털이 남는다.
const mounted: { container: HTMLDivElement; root: Root }[] = [];

function unmountAll() {
  for (const m of mounted.splice(0)) {
    act(() => m.root.unmount());
    m.container.remove();
  }
}

function mount() {
  // 앞 다이얼로그는 먼저 걷는다 — 모달이 겹쳐 있으면 뒤 것을 못 찾는다.
  unmountAll();
  // 모달이 닫히면 그 뒤 POINTER_BLOCK_MS 동안 클릭이 삼켜진다(오클릭 방어) — 푼다.
  __resetPointerBlockForTest();
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  mounted.push({ container, root });
  return root;
}

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(unmountAll);

type Payload = Record<string, unknown>;

/** 다이얼로그를 띄우고 저장을 눌러, 그때 나간 본문을 돌려준다. */
function submit(
  item: Asset | null,
  group: "account" | "card" | "invest",
  before?: () => void,
): { create: Payload | null; update: Payload | null } {
  let create: Payload | null = null;
  let update: Payload | null = null;
  const root = mount();
  act(() =>
    root.render(
      <AssetEditDialog
        item={item}
        group={group}
        mobile={false}
        onClose={() => {}}
        onCreate={(v) => {
          create = v as unknown as Payload;
        }}
        onUpdate={(v) => {
          update = v as unknown as Payload;
        }}
      />,
    ),
  );
  before?.();
  // 저장 라벨은 신규/수정이 다르다(추가 · 저장) — 둘 다 받는다.
  const save = [...document.body.querySelectorAll("button")].find((b) =>
    ["save", "addAction"].includes(b.textContent?.trim() ?? ""),
  );
  if (!save) {
    const seen = [...document.body.querySelectorAll("button")]
      .map((b) => b.textContent?.trim())
      .join(" · ");
    throw new Error(`저장 버튼을 찾지 못했다 — 보인 버튼: ${seen}`);
  }
  act(() => save.dispatchEvent(new MouseEvent("click", { bubbles: true })));
  return { create, update };
}

/** 리액트가 관리하는 input 에 값을 넣는다(setter 를 우회하면 상태가 안 바뀐다). */
function setInput(el: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value",
  )?.set;
  act(() => {
    setter?.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

const memoInput = () =>
  document.body.querySelector<HTMLInputElement>("#asset-edit-memo");

/** 화면에 그려진 통화 select 가 보여 주는 값(`$ USD` 꼴). */
const currencyTriggerText = () =>
  document.body.querySelector("#asset-edit-currency")?.textContent?.trim() ??
  null;

const fxInput = () =>
  document.body.querySelector<HTMLInputElement>("#asset-edit-fx-rate");

describe("통화 — 칸이 생겼으니 싣는다, 대신 읽어 온 값으로 연다 (D1)", () => {
  it("투자 수정: 지금 통화·환율이 그대로 나간다", () => {
    const { update } = submit(usdInvest, "invest");
    expect(update).not.toBeNull();
    expect(update!.currency).toBe("USD");
    expect(update!.exchangeRate).toBe(1_380);
    // 반대편: 이 화면이 가진 다른 칸도 그대로 나간다.
    expect(update!.assetName).toBe("IBKR");
  });

  it("계좌 수정: 지금 통화·환율이 그대로 나간다", () => {
    const { update } = submit(usdAccount, "account");
    expect(update!.currency).toBe("USD");
    expect(update!.exchangeRate).toBe(1_380);
  });

  it("카드 수정: 지금 통화·환율이 그대로 나간다", () => {
    const { update } = submit(usdCard, "card");
    expect(update!.currency).toBe("USD");
    expect(update!.exchangeRate).toBe(1_380);
  });

  it("세 묶음 다 서버 값으로 열린다 — 안 채우면 저장만으로 원화가 된다", () => {
    for (const [item, group] of [
      [usdInvest, "invest"],
      [usdAccount, "account"],
      [usdCard, "card"],
    ] as const) {
      submit(item, group, () => {
        expect(currencyTriggerText()).toBe("$ USD");
        expect(fxInput()?.value).toBe("1380");
      });
    }
  });

  it("원화 자산은 환율 칸이 아예 안 보인다", () => {
    submit(krwAccount, "account", () => {
      expect(currencyTriggerText()).toBe("₩ KRW");
      expect(fxInput()).toBeNull();
    });
  });

  it("환율을 고치면 고친 값이 나간다", () => {
    const { update } = submit(usdAccount, "account", () => {
      setInput(fxInput()!, "1425.5");
    });
    expect(update!.exchangeRate).toBe(1_425.5);
  });

  it("환율에 쉼표를 찍어도 읽는다 — 금액 칸을 보고 온 손이 그렇게 친다", () => {
    // `Number("1,425")` 는 NaN 이다. 조용히 null 로 빠지면 서버가 환산율 1 로 잡아
    // 외화 잔액이 원화로 그대로 더해진다 — 화면엔 아무 표시도 안 난다.
    const { update } = submit(usdAccount, "account", () => {
      setInput(fxInput()!, "1,425");
    });
    expect(update!.exchangeRate).toBe(1_425);
  });

  it("원화 자산 수정에도 통화가 실린다 — 서버가 지금 값을 그대로 받는다", () => {
    const { update } = submit(krwAccount, "account");
    expect(update!.currency).toBe("KRW");
    expect(update!.exchangeRate).toBeNull();
  });

  it("생성도 싣는다 — 고른 칸이 있으니 지어낸 값이 아니다", () => {
    const nameIt = () =>
      setInput(
        document.body.querySelector<HTMLInputElement>("#asset-edit-name")!,
        "새 자산",
      );
    const invest = submit(null, "invest", nameIt);
    expect(invest.create).not.toBeNull();
    expect(invest.create!.currency).toBe("KRW");
    const account = submit(null, "account", nameIt);
    expect(account.create).not.toBeNull();
    expect(account.create!.currency).toBe("KRW");
  });
});

describe("메모 — 칸이 있으면 비운 상태로, 없으면 키째 (QA #110)", () => {
  it("투자: 메모를 비우면 null 이 나간다", () => {
    const { update } = submit(usdInvest, "invest", () => {
      const el = memoInput();
      expect(el?.value).toBe("해외 배당 계좌");
      setInput(el!, "");
    });
    expect(update!.memo).toBeNull();
  });

  it("계좌: 메모를 비우면 null 이 나간다", () => {
    const { update } = submit(usdAccount, "account", () => {
      setInput(memoInput()!, "");
    });
    expect(update!.memo).toBeNull();
  });

  it("계좌: 적어 둔 메모는 그대로 나간다", () => {
    const { update } = submit(usdAccount, "account", () => {
      setInput(memoInput()!, "출장비 계좌 2");
    });
    expect(update!.memo).toBe("출장비 계좌 2");
  });

  it("카드: 메모 칸은 없지만, 남이 적어 둔 값은 그대로 되돌아 나간다", () => {
    // 이 묶음엔 메모 입력이 없다(입력은 `editingGroup !== "card"` 안에 있다).
    // 그래도 키를 싣는다 — 상태가 서버 값에서 출발하므로 되돌려 보내면 아무것도
    // 안 바뀌고, 이 칸을 무조건 대입하는 옛 서버에서도 값이 안 지워진다.
    const { update } = submit(usdCard, "card");
    expect(memoInput()).toBeNull();
    expect(update!.memo).toBe("계좌 화면에서 적어 둔 메모");
  });
});
