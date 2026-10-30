// 폰 증권 조각의 동작 — 찾기(키보드 · 표면) · 그룹 폼(삭제 단추 없음 · 막힘 · 닫기 확인) · 그룹 제목 (I-13 P 절 13 ~ 16 · 24)
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

const mocks = vi.hoisted(() => ({
  results: [] as unknown[],
  create: vi.fn(),
  rename: vi.fn(),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (k: string, o?: Record<string, unknown>) =>
      o?.name != null ? `${k}|${o.name}|${o.count ?? ""}` : k,
  }),
  initReactI18next: { type: "3rdParty", init: () => {} },
}));
vi.mock("../../model/useStockMaster", () => ({
  useStockSearch: () => ({
    data: mocks.results,
    isError: false,
    isFetching: false,
    refetch: () => {},
  }),
}));
vi.mock("../../api/watchlistApi", () => ({
  useCreateWatchGroup: () => ({ isPending: false, mutate: mocks.create }),
  useRenameWatchGroup: () => ({ isPending: false, mutate: mocks.rename }),
  useDeleteWatchGroup: () => ({ isPending: false, mutateAsync: vi.fn() }),
}));

const { StockSearchEntry } = await import("./stock-search");
const { WatchGroupForm, WatchGroups } = await import("./watch-groups");

