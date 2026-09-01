// 관심목록 그룹 상태는 토스 페이지 안에 있던 것을 나무와 공용으로 끌어냈고,
// 그러면서 "이펙트로 되돌려 맞추기" 를 "유도하기" 로 바꿨다.
// 겉보기 동작이 그대로인지 — 특히 **그룹이 지워졌을 때** 되돌아가는지 — 를 고정한다.
import { act, useEffect, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { WatchGroup } from "../api/stockApi";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

const state = vi.hoisted(() => ({ groups: [] as unknown[] }));

vi.mock("../api/watchlistApi", () => ({
  useWatchGroups: () => ({ data: state.groups }),
  useCreateWatchGroup: () => ({ mutate: vi.fn() }),
  useAddWatchItem: () => ({ mutate: vi.fn() }),
  useRemoveWatchItem: () => ({ mutate: vi.fn() }),
  findWatchEntries: () => [],
}));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

const { useWatchlist } = await import("./useWatchlist");

const group = (rowId: number, name: string, symbols: string[]): WatchGroup => ({
  rowId,
  groupName: name,
  sortOrder: rowId,
  items: symbols.map((symbol, i) => ({
    rowId: rowId * 100 + i,
    stockMasterRowId: i,
    countryCode: "KR",
    marketCode: "KOSPI",
    symbol,
    nameKr: symbol,
    nameEn: null,
    securityType: "STOCK" as const,
    currency: "KRW",
  })),
});

let container: HTMLDivElement;
let root: Root;
let seen: ReturnType<typeof useWatchlist>;

function Probe() {
  // 렌더 중에 바깥 변수를 쓰면 부수효과다 — `act` 가 effect 까지 흘려 주므로
  // 커밋 뒤에 담아도 테스트가 읽는 시점엔 이미 채워져 있다.
  const value = useWatchlist();
  useEffect(() => {
    seen = value;
  });
  return null;
}

const render = (node: ReactNode) => act(() => root.render(node));

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  state.groups = [];
});

describe("useWatchlist 의 열린 그룹", () => {
  it("그룹이 없으면 열린 그룹도 없다", () => {
    state.groups = [];
    render(<Probe />);
    expect(seen.activeGroup).toBeNull();
    expect(seen.activeGroupId).toBeNull();
  });

  it("처음에는 첫 그룹이 열린다 — 이펙트를 한 번 더 돌지 않고 첫 렌더에 바로", () => {
    state.groups = [group(1, "관심", ["005930"]), group(2, "해외", ["AAPL"])];
    render(<Probe />);
    expect(seen.activeGroupId).toBe(1);
  });

  it("고른 그룹이 열린다", () => {
    state.groups = [group(1, "관심", ["005930"]), group(2, "해외", ["AAPL"])];
    render(<Probe />);
    act(() => seen.setActiveGroupId(2));
    expect(seen.activeGroupId).toBe(2);
  });

  it("고른 그룹이 지워지면 첫 그룹으로 접힌다 — 빈 목록이 남으면 안 된다", () => {
    state.groups = [group(1, "관심", ["005930"]), group(2, "해외", ["AAPL"])];
    render(<Probe />);
    act(() => seen.setActiveGroupId(2));
    expect(seen.activeGroupId).toBe(2);

    state.groups = [group(1, "관심", ["005930"])];
    render(<Probe />);
    expect(seen.activeGroupId).toBe(1);
  });

  it("별 판정은 전 그룹을 합친다 — 어느 그룹에 있든 별이다", () => {
    state.groups = [group(1, "관심", ["005930"]), group(2, "해외", ["AAPL"])];
    render(<Probe />);
    expect(seen.watchedSymbols).toEqual(new Set(["005930", "AAPL"]));
    expect(seen.isWatched("AAPL")).toBe(true);
    expect(seen.isWatched("000660")).toBe(false);
  });
});
