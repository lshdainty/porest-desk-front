// 자산 화면의 금액 축약은 **공용 `formatChartAxis` 하나만** 통과해야 한다.
//
// 도넛 중앙과 저축목표 목표액은 축약을 직접 계산하고 있었다 —
// `${(v / 10_000_000).toFixed(2)}천만` · `${(v / 10_000).toFixed(0)}만`.
// 그래서 QA 가 `formatChartAxis` 쪽에서 닫은 항목이 이 화면에선 그대로 살아 있었다:
// 쓰지 않기로 한 `천만`(QA #73), 11,881 을 `1만` 으로 깎는 −16%(QA #38),
// 4,900 이 `0만` 으로 사라지는 것, 음수의 ASCII 하이픈(QA #22).
//
// 값 자체의 표(51,750,000 → `5,175만` …)는 `shared/lib/porest/format.test.ts` 가 들고 있다.
// 여기서 고정하는 건 **화면이 그 함수를 실제로 통과하느냐** 다 — 인라인 계산이
// 다시 들어오면 이 파일이 깨진다.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { i18n } from "@/shared/i18n/config";
import { MINUS } from "@/shared/lib/porest/format";
import type { Asset } from "@/entities/asset";
import type { SavingGoal } from "@/entities/savingGoal";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

// 라벨 키는 그대로 흘려보낸다 — 여기서 보는 건 금액 문자열뿐이다.
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
  initReactI18next: { type: "3rdParty", init: () => {} },
}));
// 동적 아이콘만 세운다 — 비동기 로드라 act 경고를 남기고, 금액과는 무관하다.
// 도넛은 진짜를 그린다: 중앙 라벨이 children 으로 들어가므로 흉내내면 자리가 어긋난다.
vi.mock("lucide-react/dynamic", async (importOriginal) => ({
  ...(await importOriginal<typeof import("lucide-react/dynamic")>()),
  DynamicIcon: () => <span />,
}));

const { AssetCompositionCard, SavingGoalItem } = await import("./AssetPage");

let container: HTMLDivElement;
let root: Root;
const origLang = i18n.language;

beforeAll(async () => {
  await i18n.changeLanguage("ko");
});
afterAll(async () => {
  await i18n.changeLanguage(origLang);
});

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

// 조각이 하나도 없으면 카드가 도넛 대신 빈 안내를 그린다 — 중앙 라벨을 보려면 한 건은 있어야 한다.
const account: Asset = {
  rowId: 1,
  userRowId: 1,
  assetName: "주거래",
  assetType: "BANK_ACCOUNT",
  balance: 1_000_000,
  cashBalance: 1_000_000,
  holdingBalance: 0,
  currency: "KRW",
  exchangeRate: 1,
  color: null,
  institution: null,
  memo: null,
  sortOrder: 0,
  isIncludedInTotal: "Y",
  cardCatalog: null,
  createAt: "2026-01-01T00:00:00",
  modifyAt: "2026-01-01T00:00:00",
};

/** 도넛 중앙은 조각 합계가 아니라 넘겨받은 순자산을 그린다. */
function renderComposition(netWorth: number): string {
  act(() =>
    root.render(
      <AssetCompositionCard
        accounts={[account]}
        investments={[]}
        cards={[]}
        loans={[]}
        netWorth={netWorth}
      />,
    ),
  );
  return container.textContent ?? "";
}

const goalOf = (targetAmount: number): SavingGoal => ({
  rowId: 1,
  userRowId: 1,
  title: "여행",
  description: null,
  targetAmount,
  currentAmount: 0,
  currency: "KRW",
  deadlineDate: null,
  icon: null,
  color: null,
  linkedAssetRowId: null,
  sortOrder: 0,
  isAchieved: "N",
  achievedAt: null,
  createAt: "2026-01-01T00:00:00",
  modifyAt: "2026-01-01T00:00:00",
});

function renderGoal(targetAmount: number): string {
  act(() => root.render(<SavingGoalItem goal={goalOf(targetAmount)} />));
  return container.textContent ?? "";
}

describe("자산 구성 도넛 중앙", () => {
  it("`천만` 을 만들지 않는다 — 쓰지 않기로 한 단위다(QA #73)", () => {
    const out = renderComposition(51_750_000);
    expect(out).toContain("5,175만");
    expect(out).not.toContain("천만");
  });

  it("`.00` 이 남지 않는다 — 1.2억이 `12.00천만` 이었다", () => {
    const out = renderComposition(120_000_000);
    expect(out).toContain("1.2억");
    expect(out).not.toMatch(/\.00/);
  });

  it("11,881 을 `1만` 으로 깎지 않는다 — 16% 가 조용히 사라졌다(QA #38)", () => {
    expect(renderComposition(11_881)).toContain("1.2만");
  });

  it("1만 미만이 통째로 사라지지 않는다 — 4,900 이 `0만` 이었다", () => {
    const out = renderComposition(4_900);
    expect(out).toContain("4,900");
    expect(out).not.toContain("0만");
  });

  it("음수 부호는 U+2212 — ASCII 하이픈이 아니다(QA #22)", () => {
    const out = renderComposition(-11_881);
    expect(out).toContain(`${MINUS}1.2만`);
    expect(out).not.toContain("-1");
  });
});

describe("저축목표 목표액", () => {
  it("11,881 을 `1만` 으로 깎지 않는다", () => {
    expect(renderGoal(11_881)).toContain("1.2만");
  });

  it("1만 미만이 사라지지 않는다 — 4,900 이 `0만` 이었다", () => {
    const out = renderGoal(4_900);
    expect(out).toContain("4,900");
    expect(out).not.toContain("0만");
  });

  it("억은 억으로 올린다 — 1억이 `10000만` 이었다", () => {
    const out = renderGoal(100_000_000);
    expect(out).toContain("1억");
    expect(out).not.toContain("10000만");
  });

  it("자주 쓰는 값은 그대로다 — 500만·30만은 안 바뀐다", () => {
    expect(renderGoal(5_000_000)).toContain("500만");
    expect(renderGoal(300_000)).toContain("30만");
  });
});
