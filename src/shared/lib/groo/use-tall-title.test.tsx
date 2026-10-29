// 거래 줄 맞춤(I-29 P3) — 제목이 두 줄을 넘는 줄만 data-row-tall 을 단다. jsdom 은 배치를 안 해서 높이를 주입한다.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { useTallTitle } from "./use-tall-title";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

function Row({ h }: { h: number }) {
  const ref = useTallTitle();
  return (
    <ul ref={ref} data-slot="list">
      <li>
        <span
          data-slot="list-title"
          style={{ lineHeight: "24px" }}
          data-h={h}
        />
      </li>
    </ul>
  );
}

let container: HTMLDivElement;
let root: Root;
const proto = HTMLElement.prototype;
const orig = Object.getOwnPropertyDescriptor(proto, "offsetHeight");

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  Object.defineProperty(proto, "offsetHeight", {
    configurable: true,
    get() {
      return Number(this.getAttribute("data-h") ?? 0);
    },
  });
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  if (orig) Object.defineProperty(proto, "offsetHeight", orig);
});

describe("useTallTitle", () => {
  it.each([
    [24, false], // 한 줄
    [48, false], // 두 줄
    [72, true], // 세 줄
  ])("제목 높이 %i → data-row-tall %s", (h, tall) => {
    act(() => root.render(<Row h={h} />));
    expect(container.querySelector("ul")!.hasAttribute("data-row-tall")).toBe(
      tall,
    );
  });

  it("groo.css 가 목록 단위 · 줄 단위 규칙을 둔다(두 줄 넘는 줄이 하나라도 있으면 목록 전체 위)", () => {
    const css = readFileSync(
      path.join(__dirname, "../../styles/groo.css"),
      "utf8",
    );
    expect(css).toContain("[data-row-list]:has([data-row-tall])");
    expect(css).toContain('[data-slot="list"][data-row-tall]');
  });
});
