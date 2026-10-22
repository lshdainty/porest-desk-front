// 예산 경고 슬라이더 — 끄는 동안 화면이 값을 따라가고, 손을 뗄 때 한 번 저장, 요청 중에도 막지 않는다.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ThresholdSlider } from "./ThresholdSlider";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

const thumb = () => container.querySelector<HTMLElement>("[role=slider]")!;
const key = (k: string) =>
  act(() => {
    thumb().focus();
    thumb().dispatchEvent(
      new KeyboardEvent("keydown", { key: k, bubbles: true }),
    );
  });

describe("ThresholdSlider", () => {
  it("끄는 동안 화면이 값을 따라가고 저장은 손을 뗄 때 한 번, 저장이 끝나면 서버 값을 따른다", () => {
    const onCommit = vi.fn();
    act(() => root.render(<ThresholdSlider value={85} onCommit={onCommit} />));
    expect(thumb().getAttribute("aria-valuenow")).toBe("85");
    key("ArrowRight");
    // 키보드는 한 번 움직이고 바로 확정 — 화면은 90 을 따라가고 저장 요청은 한 번
    expect(thumb().getAttribute("aria-valuenow")).toBe("90");
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit.mock.calls[0]![0]).toBe(90);
    // 저장 중에도 막지 않는다
    expect(thumb().hasAttribute("data-disabled")).toBe(false);
    // 저장이 끝나면 끄는 값을 비워 서버 값(여기서는 그대로 85)을 따른다
    act(() => onCommit.mock.calls[0]![1]());
    expect(thumb().getAttribute("aria-valuenow")).toBe("85");
  });

  it("막힘은 불러오는 동안(disabled)만이다", () => {
    act(() =>
      root.render(<ThresholdSlider value={85} disabled onCommit={() => {}} />),
    );
    expect(thumb().hasAttribute("data-disabled")).toBe(true);
  });
});
