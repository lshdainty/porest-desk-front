// Tabs 의 동작 — 모양 · 색은 scripts/check-ds-spec.mjs 가 크로미움에서 스펙 값과 맞춘다. 재지 못하는 값(안쪽 1px 구획 선 · 막대 들임 ·
// 축소 · 시간 · 밀어 넘기기 · 흐림)은 여기서 클래스 · 속성 · 가짜 포인터로 본다(tabs.measure.mjs · chip-tabs.measure.mjs 머리).
import { act, useState, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ChipTabsList,
  ChipTabsTrigger,
  Tabs,
  TabsContent,
  TabsList,
  TabsSwipeArea,
  TabsTrigger,
} from "./tabs";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  // 가로 스크롤 줄의 끝 흐림이 토큰을 못 읽는다는 경고 — jsdom 은 토큰 CSS 를 읽지 않는다
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

function render(node: ReactNode) {
  act(() => root.render(node));
  return container.firstElementChild as HTMLElement;
}

const tabs = () =>
  Array.from(container.querySelectorAll<HTMLButtonElement>("[role=tab]"));
const tab = (name: string) =>
  tabs().find((t) => t.textContent?.startsWith(name))!;
const panels = () =>
  Array.from(container.querySelectorAll<HTMLElement>("[role=tabpanel]"));
const bar = () =>
  container.querySelector<HTMLElement>("[data-slot=tabs-indicator]")!;
const key = (el: Element, k: string, type: "keydown" | "keyup" = "keydown") =>
  el.dispatchEvent(new KeyboardEvent(type, { key: k, bubbles: true }));

const Stats = (props: {
  defaultValue?: string;
  value?: string;
  onValueChange?: (v: string) => void;
  disabledTrend?: boolean;
  notification?: boolean;
  layout?: "fill" | "hug";
  size?: "small" | "medium";
}) => (
  <Tabs
    defaultValue={props.defaultValue}
    value={props.value}
    onValueChange={props.onValueChange}
  >
    <TabsList aria-label="통계" layout={props.layout} size={props.size}>
      <TabsTrigger value="category">카테고리</TabsTrigger>
      <TabsTrigger
        value="trend"
        disabled={props.disabledTrend}
        notification={props.notification}
      >
        추이
      </TabsTrigger>
      <TabsTrigger value="compare">비교</TabsTrigger>
    </TabsList>
    <TabsContent value="category">카테고리 내용</TabsContent>
    <TabsContent value="trend">추이 내용</TabsContent>
    <TabsContent value="compare">비교 내용</TabsContent>
  </Tabs>
);

