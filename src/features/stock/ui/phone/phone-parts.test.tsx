import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { amountText } from "../../lib/amount-text";
import { PctDelta } from "./phone-parts";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

let host: HTMLDivElement | null = null;
afterEach(() => {
  host?.remove();
  host = null;
});
function render(node: React.ReactNode) {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement("div");
  document.body.appendChild(host);
  act(() => createRoot(host!).render(node));
  return host;
}

describe("종목 줄 값(I-13 11)", () => {
  it("미국 종목 금액은 원이 아니라 달러다", () => {
    expect(amountText(6185.55, "USD")).toBe("$6,185.55");
    expect(amountText(8760000, "KRW")).toContain("8,760,000");
  });
  it("등락률은 화살표 + 부호 없는 숫자, + 를 함께 쓰지 않는다", () => {
    const el = render(<PctDelta pct={12.234} />);
    expect(el.textContent).toContain("▲");
    expect(el.textContent).toContain("12.23%");
    expect(el.textContent).not.toContain("+");
  });
  it("0.00% 는 화살표 없이", () => {
    const el = render(<PctDelta pct={0.001} />);
    expect(el.textContent).toBe("0.00%");
  });
  it("값이 없으면 —", () => {
    expect(render(<PctDelta pct={null} />).textContent).toBe("—");
  });
});
