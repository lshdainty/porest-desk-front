// 상세 매매 단추 · 안내 (I-13 20 · 21)
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}
const toastInfo = vi.hoisted(() => vi.fn());
vi.mock("sonner", () => ({ toast: { info: toastInfo, error: vi.fn() } }));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (k: string, o?: Record<string, unknown>) =>
      o?.name ? `${k}|${o.name}` : k,
  }),
  initReactI18next: { type: "3rdParty", init: () => {} },
}));

const { TradeTail, NamuNotice } = await import("./detail-parts");
let host: HTMLDivElement | null = null;
afterEach(() => {
  host?.remove();
  toastInfo.mockClear();
});
function mount(n: React.ReactNode) {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement("div");
  document.body.appendChild(host);
  act(() => createRoot(host!).render(n));
  return host;
}

describe("매매 단추 — 국내 통념(button.md 증권 매매 단추 예외)", () => {
  it("매도 brandSolid · 매수 criticalSolid · large 48 · 한 줄에 반씩 · 사이 8", () => {
    const el = mount(<TradeTail name="가람" isUs={false} />);
    const [sell, buy] = [...el.querySelectorAll("button")];
    expect(sell!.textContent).toBe("trade.sell");
    expect(sell!.className).toContain("bg-bg-brand-solid");
    expect(buy!.className).toContain("bg-bg-critical-solid");
    expect(sell!.className).toContain("min-h-[48px]");
    expect(sell!.className).toContain("flex-1");
    expect(sell!.parentElement!.className).toContain("gap-x2");
  });
  it("누르면 토스트만 뜬다", () => {
    const el = mount(<TradeTail name="가람" isUs />);
    const [sell, buy] = [...el.querySelectorAll("button")];
    act(() => sell!.click());
    act(() => buy!.click());
    expect(toastInfo.mock.calls.map((c) => c[0])).toEqual([
      "trade.sellToast|가람",
      "trade.buyToast|가람",
    ]);
  });
  it("수수료 안내는 시장에 따라 다르고 안내 두 줄이 있다", () => {
    const kr = mount(<TradeTail name="x" isUs={false} />).textContent!;
    expect(kr).toContain("fee.kr");
    expect(kr).toContain("disclaimer.line1");
    expect(kr).toContain("disclaimer.line2");
  });
});

describe("나무 상세 안내", () => {
  it("둘째 줄만 — 토스증권 문구(첫째 줄)가 없다", () => {
    const t = mount(<NamuNotice />).textContent;
    expect(t).toBe("disclaimer.line2");
  });
});