describe("Tabs (Line)", () => {
  it("목록은 tablist + 이름, 탭은 tab · aria-selected · aria-controls, 내용 칸은 tabpanel · aria-labelledby", () => {
    render(<Stats defaultValue="trend" />);
    const list = container.querySelector("[role=tablist]")!;
    expect(list.getAttribute("aria-label")).toBe("통계");
    expect(tabs().map((t) => t.getAttribute("aria-selected"))).toEqual([
      "false",
      "true",
      "false",
    ]);
    for (const t of tabs()) {
      const panel = document.getElementById(t.getAttribute("aria-controls")!)!;
      expect(panel.getAttribute("role")).toBe("tabpanel");
      expect(panel.getAttribute("aria-labelledby")).toBe(t.id);
    }
  });

  it("고른 탭만 Tab 이 선다(tabIndex 0) · 내용 칸은 tabIndex 0", () => {
    render(<Stats defaultValue="trend" />);
    expect(tabs().map((t) => t.tabIndex)).toEqual([-1, 0, -1]);
    expect(panels().every((p) => p.tabIndex === 0)).toBe(true);
  });

  it("누르면 고르고 내용 칸을 바로 바꾼다 — 고르지 않은 칸은 그려 둔 채 숨긴다(hidden 클래스 — 입력 · 스크롤이 남는다)", () => {
    const onValueChange = vi.fn();
    render(<Stats defaultValue="category" onValueChange={onValueChange} />);
    expect(panels()).toHaveLength(3);
    expect(
      panels().every((p) =>
        p.className.includes("data-[state=inactive]:hidden"),
      ),
    ).toBe(true);
    expect(panels().map((p) => p.getAttribute("data-state"))).toEqual([
      "active",
      "inactive",
      "inactive",
    ]);
    act(() => tab("추이").click());
    expect(onValueChange).toHaveBeenLastCalledWith("trend");
    expect(tab("추이").getAttribute("aria-selected")).toBe("true");
    expect(panels().map((p) => p.getAttribute("data-state"))).toEqual([
      "inactive",
      "active",
      "inactive",
    ]);
    expect(tabs().map((t) => t.tabIndex)).toEqual([-1, 0, -1]);
  });

  it("누르는 동안에는 고르지 않는다 — 손을 뗄 때(click) 고른다(누르면 축소만, 색은 그대로)", () => {
    const onValueChange = vi.fn();
    render(<Stats defaultValue="category" onValueChange={onValueChange} />);
    const down = new MouseEvent("mousedown", {
      bubbles: true,
      cancelable: true,
      button: 0,
    });
    act(() => {
      tab("추이").dispatchEvent(down);
    });
    // 누르는 순간의 포커스 · 고르기를 막는다
    expect(down.defaultPrevented).toBe(true);
    expect(onValueChange).not.toHaveBeenCalled();
    expect(tab("추이").getAttribute("aria-selected")).toBe("false");
    act(() => tab("추이").click());
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenLastCalledWith("trend");
    expect(tab("추이").getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(tab("추이"));
  });

  it("값을 밖에서 쥐면 그 값을 따른다 — Tab 이 서는 탭도 따라간다", () => {
    const Controlled = () => {
      const [value, setValue] = useState("category");
      return (
        <>
          <Stats value={value} onValueChange={setValue} />
          <button
            type="button"
            data-testid="go"
            onClick={() => setValue("compare")}
          >
            비교로
          </button>
        </>
      );
    };
    render(<Controlled />);
    act(() =>
      container.querySelector<HTMLButtonElement>("[data-testid=go]")!.click(),
    );
    expect(tab("비교").getAttribute("aria-selected")).toBe("true");
    expect(tabs().map((t) => t.tabIndex)).toEqual([-1, -1, 0]);
    expect(panels().map((p) => p.getAttribute("data-state"))).toEqual([
      "inactive",
      "inactive",
      "active",
    ]);
  });

  it("화살표로 옮기면 바로 고른다 — 막힌 탭은 건너뛰고 끝에서 처음으로 돈다, Home · End 는 첫 · 마지막", () => {
    vi.useFakeTimers();
    const onValueChange = vi.fn();
    render(
      <Stats
        defaultValue="category"
        onValueChange={onValueChange}
        disabledTrend
      />,
    );
    act(() => tab("카테고리").focus());
    act(() => {
      key(tab("카테고리"), "ArrowRight");
      vi.runAllTimers();
    });
    // 막힌 "추이" 를 건너뛴다
    expect(document.activeElement).toBe(tab("비교"));
    expect(onValueChange).toHaveBeenLastCalledWith("compare");
    act(() => {
      key(tab("비교"), "ArrowRight", "keyup");
      key(tab("비교"), "ArrowRight");
      vi.runAllTimers();
    });
    expect(document.activeElement).toBe(tab("카테고리"));
    expect(tab("카테고리").getAttribute("aria-selected")).toBe("true");
    act(() => {
      key(tab("카테고리"), "ArrowRight", "keyup");
      key(tab("카테고리"), "End");
      vi.runAllTimers();
    });
    expect(document.activeElement).toBe(tab("비교"));
    act(() => {
      key(tab("비교"), "End", "keyup");
      key(tab("비교"), "Home");
      vi.runAllTimers();
    });
    expect(document.activeElement).toBe(tab("카테고리"));
  });

  it("막힌 탭은 누를 수 없다 — fg-disabled · not-allowed · 축소 없음", () => {
    const onValueChange = vi.fn();
    render(
      <Stats
        defaultValue="category"
        onValueChange={onValueChange}
        disabledTrend
      />,
    );
    expect(tab("추이").disabled).toBe(true);
    act(() => tab("추이").click());
    expect(onValueChange).not.toHaveBeenCalled();
    expect(tab("추이").className).toContain("disabled:text-fg-disabled");
    expect(tab("추이").className).toContain("disabled:cursor-not-allowed");
    expect(tab("추이").className).toContain("disabled:[scale:1]");
  });

  it("알림 점은 안 고른 탭에만 — 보조 기술에는 “새 소식” 을 덧붙이고, 고르면 사라진다", () => {
    render(<Stats defaultValue="category" notification />);
    const trend = tab("추이");
    expect(
      trend
        .querySelector("[data-slot=tabs-notification]")!
        .getAttribute("aria-hidden"),
    ).toBe("true");
    expect(trend.textContent).toBe("추이새 소식");
    act(() => trend.click());
    expect(trend.querySelector("[data-slot=tabs-notification]")).toBeNull();
    expect(trend.textContent).toBe("추이");
  });

  it("알림 점이 둘 이상이거나 이름이 없거나 value 에 빈칸이 있으면 개발 중에 경고한다", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">가</TabsTrigger>
          <TabsTrigger value="b c" notification>
            나
          </TabsTrigger>
          <TabsTrigger value="d" notification>
            다
          </TabsTrigger>
        </TabsList>
      </Tabs>,
    );
    const text = warn.mock.calls.map((c) => String(c[0])).join("\n");
    expect(text).toContain("이름이 없다");
    expect(text).toContain("알림 점이 둘 이상");
    expect(text).toContain("빈칸이 있다");
  });

  it("막대는 목록에 하나 — 목록의 첫 자식(탭이 그 위에 그려진다) · 2px · 각진 모서리 · 고른 탭 아래에 놓인다", () => {
    render(<Stats defaultValue="trend" />);
    const list = container.querySelector("[role=tablist]")!;
    expect(list.firstElementChild).toBe(bar());
    expect(bar().getAttribute("aria-hidden")).toBe("true");
    expect(bar().className).toContain("h-0.5");
    expect(bar().className).toContain("rounded-none");
    expect(bar().className).toContain("bg-fg-neutral");
    // 200ms 로 left · width 만 미끄러진다(글자색은 전환 없이 바로)
    expect(bar().className).toContain(
      "[transition:left_var(--motion-duration-d4)_var(--motion-ease-easing),width_var(--motion-duration-d4)_var(--motion-ease-easing)]",
    );
    expect(bar().style.getPropertyValue("--tabs-indicator-left")).toBe("0px");
    // 고른 탭이 막히면(목록 전체 막힘) 막대도 fg-disabled
    expect(bar().className).toContain("bg-fg-disabled");
  });

  it("Fill 은 막대를 탭에서 좌우 16 들이고 Hug 는 들이지 않는다 · Hug 는 목록 좌우 16 · 넘치면 가로 스크롤", () => {
    render(<Stats defaultValue="trend" />);
    const fill = container.querySelector("[role=tablist]")!;
    expect(fill.className).toContain(
      "[--tabs-indicator-inset:var(--spacing-x4)]",
    );
    expect(fill.getAttribute("data-layout")).toBe("fill");
    expect(tab("추이").className).toContain("flex-1");

    act(() => root.render(<Stats defaultValue="trend" layout="hug" />));
    const hug = container.querySelector("[role=tablist]")!;
    expect(hug.className).toContain("[--tabs-indicator-inset:0px]");
    expect(hug.className).toContain("px-x4");
    expect(hug.className).toContain("scroll-px-x4");
    expect(hug.className).toContain("overflow-x-auto");
    expect(hug.className).toContain("[scrollbar-width:none]");
    expect(tab("추이").className).toContain("flex-none");
    // 글은 줄바꿈 · 말줄임하지 않는다
    expect(tab("추이").className).toContain("whitespace-nowrap");
  });

  it("크기 — small 40 · 글 14, medium 44 · 글 16, 탭의 위아래 · 좌우 10 · 글은 아래로 · 700", () => {
    render(<Stats defaultValue="trend" />);
    expect(container.querySelector("[role=tablist]")!.className).toContain(
      "min-h-[40px]",
    );
    expect(tab("추이").className).toContain("min-h-[40px]");
    expect(tab("추이").className).toContain("text-t4");
    act(() => root.render(<Stats defaultValue="trend" size="medium" />));
    expect(container.querySelector("[role=tablist]")!.className).toContain(
      "min-h-[44px]",
    );
    expect(tab("추이").className).toContain("min-h-[44px]");
    expect(tab("추이").className).toContain("text-t5");
    for (const cls of ["p-x2_5", "items-end", "font-bold"]) {
      expect(tab("추이").className).toContain(cls);
    }
  });

  it("목록은 불투명 바탕 + 안쪽 1px 구획 선(높이를 밀지 않는다) · 호버 모양이 없고 누름은 축소만(색은 그대로)", () => {
    render(<Stats defaultValue="trend" />);
    const list = container.querySelector("[role=tablist]")!.className;
    expect(list).toContain("bg-bg-layer-default");
    expect(list).toContain(
      "shadow-[inset_0_-1px_0_0_var(--color-stroke-neutral-subtle)]",
    );
    const cls = tab("추이").className;
    expect(cls).not.toContain("hover:");
    expect(cls).not.toContain("active:bg-");
    expect(cls).not.toContain("active:text-");
    expect(cls).toContain("active:[scale:calc(1-2/var(--press-basis))]");
    expect(cls).toContain("motion-reduce:active:[scale:1]");
    expect(cls).toContain("focus-visible:outline-2");
    // 포커스 링은 탭 안쪽(띄움 −2)이다
    expect(cls).toContain("focus-visible:-outline-offset-2");
  });

  it("누르는 순간 기준 길이를 --press-basis 로 넘긴다 — 포인터 · Space · Enter", () => {
    render(<Stats defaultValue="trend" />);
    const t = tab("추이");
    Object.defineProperty(t, "offsetHeight", { value: 40 });
    Object.defineProperty(t, "offsetWidth", { value: 200 });
    act(() => {
      t.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    });
    expect(t.style.getPropertyValue("--press-basis")).toBe("50");
    t.style.removeProperty("--press-basis");
    act(() => {
      key(t, "Enter");
    });
    expect(t.style.getPropertyValue("--press-basis")).toBe("50");
  });

  it("탭 8개 · 긴 글도 담는다 — Hug 가 넘치면 가로 스크롤", () => {
    render(
      <Tabs defaultValue="t0">
        <TabsList layout="hug" aria-label="많은 탭">
          {Array.from({ length: 8 }, (_, i) => (
            <TabsTrigger key={i} value={`t${i}`}>
              신한카드 마이 포인트 플러스 {i}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>,
    );
    expect(tabs()).toHaveLength(8);
    expect(tabs().every((t) => t.className.includes("whitespace-nowrap"))).toBe(
      true,
    );
  });

  it("Fill 목록이 넘치면 개발 중에 Hug 로 바꾸라고 경고한다", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const original = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      "scrollWidth",
    );
    Object.defineProperty(HTMLElement.prototype, "scrollWidth", {
      configurable: true,
      get: () => 500,
    });
    try {
      render(<Stats defaultValue="trend" />);
    } finally {
      if (original)
        Object.defineProperty(HTMLElement.prototype, "scrollWidth", original);
      else
        delete (HTMLElement.prototype as unknown as Record<string, unknown>)
          .scrollWidth;
    }
    expect(warn.mock.calls.map((c) => String(c[0])).join("\n")).toContain(
      "Fill 목록이 넘친다",
    );
  });
});