let container: HTMLDivElement;
let root: Root;
let wide = false;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  Element.prototype.scrollIntoView ??= () => {};
  window.matchMedia = ((query: string) => ({
    matches: wide && query.includes("1280px"),
    media: query,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
  mocks.results = [];
  mocks.create.mockClear();
  mocks.rename.mockClear();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(async () => {
  act(() => root.unmount());
  container.remove();
  document.body.removeAttribute("style");
  await new Promise((r) => setTimeout(r, 50));
});
const render = (n: ReactNode) =>
  act(() => root.render(<MemoryRouter>{n}</MemoryRouter>));
const dlg = () => document.querySelector('[role="dialog"]');

const group = (id: number, name: string, n: number) => ({
  rowId: id,
  groupName: name,
  sortOrder: id,
  items: Array.from({ length: n }, (_, i) => ({
    rowId: id * 10 + i,
    stockMasterRowId: i,
    countryCode: "KR",
    marketCode: "KOSPI",
    symbol: `S${id}${i}`,
    nameKr: `종목${i}`,
    nameEn: null,
    securityType: "STOCK",
    currency: "KRW",
  })),
});

describe("종목 찾기 입구", () => {
  it("입구는 단추다 — aria-haspopup=dialog, 이름 '종목 검색'(상자 입력이 아니다)", () => {
    render(<StockSearchEntry onPick={() => {}} />);
    const b = container.querySelector("[data-slot=stock-search-entry]")!;
    expect(b.tagName).toBe("BUTTON");
    expect(b.getAttribute("aria-haspopup")).toBe("dialog");
    expect(b.getAttribute("aria-label")).toBe("search.label");
    expect(b.textContent).toBe("search.placeholder");
  });
  it("1279 이하는 시트, 1280 이상은 팝오버", async () => {
    wide = false;
    render(<StockSearchEntry onPick={() => {}} />);
    await act(async () => {
      container
        .querySelector<HTMLButtonElement>("[data-slot=stock-search-entry]")!
        .click();
    });
    expect(dlg()?.getAttribute("data-slot")).toMatch(/bottom-sheet/);
    expect(document.querySelector("[data-slot=popover-content]")).toBeNull();
  });
  it("1280 이상은 팝오버로 열린다", async () => {
    wide = true;
    render(<StockSearchEntry onPick={() => {}} />);
    await act(async () => {
      container
        .querySelector<HTMLButtonElement>("[data-slot=stock-search-entry]")!
        .click();
    });
    expect(
      document.querySelector("[data-slot=popover-content]"),
    ).not.toBeNull();
    wide = false;
  });
  it("↓ 로 강조하고 Enter 로 고르면 표면이 닫히고 그 종목이 넘어간다", async () => {
    mocks.results = [
      {
        rowId: 1,
        marketCode: "KOSPI",
        symbol: "005930",
        nameKr: "삼성전자",
        securityType: "STOCK",
      },
      {
        rowId: 2,
        marketCode: "KOSPI",
        symbol: "000660",
        nameKr: "SK하이닉스",
        securityType: "STOCK",
      },
    ];
    const picked = vi.fn();
    render(<StockSearchEntry onPick={picked} />);
    await act(async () => {
      container
        .querySelector<HTMLButtonElement>("[data-slot=stock-search-entry]")!
        .click();
    });
    const input = document.querySelector<HTMLInputElement>(
      'input[role="combobox"]',
    )!;
    const set = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )!.set!;
    await act(async () => {
      set.call(input, "삼성");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    const key = async (k: string) =>
      act(async () => {
        input.dispatchEvent(
          new KeyboardEvent("keydown", { key: k, bubbles: true }),
        );
      });
    await key("ArrowDown");
    await key("Enter");
    expect(picked).toHaveBeenCalledTimes(1);
    expect(picked.mock.calls[0]![0].symbol).toBe("005930");
  });
  it("결과 줄에 오른쪽 라디오가 없다(고르면 상세로 가는 찾기)", async () => {
    mocks.results = [
      {
        rowId: 1,
        marketCode: "KOSPI",
        symbol: "005930",
        nameKr: "삼성전자",
        securityType: "STOCK",
      },
    ];
    render(<StockSearchEntry onPick={() => {}} />);
    await act(async () => {
      container
        .querySelector<HTMLButtonElement>("[data-slot=stock-search-entry]")!
        .click();
    });
    const input = document.querySelector<HTMLInputElement>(
      'input[role="combobox"]',
    )!;
    const set = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )!.set!;
    await act(async () => {
      set.call(input, "삼");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(document.querySelectorAll('[role="option"]').length).toBe(1);
    expect(
      document.querySelector('[role="option"] [data-slot*=radio]'),
    ).toBeNull();
    expect(document.querySelector('[role="option"]')!.textContent).toContain(
      "005930",
    );
  });
});

describe("그룹 폼", () => {
  it("삭제 단추가 없다 · 빈 이름이면 저장이 막힌다", async () => {
    render(<WatchGroupForm group={null} onClose={() => {}} />);
    await act(async () => {});
    expect(dlg()).not.toBeNull();
    expect(dlg()!.textContent).not.toContain("watch.groupDelete");
    const save = [...dlg()!.querySelectorAll("button")].find((b) =>
      b.textContent?.includes("save"),
    )!;
    expect(save.hasAttribute("disabled")).toBe(true);
  });
  it("이름 바꾸기는 지금 이름이 들어 있고 Enter 로 저장한다(값이 같아도 요청)", async () => {
    render(<WatchGroupForm group={group(1, "반도체", 2)} onClose={() => {}} />);
    await act(async () => {});
    const input = dlg()!.querySelector<HTMLInputElement>("input")!;
    expect(input.value).toBe("반도체");
    await act(async () => {
      input.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
      );
    });
    expect(mocks.rename).toHaveBeenCalledTimes(1);
    expect(mocks.rename.mock.calls[0]![0]).toEqual({
      groupId: 1,
      groupName: "반도체",
    });
  });
  it("1280 이상 Dialog 에서는 [취소] 가 있고, 미만 시트에는 없다", async () => {
    wide = true;
    render(<WatchGroupForm group={null} onClose={() => {}} />);
    await act(async () => {});
    expect(dlg()!.textContent).toContain("cancel");
    act(() => root.render(<div />));
    wide = false;
    render(<WatchGroupForm group={null} onClose={() => {}} />);
    await act(async () => {});
    expect(
      [...dlg()!.querySelectorAll("button")].some(
        (b) => b.textContent === "cancel",
      ),
    ).toBe(false);
  });
});

describe("관심 그룹 목록", () => {
  const props = {
    onRetry: () => {},
    priceOf: () => ({ price: null, changePct: null }),
    track: () => () => {},
    onOpen: () => {},
    onAddGroup: () => {},
    onRenameGroup: () => {},
    onDeleteGroup: () => {},
  };
  it("모든 그룹이 제목 '{이름} · {개수}' 로 서고 맨 끝에 그룹 추가 줄, ⋮ 이름은 '{그룹} 더보기'", () => {
    render(
      <WatchGroups
        {...props}
        groups={[group(1, "반도체", 2), group(2, "빈 그룹", 0)]}
      />,
    );
    const heads = [...container.querySelectorAll("h3")].map(
      (h) => h.textContent,
    );
    expect(heads).toEqual([
      "watch.groupTitle|반도체|2",
      "watch.groupTitle|빈 그룹|0",
    ]);
    expect(container.textContent).toContain("watch.groupEmpty");
    expect(
      container.querySelector('button[aria-label="watch.groupMore|반도체|"]'),
    ).not.toBeNull();
    const last = [
      ...container.querySelectorAll("[data-slot=list-body]"),
    ].pop()!;
    expect(last.textContent).toBe("watch.groupAdd");
  });
  it("그룹이 0 이면 '관심 종목이 없어요' 만, 그룹 추가 줄은 없다", () => {
    render(<WatchGroups {...props} groups={[]} />);
    expect(container.textContent).toContain("watch.emptyTitle");
    expect(container.textContent).not.toContain("watch.groupAdd");
  });
});
