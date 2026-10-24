// 전체(폰) = 흰 면 하나 · 두 칸 글(I-12 15 ~ 19) — 실제 화면을 띄워 잠근다.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: "ko" } }),
}));
vi.mock("@/features/subscription/model/useSubscription", () => ({
  useHasSecurities: () => true,
}));

const { MoreMobile } = await import("./MoreMobile");

let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() =>
    root.render(
      <MemoryRouter>
        <MoreMobile />
      </MemoryRouter>,
    ),
  );
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const type = (el: HTMLInputElement, v: string) => {
  const set = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value",
  )!.set!;
  act(() => {
    set.call(el, v);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
};

describe("MoreMobile", () => {
  it("메뉴 검색은 밑줄 입력이고 이름이 있으며 sticky 가 아니다", () => {
    const wrap = container.querySelector("[data-slot=text-input]")!;
    expect(wrap.getAttribute("data-variant")).toBe("underline");
    expect(wrap.getAttribute("data-size")).toBe("large");
    const input = wrap.querySelector("input")!;
    expect(input.getAttribute("aria-label")).toBe("search");
    expect(container.innerHTML).not.toContain("sticky");
  });

  it("묶음 제목은 h2 이고 칸은 링크이며 말줄임 · 손 불투명도가 없다", () => {
    expect(container.querySelectorAll("h2").length).toBe(4);
    const links = container.querySelectorAll("ul a");
    expect(links.length).toBeGreaterThan(15);
    expect(container.innerHTML).not.toContain("text-overflow");
    expect(container.innerHTML).not.toContain("nowrap");
    for (const a of links)
      expect(a.getAttribute("href")).toMatch(/^\/desk|\/download/);
  });

  it("검색 결과가 없으면 Result Section empty 를 보인다", () => {
    type(container.querySelector("input")!, "없는말");
    expect(
      container.querySelector("[data-slot=result-section]"),
    ).not.toBeNull();
    expect(container.querySelectorAll("ul a")).toHaveLength(0);
    expect(container.textContent).toContain("noResults");
  });
});