describe("Chip Tabs", () => {
  const Broker = ({
    variant,
    size,
  }: {
    variant?: "solid" | "outline";
    size?: "medium" | "large";
  }) => (
    <Tabs defaultValue="holding">
      <ChipTabsList variant={variant} size={size} aria-label="증권 보기">
        <ChipTabsTrigger value="holding">보유</ChipTabsTrigger>
        <ChipTabsTrigger value="watch" notification>
          관심
        </ChipTabsTrigger>
      </ChipTabsList>
      <TabsContent value="holding">보유 종목</TabsContent>
      <TabsContent value="watch">관심 종목</TabsContent>
    </Tabs>
  );

  it("탭 시맨틱이다 — 고른 칩에 data-selected, 고른 칩만 Tab 이 선다", () => {
    render(<Broker />);
    expect(
      container.querySelector("[role=tablist]")!.getAttribute("aria-label"),
    ).toBe("증권 보기");
    expect(tabs().map((t) => t.hasAttribute("data-selected"))).toEqual([
      true,
      false,
    ]);
    expect(tabs().map((t) => t.tabIndex)).toEqual([0, -1]);
    act(() => tab("관심").click());
    expect(tabs().map((t) => t.hasAttribute("data-selected"))).toEqual([
      false,
      true,
    ]);
    expect(panels().map((p) => p.getAttribute("data-state"))).toEqual([
      "inactive",
      "active",
    ]);
  });

  it("칩은 Chip 그대로다 — Solid 는 Chip Solid · Outline 은 Chip Outline Strong, medium 36 · large 40", () => {
    render(<Broker />);
    expect(tab("보유").className).toContain("bg-bg-neutral-weak");
    expect(tab("보유").className).toContain("h-9");
    act(() => root.render(<Broker variant="outline" size="large" />));
    expect(tab("보유").className).toContain("bg-transparent");
    expect(tab("보유").className).toContain("shadow-none");
    expect(tab("보유").className).toContain("h-10");
    expect(tab("보유").className).toContain("shrink-0");
  });

  it("목록은 한 줄 가로 스크롤 — 좌우 화면 여백 · 위아래 8 · 칩 사이 8 · 스크롤바 숨김 · 양 끝 흐림이 늘 켜져 있다", () => {
    render(<Broker />);
    const list = container.querySelector("[role=tablist]")!;
    expect(list.getAttribute("data-scroll-fog")).toBe("row");
    for (const cls of [
      "px-global-gutter",
      "py-x2",
      "gap-between-chips",
      "scroll-px-global-gutter",
      "overflow-x-auto",
      "flex-nowrap",
      "[scrollbar-width:none]",
    ]) {
      expect(list.className).toContain(cls);
    }
    // 바탕 · 바닥 선이 없다
    expect(list.className).not.toContain("bg-bg-layer-default");
    expect(list.className).not.toContain("shadow-");
  });

  it("알림 점은 글 뒤에 — 안 고른 칩에만 · “새 소식” 을 덧붙이고, 고르면 사라진다", () => {
    render(<Broker />);
    const watch = tab("관심");
    expect(
      watch.querySelector("[data-slot=chip-tabs-notification]"),
    ).not.toBeNull();
    expect(watch.textContent).toBe("관심새 소식");
    act(() => watch.click());
    expect(
      watch.querySelector("[data-slot=chip-tabs-notification]"),
    ).toBeNull();
  });

  it("칩 12개도 한 줄에 담는다 — 줄어들지 않는다", () => {
    render(
      <Tabs defaultValue="i0">
        <ChipTabsList aria-label="많은 칩">
          {Array.from({ length: 12 }, (_, i) => (
            <ChipTabsTrigger key={i} value={`i${i}`}>
              카테고리 {i}
            </ChipTabsTrigger>
          ))}
        </ChipTabsList>
      </Tabs>,
    );
    expect(tabs()).toHaveLength(12);
    expect(tabs().every((t) => t.className.includes("shrink-0"))).toBe(true);
  });
});

