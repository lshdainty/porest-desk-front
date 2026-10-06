// Help Bubble 의 동작 — 모양 · 색은 scripts/check-ds-spec.mjs 가 크로미움에서 스펙 값과 맞춘다.
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  HelpBubble,
  HelpBubbleAnchor,
  HelpBubbleContent,
  HelpBubbleTrigger,
} from "./help-bubble";
import { BUBBLE_POSITION } from "./help-bubble-variants";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  // jsdom 에 없다 — Radix 가 화살표 크기를 잴 때 쓴다
  if (!globalThis.ResizeObserver) {
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
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
}

// Radix 는 닫힌 뒤 초점 되돌리기 · 바깥 누르기 듣기를 다음 틱에 한다
const tick = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });

const LEAVE = {
  title: "연차 사용 규정",
  description:
    "입사 1년 미만은 한 달에 1일씩 생기고, 1년이 지나면 15일이 생겨요.",
};

const trigger = () =>
  document.querySelector<HTMLButtonElement>("[data-slot=help-bubble-trigger]")!;
const bubble = () =>
  document.querySelector<HTMLElement>("[data-slot=help-bubble-content]");
const closeButton = () =>
  document.querySelector<HTMLButtonElement>("[data-slot=help-bubble-close]");

function key(el: Element, k: string, init: KeyboardEventInit = {}) {
  act(() => {
    el.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: k,
        bubbles: true,
        cancelable: true,
        ...init,
      }),
    );
  });
}

function Info({
  showCloseButton,
  closeOnInteractOutside,
  description = LEAVE.description,
  onOpenChange,
}: {
  showCloseButton?: boolean;
  closeOnInteractOutside?: boolean;
  /** null 이면 설명 없이 */
  description?: string | null;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <>
      <HelpBubble onOpenChange={onOpenChange}>
        <HelpBubbleTrigger aria-label="연차 사용 규정 안내">
          ⓘ
        </HelpBubbleTrigger>
        <HelpBubbleContent
          title={LEAVE.title}
          description={description}
          showCloseButton={showCloseButton}
          closeOnInteractOutside={closeOnInteractOutside}
        />
      </HelpBubble>
      <button type="button" data-testid="outside">
        다음 칸
      </button>
    </>
  );
}

function open() {
  act(() => {
    trigger().focus();
    trigger().click();
  });
}

// 스펙 값(생성물 — 읽기만 한다). 검사기가 CSS 로 잴 수 없는 자리 계산(Radix)의 수치를 여기서 맞춘다
type SpecJson = {
  rules: {
    when: Record<string, string>;
    enabled?: Record<string, Record<string, unknown>>;
  }[];
};
const SPEC = Object.values(
  import.meta.glob<SpecJson>("../spec/help-bubble.json", {
    eager: true,
    import: "default",
  }),
)[0]!;

