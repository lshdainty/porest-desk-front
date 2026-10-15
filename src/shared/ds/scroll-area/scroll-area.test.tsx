// Scroll Area 의 동작 — 모양 · 색은 scripts/check-ds-spec.mjs 가 크로미움에서 스펙 값과 맞춘다.
// 검사기가 못 재는 값(속성 · 문장 — scroll-area.measure.mjs 머리)은 여기서 클래스 · 속성으로 본다.
// 전역 스크롤바(6px · 알약 · Firefox 두 줄의 자리)는 src/index.css 의 글을 보는 tests/scroll-area-global-css.test.ts 가 지킨다.
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { ScrollArea } from "./scroll-area";

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

const classes = (el: Element) => (el.getAttribute("class") ?? "").split(" ");

describe("ScrollArea — 기본 스크롤 상자", () => {
  it("div 하나다 — 스크롤은 브라우저 그대로(가로채는 핸들러 · 겹친 막대 · Radix 가 없다)", () => {
    const el = render(
      <ScrollArea>
        <p>내용</p>
      </ScrollArea>,
    );
    expect(el.tagName).toBe("DIV");
    expect(el.getAttribute("data-slot")).toBe("scroll-area");
    expect(el.children).toHaveLength(1);
    expect(el.querySelector("[data-radix-scroll-area-viewport]")).toBeNull();
  });

  it("넘치는 방향만 스크롤한다 — 세로(기본) · 가로 · 둘 다", () => {
    const vertical = render(<ScrollArea />);
    expect(classes(vertical)).toEqual(
      expect.arrayContaining(["overflow-x-hidden", "overflow-y-auto"]),
    );
    const horizontal = render(<ScrollArea orientation="horizontal" />);
    expect(classes(horizontal)).toEqual(
      expect.arrayContaining(["overflow-x-auto", "overflow-y-hidden"]),
    );
    const both = render(<ScrollArea orientation="both" />);
    expect(classes(both)).toContain("overflow-auto");
    expect(both.getAttribute("data-orientation")).toBe("both");
  });

  it("높이 · 폭은 className 으로 정하고 나머지는 div 속성이다", () => {
    const el = render(<ScrollArea className="h-[380px]" id="day" data-x="1" />);
    expect(classes(el)).toContain("h-[380px]");
    expect(el.id).toBe("day");
    expect(el.getAttribute("data-x")).toBe("1");
  });

  it("안에 초점 가는 것이 있으면 label 을 주지 않는다 — 상자는 초점을 받지 않는다(role · tabindex 없음)", () => {
    const el = render(
      <ScrollArea>
        <button type="button">단추</button>
      </ScrollArea>,
    );
    expect(el.getAttribute("role")).toBeNull();
    expect(el.getAttribute("tabindex")).toBeNull();
    expect(el.getAttribute("aria-label")).toBeNull();
  });
});

describe("ScrollArea — 초점 가는 것이 없는 상자", () => {
  it("label 을 주면 role=region · tabindex=0 · aria-label — 상자 자신이 Tab 정지점이고 이름이 읽힌다", () => {
    const el = render(<ScrollArea label="10월 9일 일정" />);
    expect(el.getAttribute("role")).toBe("region");
    expect(el.getAttribute("tabindex")).toBe("0");
    expect(el.getAttribute("aria-label")).toBe("10월 9일 일정");
    act(() => el.focus());
    expect(document.activeElement).toBe(el);
  });

  it("키보드 포커스 링은 상자 안쪽 2px(바깥 링은 카드 · 시트에 잘린다)", () => {
    const el = render(<ScrollArea label="휴가 정책" />);
    expect(classes(el)).toEqual(
      expect.arrayContaining([
        "focus-visible:outline-2",
        "focus-visible:-outline-offset-2",
        "focus-visible:outline-stroke-focus-ring",
      ]),
    );
  });

  it("빈 상자 · 긴 이름도 그대로 이름이 된다", () => {
    const long = "휴가 정책 ".repeat(30).trim();
    const el = render(<ScrollArea label={long} />);
    expect(el.getAttribute("aria-label")).toBe(long);
    expect(el.childElementCount).toBe(0);
  });
});

describe("ScrollArea — 시트 · 대화상자 · 팝오버 안", () => {
  it("contain 이면 overscroll-behavior: contain(overscroll-contain) — 끝에 닿아도 뒤 화면이 따라오지 않는다", () => {
    const inside = render(<ScrollArea contain />);
    expect(classes(inside)).toContain("overscroll-contain");
    const page = render(<ScrollArea />);
    expect(classes(page)).not.toContain("overscroll-contain");
  });

  it("중첩 스크롤 — 안쪽 · 바깥 상자 모두 contain 을 받는다", () => {
    const outer = render(
      <ScrollArea contain>
        <ScrollArea label="휴가 정책" contain />
      </ScrollArea>,
    );
    expect(classes(outer)).toContain("overscroll-contain");
    expect(classes(outer.firstElementChild!)).toContain("overscroll-contain");
  });
});