describe("TabsSwipeArea", () => {
  it("내용 칸 묶음 — 거친 포인터에서만 가로 끌기를 받는다(touch-action pan-y pinch-zoom)", () => {
    render(
      <Tabs defaultValue="category">
        <TabsList aria-label="통계">
          <TabsTrigger value="category">카테고리</TabsTrigger>
          <TabsTrigger value="trend">추이</TabsTrigger>
        </TabsList>
        <TabsSwipeArea>
          <TabsContent value="category">카테고리 내용</TabsContent>
          <TabsContent value="trend">추이 내용</TabsContent>
        </TabsSwipeArea>
      </Tabs>,
    );
    const area = container.querySelector("[data-slot=tabs-swipe-area]")!;
    expect(area.className).toContain(
      "pointer-coarse:[touch-action:pan-y_pinch-zoom]",
    );
    expect(area.className).toContain("data-[swiping]:overflow-clip");
    expect(area.querySelectorAll("[role=tabpanel]")).toHaveLength(2);
    // 탭 목록은 밀어 넘기기를 막는 표시를 스스로 단다(가로로 스크롤하는 칸에서 시작한 끌기는 넘기지 않는다)
    expect(
      container
        .querySelector("[role=tablist]")!
        .hasAttribute("data-tabs-prevent-swipe"),
    ).toBe(true);
  });

  it("손가락으로 칸 폭의 25% 넘게 끌고 떼면 이웃 탭으로 넘어간다 — 아래로 모자라면 제자리", () => {
    vi.useFakeTimers();
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: query === "(pointer: coarse)",
      media: query,
      addEventListener() {},
      removeEventListener() {},
    }));
    const onValueChange = vi.fn();
    render(
      <Tabs defaultValue="category" onValueChange={onValueChange}>
        <TabsList aria-label="통계">
          <TabsTrigger value="category">카테고리</TabsTrigger>
          <TabsTrigger value="trend">추이</TabsTrigger>
        </TabsList>
        <TabsSwipeArea>
          <TabsContent value="category">카테고리 내용</TabsContent>
          <TabsContent value="trend">추이 내용</TabsContent>
        </TabsSwipeArea>
      </Tabs>,
    );
    const area = container.querySelector<HTMLElement>(
      "[data-slot=tabs-swipe-area]",
    )!;
    Object.defineProperty(area, "clientWidth", { value: 300 });
    const fire = (type: string, clientX: number, timeStamp: number) =>
      act(() => {
        const e = new MouseEvent(type, { bubbles: true, clientX, clientY: 10 });
        Object.defineProperties(e, {
          pointerId: { value: 1 },
          isPrimary: { value: true },
          pointerType: { value: "touch" },
          timeStamp: { value: timeStamp },
        });
        (
          container.querySelector("[role=tabpanel]") as HTMLElement
        ).dispatchEvent(e);
      });

    // 모자라게 끌고 뗀다 — 제자리
    fire("pointerdown", 200, 0);
    fire("pointermove", 180, 400);
    fire("pointerup", 180, 800);
    act(() => void vi.runAllTimers());
    expect(onValueChange).not.toHaveBeenCalled();

    // 칸 폭 300 의 25% 인 75 보다 많이 끌고 뗀다 — 다음 탭
    fire("pointerdown", 250, 1000);
    fire("pointermove", 120, 1400);
    fire("pointerup", 120, 1800);
    expect(onValueChange).toHaveBeenCalledWith("trend");
  });
});
