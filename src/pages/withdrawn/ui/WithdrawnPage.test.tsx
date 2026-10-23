// 해지 완료 — ds Result Section large · done(제목 h1) + Bottom CTA neutralSolid 48 하나, 바닥은 흰 면(I-05 26 · 27 · 77).
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
  initReactI18next: { type: "3rdParty", init: () => {} },
}));

const { WithdrawnPage } = await import("./WithdrawnPage");

let container: HTMLDivElement;
let root: Root;

function PathProbe() {
  return <span data-path={useLocation().pathname} />;
}

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() =>
    root.render(
      <MemoryRouter initialEntries={["/withdrawn"]}>
        <PathProbe />
        <WithdrawnPage />
      </MemoryRouter>,
    ),
  );
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe("해지 완료(26 · 27 · 77)", () => {
  it("Result Section 은 large · done 이고 제목이 화면 제목 h1 하나다", () => {
    const result = container.querySelector("[data-slot=result-section]")!;
    expect(result.getAttribute("data-kind")).toBe("done");
    expect(result.getAttribute("data-size")).toBe("large");
    const h1s = container.querySelectorAll("h1");
    expect(h1s).toHaveLength(1);
    expect(h1s[0]?.textContent).toBe("withdrawn.title");
    expect(h1s[0]?.className).toContain("text-t8");
    expect(h1s[0]?.className).toContain("font-bold");
  });

  it("설명은 두 문단(body · rejoin)이고 한 description 안에 있다", () => {
    const desc = container.querySelector(
      "[data-slot=result-section-description]",
    )!;
    const paras = Array.from(desc.querySelectorAll("span.block")).map(
      (e) => e.textContent,
    );
    expect(paras).toEqual(["withdrawn.body", "withdrawn.rejoin"]);
    expect(desc.className).toContain("text-fg-neutral-muted");
    expect(desc.className).toContain("text-t5");
  });

  it("버튼은 하나 — Bottom CTA large 48 neutralSolid, 누르면 로그인 화면으로 간다", () => {
    const buttons = container.querySelectorAll("button");
    expect(buttons).toHaveLength(1);
    const b = buttons[0]!;
    expect(b.textContent).toBe("withdrawn.toLogin");
    expect(b.className).toContain("h-12");
    expect(b.className).toContain("bg-bg-neutral-inverted");
    expect(b.className).toContain("w-full");
    act(() => {
      b.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }),
      );
    });
    expect(
      container.querySelector("[data-path]")?.getAttribute("data-path"),
    ).toBe("/login");
  });

  it("루트 바탕은 흰 면(bg-layer-default)이다 — 회색 body 가 비치지 않는다", () => {
    const rootEl = container.querySelector("[data-slot=withdrawn-page]")!;
    expect(rootEl.className).toContain("bg-bg-layer-default");
    // 구조: 폰은 버튼이 바닥(좌우 24), 768 이상은 Result Section 아래 가운데(폭 420 상자)
    expect(rootEl.querySelector(".max-w-\\[420px\\]")).not.toBeNull();
    expect(rootEl.className).toContain("md:justify-center");
  });
});
