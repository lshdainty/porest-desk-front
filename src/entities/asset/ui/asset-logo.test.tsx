import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { AssetLogo } from "./asset-logo";

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

const logo = (asset: Parameters<typeof AssetLogo>[0]["asset"]) => {
  act(() => root.render(<AssetLogo asset={asset} />));
  return container.firstElementChild as HTMLElement;
};

describe("AssetLogo 색 — 기관 색 표 → 없으면 이름 색", () => {
  it("기관이 표에 있으면 표의 색, 저장된 색(asset.color)은 읽지 않는다", () => {
    const el = logo({
      assetName: "월급 통장",
      institution: "신한",
      color: "#123456",
    });
    expect(el.style.background).toBe("rgb(0, 70, 255)");
    expect(el.style.color).toBe("var(--color-static-white)");
  });

  it("밝은 기관 면은 모드에 따라 갈리는 짙은 글자", () => {
    const el = logo({
      assetName: "생활비",
      institution: "KB국민",
      color: null,
    });
    expect(el.style.color).toBe("var(--institution-ink)");
  });

  it("기관이 없으면 Avatar 와 같은 이름 색(차트 10색) + fg-neutral-inverted, 저장 색은 무시", () => {
    const el = logo({
      assetName: "비상금",
      institution: null,
      color: "#abcdef",
    });
    expect(el.style.background).toMatch(/^var\(--color-chart-[a-z]+\)$/);
    expect(el.style.color).toBe("var(--color-fg-neutral-inverted)");
  });

  it("이름 하나 — 표에 없는 기관이면 이름 색도 기관 이름에서(자산 이름이 아니다)", () => {
    const a = logo({
      assetName: "비상금",
      institution: "모르는기관",
      color: null,
    });
    const b = logo({
      assetName: "전혀 다른 이름",
      institution: "모르는기관",
      color: null,
    });
    expect(a.style.background).toBe(b.style.background);
    expect(a.textContent).toBe("모");
  });

  it("이름이 비면 글자 없이 회색", () => {
    const el = logo({ assetName: "", institution: null, color: null });
    expect(el.textContent).toBe("");
    expect(el.style.background).toBe("var(--color-chart-gray)");
  });
});
