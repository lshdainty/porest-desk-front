// 증권 데스크톱 틀(I-13 26 ~ 27 · 33 ~ 34) — 제목 줄 · "‹ 부모" · 2 : 1 칸 · 한 칸 순서 · 내 투자 가로 칸
import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
  initReactI18next: { type: "3rdParty", init: () => {} },
}));

const { DeskColumns, DeskFrame, DeskSlot } = await import("./desk-frame");
const { InvestBand } = await import("@/features/stock/ui/phone/invest-band");

let host: HTMLDivElement;
beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement("div");
  document.body.appendChild(host);
});
afterEach(() => host.remove());
const render = (node: React.ReactNode) => {
  const root = createRoot(host);
  act(() => root.render(<MemoryRouter>{node}</MemoryRouter>));
  return () => act(() => root.unmount());
};

describe("DeskFrame", () => {
  it("제목 h1 하나 · 부모 링크는 적힌 주소로 · 본문 폭 720 / 1280 이상 1040", () => {
    const un = render(
      <DeskFrame
        slot="x"
        title="종목 상세"
        parent={{ to: "/desk/stocks/toss", label: "증권" }}
      >
        <i />
      </DeskFrame>,
    );
    expect(host.querySelectorAll("h1")).toHaveLength(1);
    expect(host.querySelector("h1")?.textContent).toBe("종목 상세");
    const a = host.querySelector("a")!;
    expect(a.getAttribute("href")).toBe("/desk/stocks/toss");
    expect(a.textContent).toBe("증권");
    const box = host.querySelector("[data-slot=x] > div")!;
    expect(box.className).toContain("max-w-[var(--layout-max-low)]");
    expect(box.className).toContain("lg:max-w-[var(--layout-max-medium)]");
    un();
  });
  it("목록 화면에는 부모 링크가 없다", () => {
    const un = render(
      <DeskFrame slot="x" title="증권">
        <i />
      </DeskFrame>,
    );
    expect(host.querySelector("a")).toBeNull();
    un();
  });
});

describe("DeskColumns", () => {
  it("1280 이상 2fr · 1fr 칸 · 칸 사이 gutter · 한 칸은 order 로 쌓는다(칸 상자는 contents)", () => {
    const un = render(
      <DeskColumns
        left={
          <>
            <DeskSlot order={1} slot="invest">
              a
            </DeskSlot>
            <DeskSlot order={4} slot="stocks">
              d
            </DeskSlot>
          </>
        }
        right={
          <>
            <DeskSlot order={2} slot="market">
              b
            </DeskSlot>
            <DeskSlot order={3} slot="composition">
              c
            </DeskSlot>
          </>
        }
      />,
    );
    const grid = host.querySelector("[data-slot=stocks-columns]")!;
    expect(grid.className).toContain(
      "lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]",
    );
    expect(grid.className).toContain("lg:gap-[var(--layout-gutter)]");
    expect(grid.className).toContain("gap-x2");
    expect(grid.children[0]!.className).toContain("contents");
    const orders = ["invest", "market", "composition", "stocks"].map(
      (s) =>
        host.querySelector(`[data-slot=${s}]`)!.className.match(/order-\d/)![0],
    );
    expect(orders).toEqual(["order-1", "order-2", "order-3", "order-4"]);
    un();
  });
});

describe("InvestBand columns", () => {
  it("키-값을 가로 세 칸으로 · 포트폴리오 구성 줄은 두지 않는다", () => {
    const un = render(
      <InvestBand
        columns
        label="평가금액"
        amount="1,000원"
        rows={[
          { key: "a", name: "매입금액", value: "900원" },
          { key: "b", name: "일간 손익", value: "10원" },
          { key: "c", name: "보유 종목", value: "6개" },
        ]}
        onOpenPortfolio={null}
      />,
    );
    const dl = host.querySelector("dl")!;
    expect(dl.style.gridTemplateColumns).toContain("repeat(3");
    expect(dl.querySelectorAll("dt")).toHaveLength(3);
    expect(host.textContent).not.toContain("portfolio.title");
    un();
  });
});
