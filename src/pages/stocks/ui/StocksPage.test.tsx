// 증권사 선택이 페이지 안 state 에서 **경로**로 옮겼다(사이드바 하위 메뉴가 가리키는 자리).
// 이제 URL 하나가 화면을 정하므로, 어떤 경로가 어떤 화면을 그리고 어디로 튕기는지를 고정한다.
// 특히 `/desk/stocks` 는 기존 북마크·모바일 전체 메뉴가 가리키는 자리라 살아 있어야 한다.
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  MemoryRouter,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

const state = vi.hoisted(() => ({
  connectedBrokers: [] as string[],
  primaryBroker: null as string | null,
  isLoading: false,
}));

vi.mock("@/features/subscription/model/useSubscription", () => ({
  useMyFeatures: () => ({
    data: {
      features: ["SECURITIES"],
      connectedBrokers: state.connectedBrokers,
      primaryBroker: state.primaryBroker,
      tossConnected: state.connectedBrokers.includes("TOSS"),
    },
    isLoading: state.isLoading,
  }),
  // 표시명 조회는 여기 관심사가 아니다 — 라벨은 번역 키 폴백으로 떨어진다.
  useBrokerConnections: () => ({ data: undefined }),
}));
// initReactI18next 도 같이 준다 — shared/lib 배럴이 i18n 부트스트랩을 끌고 온다.
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
  initReactI18next: { type: "3rdParty", init: () => {} },
}));
// 본문 두 개는 각자 수십 개의 쿼리를 건다 — 여기선 "어느 쪽이 떴나" 만 보면 된다.
vi.mock("./TossStocksPage", () => ({
  TossStocksPage: ({ header }: { header?: ReactNode }) => (
    <div data-broker="TOSS">{header}</div>
  ),
}));
vi.mock("./NamuStocksPage", () => ({
  NamuStocksPage: ({ header }: { header?: ReactNode }) => (
    <div data-broker="NAMU">{header}</div>
  ),
}));
vi.mock("./detail/StockDetailView", () => ({
  StockDetailView: ({
    broker,
    symbol,
    layout,
  }: {
    broker: string;
    symbol: string;
    layout: string;
  }) => <div data-detail={`${broker}:${symbol}`} data-layout={layout} />,
}));
vi.mock("./detail/PortfolioMobile", () => ({
  PortfolioMobile: ({ broker }: { broker: string }) => (
    <div data-portfolio={broker} />
  ),
}));

const { StocksPage } = await import("./StocksPage");
const { brokerPath } = await import("@/features/stock/lib/broker");

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  // Line 탭이 크기를 지켜본다 — jsdom 에는 없다
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  state.connectedBrokers = [];
  state.primaryBroker = null;
  state.isLoading = false;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function Here() {
  return <span data-path>{useLocation().pathname}</span>;
}

/** AppLayout 이 주는 것과 같은 outlet context 를 물린 실제 라우트 배선. */
function Shell({ mobile }: { mobile: boolean }) {
  return (
    <>
      <Here />
      <Outlet context={{ mobile, onAddTx: () => {} }} />
    </>
  );
}

function renderAt(path: string, mobile = false) {
  act(() =>
    root.render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<Shell mobile={mobile} />}>
            <Route path="/desk/stocks" element={<StocksPage />} />
            <Route path="/desk/stocks/:broker" element={<StocksPage />} />
            <Route
              path="/desk/stocks/:broker/portfolio"
              element={<StocksPage view="portfolio" />}
            />
            <Route
              path="/desk/stocks/:broker/:symbol"
              element={<StocksPage view="detail" />}
            />
            <Route path="/desk" element={<div data-dashboard />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    ),
  );
}

const shownBroker = () =>
  container.querySelector("[data-broker]")?.getAttribute("data-broker") ?? null;
const path = () => container.querySelector("[data-path]")!.textContent;
const tablist = () => container.querySelector('[role="tablist"]');

