// Menu Sheet 의 동작 — 모양 · 색은 scripts/check-ds-spec.mjs 가 크로미움에서 스펙 값과 맞춘다.
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  MenuSheet,
  MenuSheetContent,
  MenuSheetGroup,
  MenuSheetItem,
  MenuSheetTrigger,
} from "./menu-sheet";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  if (!globalThis.ResizeObserver) {
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
  // vaul 이 누른 자리에 포인터를 붙잡아 둔다 — jsdom 에는 없다
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = () => {};
    Element.prototype.releasePointerCapture = () => {};
  }
  window.history.replaceState(null, "");
  // 1280 미만 — jsdom 에는 matchMedia 가 없다
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  act(() => root.unmount());
  container.remove();
  document.body.removeAttribute("style");
  await new Promise((r) => setTimeout(r, 100));
});

const render = (node: ReactNode) => act(() => root.render(node));
const tick = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
// vaul 이 넣은 CSS 의 내려가는 모션을 jsdom 은 끝내지 않는다 — 모션이 끝났다고 알려 준다
const settle = () =>
  act(async () => {
    for (const el of document.querySelectorAll<HTMLElement>(
      "[data-state=closed]",
    )) {
      const e = new Event("animationend", { bubbles: true });
      Object.assign(e, { animationName: getComputedStyle(el).animationName });
      el.dispatchEvent(e);
    }
    await new Promise((r) => setTimeout(r, 0));
  });

const sheet = () =>
  document.querySelector<HTMLElement>("[data-slot=menu-sheet-content]");
const items = () =>
  Array.from(
    document.querySelectorAll<HTMLButtonElement>("[data-slot=menu-sheet-item]"),
  );
const item = (name: string) =>
  items().find((b) => b.textContent?.includes(name));
const trigger = () =>
  document.querySelector<HTMLButtonElement>("[data-slot=menu-sheet-trigger]")!;
const closeButton = () =>
  document.querySelector<HTMLButtonElement>("[data-slot=menu-sheet-close]");

const click = (el: Element) =>
  act(async () => {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 0));
  });

function Basic({
  onSelect = () => {},
  onOpenChange,
  defaultOpen = true,
  layout,
  title = "주간 회의 메모",
}: {
  onSelect?: () => void;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
  layout?: "textWithIcon" | "textOnly";
  title?: string;
}) {
  return (
    <MenuSheet defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      <MenuSheetTrigger aria-label="주간 회의 메모 더보기">⋮</MenuSheetTrigger>
      <MenuSheetContent title={title} layout={layout}>
        <MenuSheetGroup>
          <MenuSheetItem
            icon={<svg data-testid="icon" />}
            label="수정"
            description="내용을 고쳐요."
            onSelect={onSelect}
          />
          <MenuSheetItem label="옮기기" disabled onSelect={onSelect} />
        </MenuSheetGroup>
        <MenuSheetGroup>
          <MenuSheetItem label="삭제" tone="critical" onSelect={onSelect} />
        </MenuSheetGroup>
      </MenuSheetContent>
    </MenuSheet>
  );
}

