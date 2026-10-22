// 원장 머리의 접히는 영역 — 모션 줄이기면 접지 않고, 접힌 동안 안에 초점이 오면 펼친다(03G-014a, scroll-auto-hide.md).
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { LedgerCollapse, LedgerPin } from "./ledger";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

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
});

const Pin = ({ compact }: { compact: boolean }) => (
  <LedgerPin compact={compact}>
    <LedgerCollapse>
      <button type="button" id="inside">
        합계 보기
      </button>
    </LedgerCollapse>
  </LedgerPin>
);
const render = (compact: boolean) =>
  act(() => root.render(<Pin compact={compact} />));
const collapse = () =>
  container.querySelector<HTMLElement>("[data-ledger-collapse]")!;
const cls = () => collapse().className.split(" ");

describe("LedgerCollapse", () => {
  it("펼친 상태(compact 아님)에서는 max-h 340 · 보인다", () => {
    render(false);
    expect(cls()).toContain("max-h-[340px]");
    expect(cls()).toContain("opacity-100");
    expect(cls()).not.toContain("max-h-0");
    expect(collapse().hasAttribute("data-collapsed")).toBe(false);
  });

  it("compact 면 접힌다 — max-h 0 · 투명 · 누르지 못한다", () => {
    render(true);
    expect(cls()).toEqual(
      expect.arrayContaining(["max-h-0", "opacity-0", "pointer-events-none"]),
    );
    expect(collapse().hasAttribute("data-collapsed")).toBe(true);
  });

  it("모션 줄이기면 접지 않는다 — 접힌 클래스 옆에 motion-reduce 로 펼친 값을 되돌려 둔다", () => {
    render(true);
    expect(cls()).toEqual(
      expect.arrayContaining([
        "motion-reduce:max-h-[340px]",
        "motion-reduce:opacity-100",
        "motion-reduce:pointer-events-auto",
      ]),
    );
  });

  it("접힌 동안 안의 단추에 초점이 오면 펼친다", () => {
    render(true);
    expect(collapse().hasAttribute("data-collapsed")).toBe(true);
    act(() => {
      container.querySelector<HTMLButtonElement>("#inside")!.focus();
    });
    expect(collapse().hasAttribute("data-collapsed")).toBe(false);
    expect(cls()).toContain("max-h-[340px]");
    expect(cls()).not.toContain("max-h-0");
  });

  it("펼쳐 둔 채 compact 가 풀리면 다음 접힘부터는 다시 접힌다", () => {
    render(true);
    act(() => {
      container.querySelector<HTMLButtonElement>("#inside")!.focus();
    });
    render(false);
    render(true);
    expect(collapse().hasAttribute("data-collapsed")).toBe(true);
  });
});