describe("StocksPage 라우팅", () => {
  // 한 테스트에 두 경로를 넣지 않는다 — MemoryRouter 의 initialEntries 는 마운트 때만 읽혀
  // 같은 root 에 다시 render 하면 두 번째 경로가 무시된다(그래서 조용히 통과할 뻔했다).
  it("토스 경로가 토스 화면을 그린다", () => {
    state.connectedBrokers = ["TOSS", "NAMU"];
    renderAt("/desk/stocks/toss");
    expect(shownBroker()).toBe("TOSS");
    expect(path()).toBe("/desk/stocks/toss");
  });

  it("나무 경로가 나무 화면을 그린다", () => {
    state.connectedBrokers = ["TOSS", "NAMU"];
    renderAt("/desk/stocks/namu");
    expect(shownBroker()).toBe("NAMU");
    expect(path()).toBe("/desk/stocks/namu");
  });

  it("부모 경로는 기본 증권사로 넘긴다 — 북마크가 깨지지 않는다", () => {
    state.connectedBrokers = ["TOSS", "NAMU"];
    state.primaryBroker = "NAMU";
    renderAt("/desk/stocks");
    expect(path()).toBe("/desk/stocks/namu");
    expect(shownBroker()).toBe("NAMU");
  });

  it("기본 소스가 없으면 첫 연결로 넘긴다", () => {
    state.connectedBrokers = ["TOSS", "NAMU"];
    state.primaryBroker = null;
    renderAt("/desk/stocks");
    expect(path()).toBe("/desk/stocks/toss");
  });

  it("기본 소스가 끊긴 증권사를 가리켜도 연결된 것으로 넘긴다", () => {
    state.connectedBrokers = ["NAMU"];
    state.primaryBroker = "TOSS";
    renderAt("/desk/stocks");
    expect(path()).toBe("/desk/stocks/namu");
  });

  it("연결이 없는 증권사 경로는 기본으로 되돌린다 (한 번에 멈춘다)", () => {
    state.connectedBrokers = ["NAMU"];
    renderAt("/desk/stocks/toss");
    expect(path()).toBe("/desk/stocks/namu");
    expect(shownBroker()).toBe("NAMU");
  });

  it("아는 코드가 아니어도 연결돼 있으면 미지원 안내를 띄운다 (빈 화면 금지)", () => {
    state.connectedBrokers = ["KIWOOM"];
    renderAt("/desk/stocks/kiwoom");
    expect(shownBroker()).toBeNull();
    expect(container.textContent).toContain("broker.unsupported");
    // Q4 결정 — 새 표면을 만들지 않는다: 그 화면 맨 위 Page Banner
    expect(container.querySelector("[data-slot=page-banner]")).not.toBeNull();
  });
});

describe("StocksPage 미연결 사용자", () => {
  it("연결이 하나도 없으면 부모 경로에서 연결 안내를 띄운다 — 리다이렉트 금지", () => {
    state.connectedBrokers = [];
    renderAt("/desk/stocks");
    expect(path()).toBe("/desk/stocks");
    expect(container.textContent).toContain("connect.firstTitle");
    // Q4 결정 — 연결 안내는 Result Section empty, 옛 Card · 자물쇠 표면이 아니다
    const rs = container.querySelector("[data-slot=result-section]");
    expect(rs).not.toBeNull();
    expect(rs!.textContent).toContain("connect.firstDesc");
    expect(rs!.querySelector("button")!.textContent).toBe(
      "connect.firstAction",
    );
    // 단추(neutralWeak)가 회색 바닥에 묻히지 않게 흰 면 위에 두고, 세로는 본문 영역 가운데(result-section.yaml alignItems)
    const gate = container.querySelector("[data-slot=connect-gate]")!;
    expect(gate.className).toContain("bg-bg-layer-default");
    expect(gate.className).toContain("justify-center");
    expect(gate.contains(rs)).toBe(true);
  });

  it("하위 경로로 직접 들어와도 연결 안내가 먼저다", () => {
    state.connectedBrokers = [];
    renderAt("/desk/stocks/toss");
    expect(container.textContent).toContain("connect.firstTitle");
  });

  it("아직 모르는 동안엔 아무것도 그리지 않는다 — URL 을 미리 굳히지 않는다", () => {
    state.isLoading = true;
    renderAt("/desk/stocks");
    expect(path()).toBe("/desk/stocks");
    expect(shownBroker()).toBeNull();
    expect(container.textContent).not.toContain("connect.firstTitle");
  });
});