describe("구조 · 접근성", () => {
  it("시트는 dialog + aria-modal, 제목 · 설명이 이름이 된다", async () => {
    render(
      <MenuSheet defaultOpen>
        <MenuSheetTrigger>⋮</MenuSheetTrigger>
        <MenuSheetContent title="주간 회의 메모" description="할 수 있는 일">
          <MenuSheetGroup>
            <MenuSheetItem label="수정" />
          </MenuSheetGroup>
        </MenuSheetContent>
      </MenuSheet>,
    );
    await tick();
    const el = sheet()!;
    expect(el.getAttribute("role")).toBe("dialog");
    expect(el.getAttribute("aria-modal")).toBe("true");
    const title = document.querySelector("[data-slot=menu-sheet-title]")!;
    expect(el.getAttribute("aria-labelledby")).toBe(title.id);
    expect(title.textContent).toBe("주간 회의 메모");
    const desc = document.querySelector("[data-slot=menu-sheet-description]")!;
    expect(el.getAttribute("aria-describedby")).toBe(desc.id);
  });

  it("제목이 없으면 aria-label, 그것도 없으면 트리거의 이름이 숨은 제목이 된다", async () => {
    render(
      <MenuSheet defaultOpen>
        <MenuSheetTrigger aria-label="메모 더보기">⋮</MenuSheetTrigger>
        <MenuSheetContent>
          <MenuSheetGroup>
            <MenuSheetItem label="수정" />
          </MenuSheetGroup>
        </MenuSheetContent>
      </MenuSheet>,
    );
    await tick();
    const hidden = sheet()!.querySelector(".sr-only");
    expect(hidden?.textContent).toBe("메모 더보기");
    expect(document.querySelector("[data-slot=menu-sheet-header]")).toBeNull();
  });

  it("설명이 없으면 aria-describedby 를 달지 않는다", async () => {
    render(<Basic />);
    await tick();
    expect(sheet()!.hasAttribute("aria-describedby")).toBe(false);
  });

  it("트리거에 aria-haspopup=dialog · aria-expanded", async () => {
    render(<Basic defaultOpen={false} />);
    expect(trigger().getAttribute("aria-haspopup")).toBe("dialog");
    expect(trigger().getAttribute("aria-expanded")).toBe("false");
    await click(trigger());
    await tick();
    expect(trigger().getAttribute("aria-expanded")).toBe("true");
  });

  it("줄은 button[type=button], 막히면 disabled · 아이콘은 보조 기술에서 숨긴다", async () => {
    render(<Basic />);
    await tick();
    expect(item("수정")!.type).toBe("button");
    expect(item("옮기기")!.disabled).toBe(true);
    const icon = document.querySelector("[data-slot=menu-sheet-item-icon]")!;
    expect(icon.getAttribute("aria-hidden")).toBe("true");
  });

  it("손잡이는 늘 있고 위 닫기 버튼은 없다", async () => {
    render(<Basic />);
    await tick();
    expect(
      document.querySelector("[data-slot=bottom-sheet-handle]"),
    ).not.toBeNull();
    expect(document.querySelector("[data-slot=bottom-sheet-close]")).toBeNull();
  });

  it("보조 기술용 닫기는 목록 뒤에 있고 화면에서는 숨겨진다(초점이 오면 보인다)", async () => {
    render(<Basic />);
    await tick();
    const close = closeButton()!;
    expect(close.textContent).toBe("닫기");
    expect(sheet()!.lastElementChild).toBe(close);
    // 평소에는 잘라 숨기고, 키보드 초점에서 폭 전체 버튼으로 — 클래스로 맞춘다
    expect(close.className).toContain("[clip-path:inset(50%)]");
    expect(close.className).toContain("focus-visible:[clip-path:none]");
    expect(close.className).toContain("focus-visible:min-h-[52px]");
    expect(close.className).toContain("focus-visible:outline-offset-2");
  });

  it("묶음 사이 10 · 묶음 상자 · 줄 사이 선(마지막 줄 제외)", async () => {
    render(<Basic />);
    await tick();
    expect(
      document.querySelector("[data-slot=menu-sheet-list]")!.className,
    ).toContain("gap-x2_5");
    const group = document.querySelector("[data-slot=menu-sheet-group]")!;
    expect(group.className).toContain("bg-bg-neutral-weak");
    expect(group.className).toContain("rounded-r4");
    const first = item("수정")!;
    expect(first.className).toContain("not-last:shadow-[inset_0_-1px_0_0_");
    // 시트의 위 모서리는 20(Bottom Sheet 24 를 덮는다) · 좌우는 화면 여백
    expect(sheet()!.className).toContain("rounded-t-r5");
    expect(sheet()!.className).not.toContain("rounded-t-r6");
    expect(sheet()!.className).toContain("px-global-gutter");
  });
});

