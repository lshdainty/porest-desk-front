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
  it("끄는 값을 부르는 쪽이 쥔다 — 키보드로 움직이면 onDrag · onCommit 이 한 번씩", () => {
    const onDrag = vi.fn();
    const onCommit = vi.fn();
    act(() =>
      root.render(
        <ThresholdSlider value={85} onDrag={onDrag} onCommit={onCommit} />,
      ),
    );
    expect(thumb().getAttribute("aria-valuenow")).toBe("85");
    key("ArrowRight");
    expect(onDrag).toHaveBeenCalledWith(90);
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit.mock.calls[0]![0]).toBe(90);
    // 저장 중에도 막지 않는다
    expect(thumb().hasAttribute("data-disabled")).toBe(false);
  });

  it("막힘은 불러오는 동안(disabled)만이다", () => {
    act(() =>
      root.render(
        <ThresholdSlider
          value={85}
          disabled
          onDrag={() => {}}
          onCommit={() => {}}
        />,
      ),
    );
    expect(thumb().hasAttribute("data-disabled")).toBe(true);
  });
});
