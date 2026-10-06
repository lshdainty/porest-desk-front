// Button 의 동작 — 모양 · 색은 scripts/check-ds-spec.mjs 가 크로미움에서 스펙 값과 맞춘다.
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Button } from "./button";

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

describe("Button", () => {
  it("기본은 neutralSolid · medium · 글자", () => {
    const btn = render(<Button>저장</Button>);
    expect(btn.tagName).toBe("BUTTON");
    expect(btn.className).toContain("bg-bg-neutral-inverted");
    expect(btn.className).toContain("h-10");
    expect(btn.className).toContain("px-x4");
  });

  it("로딩이면 누르기를 삼키고 aria-busy 를 단다 — 두 번 제출 방지", () => {
    const onClick = vi.fn();
    const onSubmit = vi.fn((e: { preventDefault: () => void }) =>
      e.preventDefault(),
    );
    const form = render(
      <form onSubmit={onSubmit}>
        <Button type="submit" loading onClick={onClick}>
          저장
        </Button>
      </form>,
    );
    const btn = form.querySelector("button")!;
    act(() => btn.click());
    expect(onClick).not.toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(btn.getAttribute("aria-busy")).toBe("true");
    // 포커스를 빼앗지 않는다 — 비활성으로 만들지 않는다
    expect(btn.hasAttribute("disabled")).toBe(false);
  });

  it("로딩 원은 장식이다 — 버튼의 aria-busy 가 알린다", () => {
    const btn = render(<Button loading>저장</Button>);
    const circle = btn.querySelector("[data-slot=progress-circle]")!;
    expect(circle).not.toBeNull();
    expect(circle.getAttribute("aria-hidden")).toBe("true");
    // 크기 · 색은 버튼이 정한다(--progress-size · --progress-range …)
    expect(circle.getAttribute("data-size")).toBe("inherit");
    expect(circle.getAttribute("data-tone")).toBe("inherit");
  });

  it("로딩이 아니면 로딩 원이 없고 누르면 불린다", () => {
    const onClick = vi.fn();
    const btn = render(<Button onClick={onClick}>저장</Button>);
    expect(btn.querySelector("[data-slot=progress-circle]")).toBeNull();
    expect(btn.hasAttribute("aria-busy")).toBe(false);
    act(() => btn.click());
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("비활성이면 누르지 않는다", () => {
    const onClick = vi.fn();
    const btn = render(
      <Button disabled onClick={onClick}>
        저장
      </Button>,
    );
    act(() => btn.click());
    expect(onClick).not.toHaveBeenCalled();
  });

  it("누르는 순간 축소 기준 길이를 재고, 부르는 쪽의 onPointerDown 도 부른다", () => {
    const onPointerDown = vi.fn();
    const btn = render(<Button onPointerDown={onPointerDown}>저장</Button>);
    act(() => {
      btn.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    });
    // jsdom 은 크기가 0 이라 바닥값 24 — max(높이, 폭 ÷ 4, 24)
    expect(btn.style.getPropertyValue("--press-basis")).toBe("24");
    expect(onPointerDown).toHaveBeenCalledTimes(1);
  });

  it("asChild 면 자식 요소가 버튼 모양을 받는다", () => {
    const el = render(
      <Button asChild variant="brandOutline">
        <a href="/expense">가계부</a>
      </Button>,
    );
    expect(el.tagName).toBe("A");
    expect(el.className).toContain("border-stroke-neutral-weak");
    expect(el.className).toContain("text-fg-brand");
  });

  it("가장자리 맞춤은 그 방향 가로 여백만 0 — 크기의 여백보다 뒤에 남는다", () => {
    const btn = render(
      <Button variant="ghost" flush="left">
        더 보기
      </Button>,
    );
    // px-x4 는 남고 pl-0 이 뒤에서 왼쪽만 덮는다
    expect(btn.className).toContain("px-x4");
    expect(btn.className.indexOf("pl-0")).toBeGreaterThan(
      btn.className.indexOf("px-x4"),
    );
  });
});