describe("StocksPage 증권사 전환 수단", () => {
  it("모바일은 탭을 유지한다 — 사이드바가 없어 다른 길이 없다", () => {
    state.connectedBrokers = ["TOSS", "NAMU"];
    renderAt("/desk/stocks/toss", true);
    expect(tablist()).not.toBeNull();
    expect(tablist()!.textContent).toContain("broker.toss");
    expect(tablist()!.textContent).toContain("broker.namu");
  });

  it("데스크톱은 탭을 접는다 — 사이드바 하위 메뉴가 그 일을 한다", () => {
    state.connectedBrokers = ["TOSS", "NAMU"];
    renderAt("/desk/stocks/toss", false);
    expect(tablist()).toBeNull();
  });

  it("연결이 하나면 모바일에도 탭이 없다 — 고를 게 없다", () => {
    state.connectedBrokers = ["TOSS"];
    renderAt("/desk/stocks/toss", true);
    expect(tablist()).toBeNull();
  });
});

describe("상세 · 포트폴리오 주소(I-13 17)", () => {
  const detail = () =>
    container.querySelector("[data-detail]")?.getAttribute("data-detail");
  const layoutOf = () =>
    container.querySelector("[data-detail]")?.getAttribute("data-layout");
  it("폰: 심볼 주소는 상세 페이지를 그린다 — 점 심볼도", () => {
    state.connectedBrokers = ["TOSS"];
    renderAt("/desk/stocks/toss/BRK.B", true);
    expect(detail()).toBe("TOSS:BRK.B");
  });
  it("폰: 포트폴리오 주소는 정적이라 심볼보다 먼저다", () => {
    state.connectedBrokers = ["TOSS"];
    renderAt("/desk/stocks/toss/portfolio", true);
    expect(container.querySelector("[data-portfolio]")).not.toBeNull();
    expect(detail()).toBeUndefined();
  });
  it("폰 상세는 phone 틀, 768 이상 상세는 같은 주소의 desk 틀 — 목록 화면에 고른 채로 그리지 않는다(13-1 다리를 걷었다)", () => {
    state.connectedBrokers = ["TOSS"];
    renderAt("/desk/stocks/toss/A900001", true);
    expect(layoutOf()).toBe("phone");
    act(() => root.unmount());
    root = createRoot(container);
    renderAt("/desk/stocks/toss/A900001", false);
    expect(detail()).toBe("TOSS:A900001");
    expect(layoutOf()).toBe("desk");
    expect(shownBroker()).toBeNull();
  });
  it("768 이상: 포트폴리오 주소는 목록으로 replace", () => {
    state.connectedBrokers = ["TOSS"];
    renderAt("/desk/stocks/toss/portfolio", false);
    expect(path()).toBe("/desk/stocks/toss");
  });
  it("끊긴 증권사의 상세 주소는 기본 증권사 목록으로", () => {
    state.connectedBrokers = ["NAMU"];
    renderAt("/desk/stocks/toss/005930", true);
    expect(path()).toBe("/desk/stocks/namu");
  });
});

describe("증권사 경로 모양", () => {
  // AppLayout 의 FULLSCREEN_PATHS 는 '/desk/stocks' 를 **접두사로** 본다 — 모바일에서
  // 전역 헤더·탭바를 걷고 페이지 자체 ← 헤더를 쓰는 판정이 여기 걸려 있다.
  // 하위 경로가 이 접두사를 벗어나면 모바일 증권 화면에 헤더가 둘 겹친다.
  it("하위 경로는 /desk/stocks 접두사를 유지한다 — 모바일 풀스크린 판정이 여기 걸려 있다", () => {
    expect(brokerPath("TOSS")).toBe("/desk/stocks/toss");
    expect(brokerPath("NAMU")).toBe("/desk/stocks/namu");
    expect(brokerPath("KIWOOM").startsWith("/desk/stocks")).toBe(true);
  });
});
