// Toggle 의 동작 — 모양 · 색은 scripts/check-ds-spec.mjs 가 크로미움에서 스펙 값과 맞춘다. 재지 못하는 값(44 영역 · 축소 · 전환)은
// 여기서 클래스로 본다(toggle.measure.mjs 머리).
import { act, useState, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Eye, EyeOff, Star } from "lucide-react";

import { Toggle } from "./toggle";

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
  return container.querySelector<HTMLButtonElement>("button")!;
}

describe("Toggle", () => {
  it("버튼 하나 — type=button · 고정 이름 · aria-pressed 로 켬을 알린다", () => {
    const button = render(<Toggle aria-label="관심 등록" icon={<Star />} />);
    expect(button.tagName).toBe("BUTTON");
    expect(button.type).toBe("button");
    expect(button.getAttribute("aria-label")).toBe("관심 등록");
    expect(button.getAttribute("aria-pressed")).toBe("false");
    act(() => button.click());
    expect(button.getAttribute("aria-pressed")).toBe("true");
    // 이름은 상태마다 바꾸지 않는다
    expect(button.getAttribute("aria-label")).toBe("관심 등록");
  });

  it("폼 안에서도 제출하지 않는다", () => {
    const submit = vi.fn((e: Event) => e.preventDefault());
    const button = render(
      <form onSubmit={(e) => submit(e.nativeEvent)}>
        <Toggle aria-label="관심 등록" icon={<Star />} />
      </form>,
    );
    act(() => button.click());
    expect(submit).not.toHaveBeenCalled();
  });

  it("누르면 바로 바뀌고 onPressedChange(boolean) 를 부른다 — 다시 누르면 끈다", () => {
    const onPressedChange = vi.fn();
    const button = render(
      <Toggle
        aria-label="메모 고정"
        icon={<Star />}
        defaultPressed
        onPressedChange={onPressedChange}
      />,
    );
    expect(button.getAttribute("aria-pressed")).toBe("true");
    act(() => button.click());
    expect(onPressedChange).toHaveBeenLastCalledWith(false);
    expect(button.getAttribute("aria-pressed")).toBe("false");
    act(() => button.click());
    expect(onPressedChange).toHaveBeenLastCalledWith(true);
  });

  it("제어 — 밖에서 쥔 값을 따른다, 요청을 기다리지 않고 막지 않는다", () => {
    const Controlled = () => {
      const [pinned, setPinned] = useState(false);
      return (
        <Toggle
          aria-label="메모 고정"
          icon={<Star />}
          pressed={pinned}
          onPressedChange={setPinned}
        />
      );
    };
    const button = render(<Controlled />);
    act(() => button.click());
    expect(button.getAttribute("aria-pressed")).toBe("true");
    expect(button.disabled).toBe(false);
    act(() => button.click());
    expect(button.getAttribute("aria-pressed")).toBe("false");
  });

  it("값을 받기만 하는 제어는 부모가 바꾸기 전까지 그대로다", () => {
    const onPressedChange = vi.fn();
    const button = render(
      <Toggle
        aria-label="메모 고정"
        icon={<Star />}
        pressed={false}
        onPressedChange={onPressedChange}
      />,
    );
    act(() => button.click());
    expect(onPressedChange).toHaveBeenCalledWith(true);
    expect(button.getAttribute("aria-pressed")).toBe("false");
  });

  it("아이콘은 지금 상태를 그린다 — pressedIcon 이 있으면 켬에서 바꾸고, 없으면 같은 아이콘(모으기 단추)", () => {
    const eye = render(
      <Toggle
        aria-label="금액 가리기"
        icon={<Eye data-testid="eye" />}
        pressedIcon={<EyeOff data-testid="eye-off" />}
      />,
    );
    expect(container.querySelector("[data-testid=eye]")).not.toBeNull();
    act(() => eye.click());
    expect(container.querySelector("[data-testid=eye]")).toBeNull();
    expect(container.querySelector("[data-testid=eye-off]")).not.toBeNull();

    act(() =>
      root.render(
        <Toggle aria-label="관심 등록" icon={<Star data-testid="star" />} />,
      ),
    );
    const star = container.querySelector("button")!;
    expect(container.querySelector("[data-testid=star]")).not.toBeNull();
    act(() => star.click());
    expect(container.querySelector("[data-testid=star]")).not.toBeNull();
  });

  it("아이콘은 장식이다(aria-hidden) — 이름은 aria-label 뿐이다", () => {
    const button = render(<Toggle aria-label="관심 등록" icon={<Star />} />);
    expect(
      button
        .querySelector("[data-slot=toggle-icon]")!
        .getAttribute("aria-hidden"),
    ).toBe("true");
    expect(button.textContent).toBe("");
  });

  it("막히면 누를 수 없다 — 진짜 disabled(Tab 순서에서 빠진다), 켬의 선 2.5 는 그대로", () => {
    const onPressedChange = vi.fn();
    const button = render(
      <Toggle
        aria-label="관심 등록"
        icon={<Star />}
        pressed
        disabled
        onPressedChange={onPressedChange}
      />,
    );
    expect(button.disabled).toBe(true);
    act(() => button.click());
    expect(onPressedChange).not.toHaveBeenCalled();
    expect(button.getAttribute("aria-pressed")).toBe("true");
    expect(button.className).toContain("disabled:text-fg-disabled");
    expect(button.className).toContain(
      "aria-pressed:[&_svg]:[stroke-width:2.5]",
    );
  });

  it("감싼 쪽의 onClick 이 먼저 불리고 preventDefault 하면 켜고 끄지 않는다 — ref 는 단추로 간다", () => {
    const ref = { current: null as HTMLButtonElement | null };
    const onPressedChange = vi.fn();
    const button = render(
      <Toggle
        ref={ref}
        aria-label="관심 등록"
        icon={<Star />}
        onClick={(e) => e.preventDefault()}
        onPressedChange={onPressedChange}
      />,
    );
    expect(ref.current).toBe(button);
    act(() => button.click());
    expect(onPressedChange).not.toHaveBeenCalled();
    expect(button.getAttribute("aria-pressed")).toBe("false");
  });

  it("진짜 버튼이라 Tab 순서에 서고 Space · Enter 는 브라우저가 click 으로 잇는다 — 막히면 Tab 에서 빠진다", () => {
    const button = render(
      <>
        <Toggle aria-label="관심 등록" icon={<Star />} />
        <Toggle aria-label="메모 고정" icon={<Star />} disabled />
      </>,
    );
    const [on, off] = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button"),
    );
    expect(button).toBe(on);
    expect(on!.tabIndex).toBe(0);
    // 막힌 단추는 진짜 disabled — 포커스를 받지 못한다(aria-disabled 로 포커스를 남기지 않는다)
    expect(off!.disabled).toBe(true);
    expect(off!.hasAttribute("aria-disabled")).toBe(false);
    off!.focus();
    expect(document.activeElement).not.toBe(off);
  });

  it("스펙의 모양 규칙을 클래스로 건다 — 보이는 40 · 모서리 8 · 44 영역 · 아이콘 20 · 선 2 / 2.5 · 축소 · 링 2px · 띄움 2px", () => {
    const button = render(<Toggle aria-label="관심 등록" icon={<Star />} />);
    const cls = button.className;
    expect(cls).toContain("size-[40px]");
    expect(cls).toContain("rounded-r2");
    expect(cls).toContain("bg-transparent");
    expect(cls).toContain("before:size-[44px]");
    expect(cls).toContain("[&_svg]:size-[20px]");
    expect(cls).toContain("[&_svg]:[stroke-width:2]");
    expect(cls).toContain("aria-pressed:[&_svg]:[stroke-width:2.5]");
    expect(cls).toContain("active:[scale:calc(1-2/var(--press-basis))]");
    expect(cls).toContain("[--press-basis:40]");
    expect(cls).toContain("motion-reduce:active:[scale:1]");
    expect(cls).toContain("focus-visible:outline-2");
    expect(cls).toContain("focus-visible:outline-offset-2");
    // 끔은 흐린 색, 켬은 진한 색 — 켬 · 끔에 따라 바탕은 바뀌지 않는다(호버 · 누름에만 칠한다)
    expect(cls).toContain("text-fg-neutral-muted");
    expect(cls).toContain("enabled:aria-pressed:text-fg-neutral");
    expect(cls).toContain("hover:bg-bg-layer-default-pressed");
    expect(cls).not.toContain("aria-pressed:bg-");
    // 켬 · 끔 아이콘은 전환 없이 바로 — 전환은 바탕 · 축소뿐이다
    expect(cls).not.toContain("transition-colors");
    expect(cls).not.toContain("stroke-width_");
  });

  it("브랜드 채움 위(inverted)는 켬 · 끔 모두 흰 아이콘 · 바탕 없음(축소만) · 링도 흰색", () => {
    const button = render(
      <Toggle
        tone="inverted"
        aria-label="금액 가리기"
        icon={<Eye />}
        pressedIcon={<EyeOff />}
      />,
    );
    expect(button.getAttribute("data-tone")).toBe("inverted");
    const cls = button.className;
    expect(cls).toContain("text-static-white");
    expect(cls).toContain("focus-visible:outline-static-white");
    expect(cls).not.toContain("hover:bg-bg-layer-default-pressed");
    expect(cls).not.toContain("aria-pressed:text-fg-neutral");
  });
});
