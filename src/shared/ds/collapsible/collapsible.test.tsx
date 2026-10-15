// Collapsible 의 동작 — 모양 · 색은 scripts/check-ds-spec.mjs 가 크로미움에서 스펙 값과 맞춘다.
// 검사기가 못 재는 값(머리말 단계 · 보임 · 숨김 · 문장 · 시간 · 누름 축소 — collapsible.measure.mjs 머리)은 여기서 클래스 · 속성으로 본다.
import { act, useState, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  type CollapsibleLayout,
  type CollapsibleSurface,
} from "./collapsible";

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
  vi.unstubAllGlobals();
});

function render(node: ReactNode) {
  act(() => root.render(node));
}

const classes = (el: Element) => (el.getAttribute("class") ?? "").split(" ");
const slot = (name: string) =>
  container.querySelector<HTMLElement>(`[data-slot=${name}]`)!;
const trigger = () => slot("collapsible-trigger") as HTMLButtonElement;
const panel = () => slot("collapsible-content");
const inner = () => slot("collapsible-content-inner");
const click = (el: Element) => act(() => (el as HTMLElement).click());

const Sample = ({
  surface,
  layout,
  description,
  ...props
}: Partial<React.ComponentProps<typeof Collapsible>> & {
  layout?: CollapsibleLayout;
  description?: string;
  surface?: CollapsibleSurface;
}) => (
  <Collapsible surface={surface} {...props}>
    <CollapsibleTrigger title="내역 분할 6개" description={description} />
    <CollapsibleContent layout={layout}>
      <p>상세</p>
    </CollapsibleContent>
  </Collapsible>
);

describe("Collapsible — 구조 · 읽기", () => {
  it("트리거는 머리말(h3) 안의 단추 — aria-expanded · aria-controls(펼친 내용의 id), 펼친 내용에 role 이 없다(APG Disclosure)", () => {
    render(<Sample />);
    expect(trigger().closest("h3")).not.toBeNull();
    expect(trigger().getAttribute("aria-expanded")).toBe("false");
    expect(trigger().getAttribute("aria-controls")).toBe(panel().id);
    expect(panel().getAttribute("role")).toBeNull();
    expect(inner().getAttribute("role")).toBeNull();
  });

  it("headingLevel 로 머리말 단계를 바꾼다", () => {
    render(
      <Collapsible>
        <CollapsibleTrigger title="제목" headingLevel={2} />
        <CollapsibleContent>상세</CollapsibleContent>
      </Collapsible>,
    );
    expect(slot("collapsible-heading").tagName).toBe("H2");
  });

  it("이름은 고정 — 설명(합계 · 필터 수)이 이름 뒤에 함께 읽히고 펼쳐도 이름이 바뀌지 않는다", () => {
    render(<Sample description="합계 −123,456,789원" />);
    expect(trigger().textContent).toBe("내역 분할 6개합계 −123,456,789원");
    expect(slot("collapsible-title").textContent).toBe("내역 분할 6개");
    click(trigger());
    expect(slot("collapsible-title").textContent).toBe("내역 분할 6개");
    expect(trigger().getAttribute("aria-expanded")).toBe("true");
  });

  it("설명이 없으면 이름만 54, 있으면 74", () => {
    render(<Sample />);
    expect(classes(trigger())).toContain("min-h-[54px]");
    render(<Sample description="2개 필터 적용 중" />);
    expect(classes(trigger())).toContain("min-h-[74px]");
  });

  it("Collapsible 밖에서 쓰면 알려 준다", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<CollapsibleTrigger title="밖" />)).toThrow(
      /Collapsible 안에 둔다/,
    );
    error.mockRestore();
  });
});

