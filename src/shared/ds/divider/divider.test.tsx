// Divider 의 동작 — 두께 · 색 · 들임은 scripts/check-ds-spec.mjs 가 크로미움에서 스펙 값과 맞춘다.
import { act, createRef, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { Divider } from "./divider";

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

describe("Divider", () => {
  it("기본은 장식 — <hr> 이 아닌 <div>, 보조 기술에 숨긴다", () => {
    const line = render(<Divider />);
    expect(line.tagName).toBe("DIV");
    expect(line.dataset.slot).toBe("divider");
    expect(line.getAttribute("aria-hidden")).toBe("true");
    expect(line.hasAttribute("role")).toBe(false);
    expect(line.hasAttribute("aria-orientation")).toBe(false);
  });

  it("가로 끝까지 — 높이 1 · 부모 폭, 선 색 하나, 바깥 여백 없음", () => {
    const line = render(<Divider />);
    expect(line.dataset.orientation).toBe("horizontal");
    expect(line.className).toContain("h-px");
    expect(line.className).toContain("w-full");
    expect(line.className).toContain("bg-stroke-neutral-subtle");
    expect(line.className).toContain("shrink-0");
    expect(line.className).not.toMatch(/(^|\s)m[xy]?-/);
  });

  it("가로 들임 — 양끝 16, 폭은 부모 폭 − 32", () => {
    const line = render(<Divider inset />);
    expect(line.className).toContain("mx-x4");
    expect(line.className).toContain("w-[calc(100%-2*var(--spacing-x4))]");
    expect(line.className).not.toContain("w-full");
  });

  it("세로 — 폭 1, 높이는 부모가 정한다(늘어난다). 들임이면 위아래 16", () => {
    const line = render(<Divider orientation="vertical" />);
    expect(line.dataset.orientation).toBe("vertical");
    expect(line.className).toContain("w-px");
    expect(line.className).toContain("self-stretch");
    expect(line.className).not.toContain("h-px");
    expect(line.className).not.toContain("w-full");

    const inset = render(<Divider orientation="vertical" inset />);
    expect(inset.className).toContain("my-x4");
    expect(inset.className).not.toContain("mx-x4");
  });

  it("의미 있는 구분선 — role=separator + 방향, 숨기지 않는다", () => {
    const line = render(<Divider decorative={false} />);
    expect(line.getAttribute("role")).toBe("separator");
    expect(line.getAttribute("aria-orientation")).toBe("horizontal");
    expect(line.hasAttribute("aria-hidden")).toBe(false);

    const vertical = render(
      <Divider orientation="vertical" decorative={false} />,
    );
    expect(vertical.getAttribute("aria-orientation")).toBe("vertical");
  });

  it("포커스가 서지 않는다", () => {
    const line = render(<Divider decorative={false} />);
    expect(line.hasAttribute("tabindex")).toBe(false);
  });

  it("쓰는 쪽의 className · ref 를 받는다", () => {
    const ref = createRef<HTMLDivElement>();
    const line = render(<Divider ref={ref} className="my-x3" />);
    expect(ref.current).toBe(line);
    expect(line.className).toContain("my-x3");
  });
});