describe("줄을 누르면", () => {
  it("시트를 닫고, 다 닫힌 뒤에 onSelect 를 부른다", async () => {
    const onSelect = vi.fn();
    const onOpenChange = vi.fn();
    render(<Basic onSelect={onSelect} onOpenChange={onOpenChange} />);
    await tick();
    await click(item("수정")!);
    expect(onOpenChange).toHaveBeenCalledWith(false);
    // 닫히는 동안에는 아직 실행하지 않는다 — 확인창이 시트와 겹치지 않게
    expect(onSelect).not.toHaveBeenCalled();
    await settle();
    await act(async () => {
      await new Promise((r) => setTimeout(r, 1100));
    });
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("막힌 줄은 실행하지 않고 닫히지도 않는다", async () => {
    const onSelect = vi.fn();
    const onOpenChange = vi.fn();
    render(<Basic onSelect={onSelect} onOpenChange={onOpenChange} />);
    await tick();
    await click(item("옮기기")!);
    expect(onSelect).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(sheet()).not.toBeNull();
  });

  it("누른 채 10px 넘게 끌었으면(끌어 닫기와 헷갈리지 않게) 실행하지 않는다", async () => {
    const onSelect = vi.fn();
    render(<Basic onSelect={onSelect} />);
    await tick();
    const el = item("수정")!;
    await act(async () => {
      el.dispatchEvent(
        new PointerEvent("pointerdown", {
          bubbles: true,
          clientX: 10,
          clientY: 10,
        }),
      );
      el.dispatchEvent(
        new MouseEvent("click", {
          bubbles: true,
          detail: 1,
          clientX: 10,
          clientY: 40,
        }),
      );
      await new Promise((r) => setTimeout(r, 1100));
    });
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("키보드(Enter · Space 는 button 의 click)로도 같은 길을 탄다", async () => {
    const onSelect = vi.fn();
    render(<Basic onSelect={onSelect} />);
    await tick();
    // detail 0 — 키보드로 눌린 click
    await act(async () => {
      item("수정")!.dispatchEvent(
        new MouseEvent("click", { bubbles: true, detail: 0 }),
      );
      await new Promise((r) => setTimeout(r, 0));
    });
    await settle();
    await act(async () => {
      await new Promise((r) => setTimeout(r, 1100));
    });
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("누르기 시작하면 줄 길이 기준(--press-basis)을 잰다 — max(높이, 폭 ÷ 4, 24)", async () => {
    render(<Basic />);
    await tick();
    const el = item("수정")!;
    await act(async () => {
      el.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    });
    // jsdom 은 크기가 0 이라 바닥값 24
    expect(el.style.getPropertyValue("--press-basis")).toBe("24");
  });

  it("보조 기술용 닫기를 누르면 닫는다", async () => {
    const onOpenChange = vi.fn();
    render(<Basic onOpenChange={onOpenChange} />);
    await tick();
    await click(closeButton()!);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("Esc 로 닫는다", async () => {
    const onOpenChange = vi.fn();
    render(<Basic onOpenChange={onOpenChange} />);
    await tick();
    await act(async () => {
      sheet()!.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

describe("톤 · 막힘 · 정렬", () => {
  it("critical 은 이름 · 아이콘만 빨갛고 올림 · 누름에서 한 단계 짙다(fg-critical-contrast)", async () => {
    render(<Basic />);
    await tick();
    const label = item("삭제")!.querySelector(
      "[data-slot=menu-sheet-item-label]",
    )!;
    expect(label.className).toContain("text-fg-critical");
    expect(label.className).toContain(
      "group-hover/menu-sheet-item:text-fg-critical-contrast",
    );
    expect(label.className).toContain(
      "group-active/menu-sheet-item:text-fg-critical-contrast",
    );
  });

  it("설명은 올림 · 누름에서 fg-neutral-muted 로(누름 바탕 위 4.5:1)", async () => {
    render(<Basic />);
    await tick();
    const desc = document.querySelector(
      "[data-slot=menu-sheet-item-description]",
    )!;
    expect(desc.className).toContain("text-fg-neutral-subtle");
    expect(desc.className).toContain(
      "group-hover/menu-sheet-item:text-fg-neutral-muted",
    );
    expect(desc.className).toContain(
      "group-active/menu-sheet-item:text-fg-neutral-muted",
    );
  });

  it("누르면 콘텐츠만 2px 거리 축소 — 모션 줄이기면 하지 않는다", async () => {
    render(<Basic />);
    await tick();
    const content = item("수정")!.querySelector(
      "[data-slot=menu-sheet-item-content]",
    )!;
    expect(content.className).toContain(
      "group-active/menu-sheet-item:[scale:calc(1-2/var(--press-basis))]",
    );
    expect(content.className).toContain(
      "motion-reduce:group-active/menu-sheet-item:[scale:1]",
    );
  });

  it("막힌 줄은 전용 색 · 올림 · 누름 바탕 없음 · not-allowed", async () => {
    render(<Basic />);
    await tick();
    const el = item("옮기기")!;
    expect(el.className).toContain("disabled:cursor-not-allowed");
    expect(el.className).not.toContain("hover:bg-bg-neutral-weak-pressed");
    expect(
      el.querySelector("[data-slot=menu-sheet-item-label]")!.className,
    ).toContain("text-fg-disabled");
    expect(
      el.querySelector("[data-slot=menu-sheet-item-content]")!.className,
    ).not.toContain("group-active");
  });

  it("textOnly 는 이름을 가운데에 두고 아이콘 · 설명을 그리지 않는다", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<Basic layout="textOnly" />);
    await tick();
    expect(sheet()!.getAttribute("data-layout")).toBe("textOnly");
    expect(
      document.querySelector("[data-slot=menu-sheet-item-icon]"),
    ).toBeNull();
    expect(
      document.querySelector("[data-slot=menu-sheet-item-description]"),
    ).toBeNull();
    expect(
      item("수정")!.querySelector("[data-slot=menu-sheet-item-content]")!
        .className,
    ).toContain("justify-center");
    // 넘겨 받은 아이콘 · 설명은 개발 중에 알린다
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe("경계", () => {
  it("긴 이름은 말줄임 없이 단어 단위로 줄을 바꾼다", async () => {
    render(
      <MenuSheet defaultOpen>
        <MenuSheetTrigger aria-label="더보기">⋮</MenuSheetTrigger>
        <MenuSheetContent title="아주 긴 제목이 들어가도 줄을 바꿀 뿐 잘리지 않는다">
          <MenuSheetGroup>
            <MenuSheetItem label="아주 긴 동작 이름이 들어가도 줄을 바꿀 뿐 말줄임 없이 다 보여요" />
          </MenuSheetGroup>
        </MenuSheetContent>
      </MenuSheet>,
    );
    await tick();
    const wrap = item("아주 긴")!.querySelector(
      "[data-slot=menu-sheet-item-label]",
    )!.parentElement!;
    expect(wrap.className).toContain("break-keep");
    expect(wrap.className).toContain("[overflow-wrap:break-word]");
    expect(sheet()!.innerHTML).not.toContain("truncate");
    expect(sheet()!.innerHTML).not.toContain("text-ellipsis");
  });

  it("줄이 없는 시트도 그려진다(빈 목록)", async () => {
    render(
      <MenuSheet defaultOpen>
        <MenuSheetTrigger aria-label="더보기">⋮</MenuSheetTrigger>
        <MenuSheetContent title="빈 메뉴">{null}</MenuSheetContent>
      </MenuSheet>,
    );
    await tick();
    expect(sheet()).not.toBeNull();
    expect(items()).toHaveLength(0);
  });

  it("제어하는 open 이면 값을 따른다", async () => {
    const view = (open: boolean) => (
      <MenuSheet open={open}>
        <MenuSheetTrigger aria-label="더보기">⋮</MenuSheetTrigger>
        <MenuSheetContent title="제어">
          <MenuSheetGroup>
            <MenuSheetItem label="수정" />
          </MenuSheetGroup>
        </MenuSheetContent>
      </MenuSheet>
    );
    render(view(false));
    await tick();
    expect(sheet()).toBeNull();
    render(view(true));
    await tick();
    expect(sheet()).not.toBeNull();
  });
});
