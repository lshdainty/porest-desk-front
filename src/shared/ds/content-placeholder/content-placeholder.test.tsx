// Content Placeholder 의 동작 — 면 · 그림 색과 모서리는 scripts/check-ds-spec.mjs 가 크로미움에서 스펙 값과 맞춘다.
import { act, createRef, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { CreditCard } from "lucide-react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { ContentPlaceholder } from "./content-placeholder";

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

function render(node: ReactNode) {
  act(() => root.render(node));
  return container.firstElementChild as HTMLElement;
}

const glyph = (el: HTMLElement) =>
  el.querySelector<HTMLElement>("[data-slot=content-placeholder-glyph]")!;

describe("ContentPlaceholder", () => {
  it("대체 글이 없으면 장식 — 자리째 보조 기술에 숨기고, 그림은 기본 사진 아이콘", () => {
    const el = render(<ContentPlaceholder />);
    expect(el.dataset.slot).toBe("content-placeholder");
    expect(el.getAttribute("aria-hidden")).toBe("true");
    expect(el.hasAttribute("role")).toBe(false);
    expect(glyph(el).getAttribute("aria-hidden")).toBe("true");
    expect(glyph(el).querySelector("svg")?.getAttribute("class")).toContain(
      "lucide-image",
    );
  });

  it("대체 글이 있으면 그 글을 자리 이름으로 — role=img", () => {
    const el = render(<ContentPlaceholder label="현대카드 M 카드 그림" />);
    expect(el.getAttribute("role")).toBe("img");
    expect(el.getAttribute("aria-label")).toBe("현대카드 M 카드 그림");
    expect(el.hasAttribute("aria-hidden")).toBe(false);
    // 그림 아이콘은 늘 숨긴다
    expect(glyph(el).getAttribute("aria-hidden")).toBe("true");
  });

  it("빈 대체 글은 없는 것과 같다", () => {
    const el = render(<ContentPlaceholder label="  " />);
    expect(el.getAttribute("aria-hidden")).toBe("true");
    expect(el.hasAttribute("role")).toBe(false);
    expect(el.hasAttribute("aria-label")).toBe(false);
  });

  it("자리를 말하는 아이콘으로 바꿀 수 있다", () => {
    const el = render(<ContentPlaceholder icon={<CreditCard />} />);
    const svg = glyph(el).querySelector("svg")!;
    expect(svg.getAttribute("class")).toContain("lucide-credit-card");
    expect(glyph(el).querySelectorAll("svg")).toHaveLength(1);
  });

  it("틀을 채우고 제 모서리가 없다 — 그림은 틀 높이의 50%(16 ~ 160) · 선 굵기 1.5", () => {
    const ref = createRef<HTMLDivElement>();
    const el = render(<ContentPlaceholder ref={ref} className="opacity-90" />);
    expect(ref.current).toBe(el);
    expect(el.className).toContain("size-full");
    expect(el.className).toContain("bg-bg-neutral-weak");
    expect(el.className).toContain("[container-type:size]");
    expect(el.className).toContain("opacity-90");
    expect(el.className).not.toMatch(/\brounded/);
    const cls = glyph(el).className;
    expect(cls).toContain("size-[min(clamp(16px,50cqh,160px),100cqw)]");
    expect(cls).toContain("text-stroke-neutral-weak");
    expect(cls).toContain("[&>svg]:[stroke-width:1.5]");
  });
});