describe("Collapsible — 펼침", () => {
  it("접힘이 기본 — 펼친 내용은 hidden 이고 안의 글은 DOM 에 있다, 누르면 펼치고 다시 누르면 접는다", () => {
    render(<Sample />);
    expect(panel().hidden).toBe(true);
    expect(panel().getAttribute("data-state")).toBe("closed");
    expect(inner().textContent).toBe("상세");
    click(trigger());
    expect(panel().hidden).toBe(false);
    expect(panel().getAttribute("data-state")).toBe("open");
    expect(slot("collapsible").getAttribute("data-state")).toBe("open");
    click(trigger());
    expect(panel().hidden).toBe(true);
  });

  it("defaultOpen — 처음 펼침은 화면이 정한다", () => {
    render(<Sample defaultOpen />);
    expect(trigger().getAttribute("aria-expanded")).toBe("true");
    expect(panel().hidden).toBe(false);
  });

  it("쥐고 다루는 펼침 — open 을 따르고 onOpenChange 로 바꾸려는 값을 알린다(안 바꿔 주면 그대로)", () => {
    const onOpenChange = vi.fn();
    render(<Sample open={false} onOpenChange={onOpenChange} />);
    click(trigger());
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(trigger().getAttribute("aria-expanded")).toBe("false");
    render(<Sample open onOpenChange={onOpenChange} />);
    expect(trigger().getAttribute("aria-expanded")).toBe("true");
    click(trigger());
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it("스스로 다룰 때도 onOpenChange 를 부른다", () => {
    const onOpenChange = vi.fn();
    render(<Sample onOpenChange={onOpenChange} />);
    click(trigger());
    click(trigger());
    expect(onOpenChange.mock.calls).toEqual([[true], [false]]);
  });

  it("펼쳐도 초점은 트리거에 그대로고 화면을 저절로 스크롤하지 않는다 — Tab 순서는 트리거 → 펼친 내용 안", () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    render(
      <Collapsible>
        <CollapsibleTrigger title="제목" />
        <CollapsibleContent>
          <button type="button">안의 단추</button>
        </CollapsibleContent>
      </Collapsible>,
    );
    act(() => trigger().focus());
    click(trigger());
    expect(document.activeElement).toBe(trigger());
    expect(scrollIntoView).not.toHaveBeenCalled();
    const order = Array.from(container.querySelectorAll<HTMLElement>("button"));
    expect(order.map((b) => b.textContent)).toEqual(["제목", "안의 단추"]);
  });

  it("막힘 — 누르기 불가, 전용 색(fg-disabled, 흐리게 하지 않는다), 펼친 채 막히면 내용은 그대로 보인다", () => {
    const onOpenChange = vi.fn();
    render(
      <Sample
        disabled
        defaultOpen
        description="설명"
        onOpenChange={onOpenChange}
      />,
    );
    expect(trigger().disabled).toBe(true);
    expect(panel().hidden).toBe(false);
    for (const name of [
      "collapsible-title",
      "collapsible-description",
      "collapsible-chevron",
    ]) {
      expect(classes(slot(name))).toContain("text-fg-disabled");
    }
    expect(classes(trigger()).join(" ")).not.toMatch(/opacity/);
    click(trigger());
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("꺾쇠는 펼치면 180°(rotate-180), 300ms 로 돈다", () => {
    render(<Sample />);
    const chevron = slot("collapsible-chevron");
    expect(classes(chevron)).not.toContain("rotate-180");
    click(trigger());
    expect(classes(chevron)).toContain("rotate-180");
    expect(classes(chevron)).toContain(
      "[transition:rotate_var(--motion-duration-d6)_var(--motion-ease-easing)]",
    );
  });

  it("onClick 이 기본 동작을 막으면 펼치지 않는다 — 원장 머리처럼 화면이 쥐는 자리", () => {
    render(
      <Collapsible>
        <CollapsibleTrigger title="제목" onClick={(e) => e.preventDefault()} />
        <CollapsibleContent>상세</CollapsibleContent>
      </Collapsible>,
    );
    click(trigger());
    expect(trigger().getAttribute("aria-expanded")).toBe("false");
  });
});

describe("Collapsible — 펼침 모션", () => {
  const animate = vi.fn();
  const stub = (reduced: boolean) => {
    animate.mockReset();
    animate.mockImplementation(() => ({ cancel: vi.fn(), onfinish: null }));
    Object.defineProperty(HTMLElement.prototype, "animate", {
      configurable: true,
      value: animate,
    });
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({ matches: reduced, addEventListener() {} }),
    );
  };
  afterEach(() => {
    Reflect.deleteProperty(HTMLElement.prototype, "animate");
  });

  it("높이 300ms — 처음 그릴 때는 움직이지 않고 누를 때 움직인다", () => {
    stub(false);
    render(<Sample />);
    expect(animate).not.toHaveBeenCalled();
    click(trigger());
    expect(animate).toHaveBeenCalledTimes(1);
    const [frames, options] = animate.mock.calls[0]!;
    expect(frames[0]).toHaveProperty("height");
    expect(options.duration).toBe(300);
  });

  it("모션 줄이기면 높이를 움직이지 않고 150ms 서서히(opacity)", () => {
    stub(true);
    render(<Sample />);
    click(trigger());
    const [frames, options] = animate.mock.calls[0]!;
    expect(frames).toEqual([{ opacity: 0 }, { opacity: 1 }]);
    expect(options.duration).toBe(150);
  });
});

describe("Collapsible — 놓인 면", () => {
  it("default — 흰 면 · 시트의 줄: 줄 폭 전체, 트리거 · 펼친 내용 좌우 24, 아래 16(줄 목록이면 8)", () => {
    render(<Sample />);
    expect(slot("collapsible").getAttribute("data-surface")).toBe("default");
    expect(classes(slot("collapsible")).join(" ")).not.toMatch(
      /border|rounded/,
    );
    expect(classes(slot("collapsible-trigger-content"))).toContain(
      "px-global-gutter",
    );
    expect(classes(inner())).toEqual(
      expect.arrayContaining(["px-global-gutter", "pt-0", "pb-x4"]),
    );
    render(<Sample layout="rows" />);
    expect(classes(inner())).toContain("pb-x2");
    expect(inner().getAttribute("data-layout")).toBe("rows");
  });

  it("card — Collapsible 이 Card 면(1px · 모서리 16 · 잘라 냄)이고 펼친 내용은 카드 안 여백 24 로 끝난다(줄 목록이어도), 포커스 링은 모서리 14", () => {
    render(<Sample surface="card" />);
    expect(classes(slot("collapsible"))).toEqual(
      expect.arrayContaining([
        "overflow-hidden",
        "rounded-r4",
        "border",
        "border-stroke-neutral-weak",
        "bg-bg-layer-default",
      ]),
    );
    expect(classes(inner())).toContain("pb-x6");
    expect(classes(trigger())).toContain("rounded-r3_5");
    render(<Sample surface="card" layout="rows" />);
    expect(classes(inner())).toContain("pb-x6");
    expect(classes(inner())).not.toContain("pb-x2");
  });

  it("warning — 경고 상자의 맨 아래 줄: 위 1px stroke-warning-weak 선, 좌우 16, 누름은 bg-warning-weak-pressed, 링 모서리 10", () => {
    render(<Sample surface="warning" />);
    expect(classes(slot("collapsible"))).toEqual(
      expect.arrayContaining([
        "border-t",
        "border-stroke-warning-weak",
        "border-0",
      ]),
    );
    expect(classes(trigger())).toEqual(
      expect.arrayContaining([
        "[--trigger-pressed:var(--color-bg-warning-weak-pressed)]",
        "rounded-r2_5",
      ]),
    );
    expect(classes(slot("collapsible-trigger-content"))).toContain("px-x4");
    expect(classes(inner())).toContain("px-x4");
  });

  it("흰 면 · 카드의 누름 바탕은 불투명한 bg-layer-default-pressed 다", () => {
    render(<Sample />);
    expect(classes(trigger())).toContain(
      "[--trigger-pressed:var(--color-bg-layer-default-pressed)]",
    );
    expect(slot("collapsible-background").className).toContain(
      "bg-(--trigger-pressed)",
    );
  });
});

describe("가장 나쁜 값", () => {
  it("긴 이름 · 긴 설명은 줄을 바꿔 다 보인다(말줄임 · 줄 수 제한 없음)", () => {
    render(<Sample description={"합계 −123,456,789,012원 · ".repeat(10)} />);
    for (const name of ["collapsible-title", "collapsible-description"]) {
      const c = classes(slot(name));
      expect(c).toContain("break-keep");
      expect(c).not.toContain("truncate");
      expect(c.some((x) => x.startsWith("line-clamp"))).toBe(false);
    }
  });

  it("펼친 채 내용이 늘어나도 열린 상태 · 트리거 초점이 그대로다 — 패널에 높이 제한 · 스크롤 상자가 없다", () => {
    const Grow = () => {
      const [n, setN] = useState(1);
      return (
        <Collapsible defaultOpen>
          <CollapsibleTrigger title="제목" />
          <CollapsibleContent layout="rows">
            {Array.from({ length: n }, (_, i) => (
              <p key={i}>줄 {i}</p>
            ))}
            <button type="button" data-more onClick={() => setN(n + 10)}>
              더
            </button>
          </CollapsibleContent>
        </Collapsible>
      );
    };
    render(<Grow />);
    act(() => trigger().focus());
    click(container.querySelector("[data-more]")!);
    expect(container.querySelectorAll("p")).toHaveLength(11);
    expect(trigger().getAttribute("aria-expanded")).toBe("true");
    expect(classes(inner()).some((c) => /^(max-h|overflow)/.test(c))).toBe(
      false,
    );
  });
});