describe("HelpBubble", () => {
  it("자리 계산은 스펙 값 — 화살표 끝 ↔ 트리거 4 · 화면 가장자리 16 · 화살표 ↔ 말풍선 모서리 14", () => {
    const base = SPEC.rules.find(
      (r) => Object.keys(r.when).length === 0,
    )!.enabled!;
    expect(BUBBLE_POSITION.sideOffset).toBe(base.root?.offset);
    expect(BUBBLE_POSITION.collisionPadding).toBe(base.root?.margin);
    expect(BUBBLE_POSITION.arrowPadding).toBe(base.arrow?.margin);
  });

  it("닫혀 있으면 트리거는 팝업을 알리기만 한다 — aria-controls 는 열린 동안만", () => {
    render(<Info />);
    expect(trigger().getAttribute("aria-haspopup")).toBe("dialog");
    expect(trigger().getAttribute("aria-expanded")).toBe("false");
    expect(trigger().hasAttribute("aria-controls")).toBe(false);
    expect(bubble()).toBeNull();
  });

  it("누르면 열고 초점은 트리거에 남는다 — 말풍선은 dialog, 제목 · 설명으로 이름과 설명", () => {
    render(<Info />);
    open();
    const el = bubble()!;
    expect(el.getAttribute("role")).toBe("dialog");
    expect(el.hasAttribute("aria-modal")).toBe(false);
    expect(
      document.getElementById(el.getAttribute("aria-labelledby")!)?.textContent,
    ).toBe(LEAVE.title);
    expect(
      document.getElementById(el.getAttribute("aria-describedby")!)
        ?.textContent,
    ).toBe(LEAVE.description);
    expect(trigger().getAttribute("aria-expanded")).toBe("true");
    expect(trigger().getAttribute("aria-controls")).toBe(el.id);
    expect(document.activeElement).toBe(trigger());
    // 화살표는 장식, 기본 자리는 트리거 위
    expect(
      el
        .querySelector("[data-slot=help-bubble-arrow]")
        ?.getAttribute("aria-hidden"),
    ).toBe("true");
    expect(el.dataset.side).toBe("top");
  });

  it("다시 누르면 닫는다", () => {
    render(<Info />);
    open();
    act(() => trigger().click());
    expect(bubble()).toBeNull();
    expect(trigger().getAttribute("aria-expanded")).toBe("false");
  });

  it("설명이 없으면 aria-describedby 를 달지 않는다", () => {
    render(<Info description={null} />);
    open();
    expect(bubble()!.hasAttribute("aria-describedby")).toBe(false);
    expect(
      bubble()!.querySelector("[data-slot=help-bubble-description]"),
    ).toBeNull();
  });

  it("열린 동안 트리거에서 Tab — 말풍선으로 들어가고, 다시 Tab 이면 닫고 초점은 트리거로", () => {
    const onOpenChange = vi.fn();
    render(<Info onOpenChange={onOpenChange} />);
    open();
    key(trigger(), "Tab");
    expect(document.activeElement).toBe(bubble());
    key(bubble()!, "Tab");
    expect(bubble()).toBeNull();
    expect(document.activeElement).toBe(trigger());
    // 닫기를 거듭 청해도(우리 Tab · Radix 의 바깥 초점) 한 번만 알린다
    expect(onOpenChange.mock.calls).toEqual([[true], [false]]);
  });

  it("Shift+Tab 은 말풍선에서 트리거로 — 말풍선은 열린 채", () => {
    render(<Info />);
    open();
    key(trigger(), "Tab");
    key(bubble()!, "Tab", { shiftKey: true });
    expect(document.activeElement).toBe(trigger());
    expect(bubble()).not.toBeNull();
  });

  it("닫기 버튼이 있으면 Tab 은 닫기 버튼으로 — 누르면 닫고 초점은 트리거로", async () => {
    render(<Info showCloseButton />);
    open();
    expect(closeButton()!.getAttribute("aria-label")).toBe("닫기");
    key(trigger(), "Tab");
    expect(document.activeElement).toBe(closeButton());
    act(() => closeButton()!.click());
    await tick();
    expect(bubble()).toBeNull();
    expect(document.activeElement).toBe(trigger());
  });

  it("Esc 는 닫고, 초점이 말풍선 안에 있었으면 트리거로 돌려준다", async () => {
    render(<Info />);
    open();
    key(trigger(), "Tab");
    key(bubble()!, "Escape");
    await tick();
    expect(bubble()).toBeNull();
    expect(document.activeElement).toBe(trigger());
  });

  it("바깥을 누르면 닫는다", async () => {
    render(<Info />);
    open();
    await tick();
    act(() => {
      document
        .querySelector("[data-testid=outside]")!
        .dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    });
    expect(bubble()).toBeNull();
  });

  it("closeOnInteractOutside={false} 면 바깥 누르기 · 바깥 초점에 닫지 않는다 — 닫기 버튼으로 닫는다", async () => {
    render(<Info showCloseButton closeOnInteractOutside={false} />);
    open();
    await tick();
    const outside = document.querySelector<HTMLElement>(
      "[data-testid=outside]",
    )!;
    act(() => {
      outside.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
      outside.focus();
    });
    expect(bubble()).not.toBeNull();
    act(() => closeButton()!.click());
    expect(bubble()).toBeNull();
  });

  it("처음부터 열어 둘 수 있다 — 초점은 옮기지 않는다", () => {
    render(
      <HelpBubble defaultOpen>
        <HelpBubbleTrigger aria-label="금액 가리기 안내">ⓘ</HelpBubbleTrigger>
        <HelpBubbleContent title="금액을 가릴 수 있어요" showCloseButton />
      </HelpBubble>,
    );
    expect(bubble()).not.toBeNull();
    expect(document.activeElement).toBe(document.body);
  });

  it("제어하는 open — 닫기 버튼은 onOpenChange(false) 만 부르고 여닫음은 쓰는 쪽이 정한다", () => {
    const onOpenChange = vi.fn();
    render(
      <HelpBubble open onOpenChange={onOpenChange}>
        <HelpBubbleTrigger aria-label="금액 가리기 안내">ⓘ</HelpBubbleTrigger>
        <HelpBubbleContent title="금액을 가릴 수 있어요" showCloseButton />
      </HelpBubble>,
    );
    act(() => closeButton()!.click());
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(bubble()).not.toBeNull();
  });

  it("기준(Anchor)은 자리만 잡는다 — 팝업 ARIA 없이, 남겨 둘 안내는 기준에 초점이 와도 열린 채 Tab 은 말풍선으로", () => {
    render(
      <HelpBubble defaultOpen>
        <HelpBubbleAnchor asChild>
          <button type="button" aria-label="금액 가리기">
            눈
          </button>
        </HelpBubbleAnchor>
        <HelpBubbleContent
          title="금액을 가릴 수 있어요"
          description="누르면 화면의 금액이 모두 가려져요."
          showCloseButton
          closeOnInteractOutside={false}
          side="bottom"
        />
      </HelpBubble>,
    );
    const anchor = document.querySelector<HTMLButtonElement>(
      "[data-slot=help-bubble-anchor]",
    )!;
    expect(anchor.hasAttribute("aria-haspopup")).toBe(false);
    expect(anchor.hasAttribute("aria-expanded")).toBe(false);
    act(() => anchor.focus());
    expect(bubble()!.dataset.side).toBe("bottom");
    key(anchor, "Tab");
    expect(document.activeElement).toBe(closeButton());
  });

  it("띄울 자리(container)를 주면 그 안에 띄운다", () => {
    const place = document.createElement("div");
    document.body.appendChild(place);
    render(
      <HelpBubble defaultOpen>
        <HelpBubbleTrigger aria-label="연차 사용 규정 안내">
          ⓘ
        </HelpBubbleTrigger>
        <HelpBubbleContent container={place} title={LEAVE.title} />
      </HelpBubble>,
    );
    expect(place.contains(bubble())).toBe(true);
    act(() => root.render(null));
    place.remove();
  });
});
