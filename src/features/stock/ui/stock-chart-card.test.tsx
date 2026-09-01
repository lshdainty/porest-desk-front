// 캔들은 이제 `/api/v1/securities/candles` 로 가고, 어느 증권사로 조회할지는 서버가 정한다.
// 그래서 조건이 "토스가 연결됐나" 에서 **"증권사가 하나라도 연결됐나"** 로 바뀌었다.
// 여기서 지키는 건 넷이다.
//  ① 토스 연결 → 차트를 그린다 (기존 토스 화면 동작 — 공용화하며 깨지면 안 된다)
//  ② 나무만 연결 → **이제도 그린다.** 이게 이번 변경의 핵심이다
//  ③ 미연결 → 실패할 요청을 내지 않고 이유를 보여준다
//  ④ 아직 모름 → 둘 다 하지 않는다. 여기서 ③으로 뭉개면 연결한 사용자가 첫 프레임마다
//     "증권사를 연결하세요" 를 본다
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

const features = vi.hoisted(() => ({
  current: undefined as unknown,
  loading: false,
}));

vi.mock("@/features/subscription/model/useSubscription", () => ({
  useMyFeatures: () => ({
    data: features.current,
    isLoading: features.loading,
  }),
}));

// 차트 본체는 캔버스라 jsdom 에서 그릴 수 없다 — 마운트 여부만 본다(= 요청이 나가는 자리).
vi.mock("@/features/stock/ui/LightweightStockChart", () => ({
  LightweightStockChart: () => <div data-testid="chart" />,
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

vi.mock("@/shared/ui/card", () => ({
  Card: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/shared/ui/tabs", () => ({
  Tabs: ({ children }: { children?: ReactNode }) => (
    <div data-testid="ranges">{children}</div>
  ),
  TabsList: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  TabsTrigger: ({ children }: { children?: ReactNode }) => (
    <button type="button">{children}</button>
  ),
}));

const { StockChartCard } = await import("@/features/stock/ui/stock-chart-card");

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  features.current = undefined;
  features.loading = false;
});

const render = () =>
  act(() =>
    root.render(<StockChartCard symbol="005930" isUs={false} mobile={false} />),
  );

const chart = () => container.querySelector('[data-testid="chart"]');
const notice = () =>
  container.textContent?.includes("chart.brokerRequired") ?? false;

describe("StockChartCard 의 캔들 게이트", () => {
  it("토스가 연결돼 있으면 차트를 그린다", () => {
    features.current = { connectedBrokers: ["TOSS"] };
    render();
    expect(chart()).not.toBeNull();
    expect(notice()).toBe(false);
  });

  it("나무만 연결돼 있어도 그린다 — 서버가 나무 기간별시세로 대신 조회한다", () => {
    features.current = { connectedBrokers: ["NAMU"] };
    render();
    expect(chart()).not.toBeNull();
    expect(notice()).toBe(false);
  });

  it("나무·토스를 함께 연결했으면 당연히 그린다", () => {
    features.current = { connectedBrokers: ["NAMU", "TOSS"] };
    render();
    expect(chart()).not.toBeNull();
  });

  it("증권사를 하나도 연결하지 않았으면 요청을 내지 않고 이유를 보여준다", () => {
    features.current = { connectedBrokers: [] };
    render();
    expect(chart()).toBeNull();
    expect(notice()).toBe(true);
  });

  it("연결 정보가 오기 전에는 안내를 띄우지 않는다 (연결한 사용자에게 번쩍이면 안 된다)", () => {
    features.loading = true;
    render();
    expect(notice()).toBe(false);
    expect(chart()).toBeNull();
  });

  it("못 그릴 때는 기간 탭도 숨긴다 — 누를 곳이 남으면 고장으로 읽힌다", () => {
    features.current = { connectedBrokers: [] };
    render();
    expect(container.querySelector('[data-testid="ranges"]')).toBeNull();
  });
});
