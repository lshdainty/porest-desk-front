// 공용 원장 부품(가계부 · 할 일 · 검색이 함께 쓴다) — ds 값: 머리는 Scroll Auto Hide, 오는 날은 불투명도 없이 색, 날짜 머리는 h2.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  LedgerCell,
  LedgerCellNum,
  LedgerDivider,
  LedgerDayDate,
  LedgerDayGroup,
  LedgerDayHead,
  LedgerDaySum,
  LedgerExpand,
  LedgerNavBtn,
  LedgerPin,
  LedgerSumBtn,
} from "./ledger";

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

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const render = (node: React.ReactNode) => act(() => root.render(node));

describe("원장 머리 — Scroll Auto Hide (할 일 원장도 같은 부품)", () => {
  it("머리는 sticky · bg-layer-default 의 Scroll Auto Hide 이고 옛 접힘이 없다", () => {
    render(
      <LedgerPin>
        <LedgerNavBtn aria-label="이전 달">‹</LedgerNavBtn>
      </LedgerPin>,
    );
    const pin = container.querySelector("[data-scroll-auto-hide]")!;
    expect(pin.className).toContain("sticky");
    expect(pin.className).toContain("bg-bg-layer-default");
    expect(container.querySelector("[data-ledger-collapse]")).toBeNull();
  });

  it("단추 셋: 월 이동 = ghost medium iconOnly, 토글 = small neutralOutline, 펼침 = aria-expanded", () => {
    render(
      <>
        <LedgerNavBtn aria-label="이전 달">‹</LedgerNavBtn>
        <LedgerSumBtn aria-expanded={false}>소비 요약</LedgerSumBtn>
        <LedgerExpand aria-label="월 달력" expanded />
      </>,
    );
    const nav = container.querySelector<HTMLElement>('[aria-label="이전 달"]')!;
    expect(nav.className).toContain("h-10");
    expect(nav.className).toContain("w-10");
    const sum = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent === "소비 요약",
    )!;
    expect(sum.className).toContain("h-9");
    expect(sum.className).toContain("border");
    expect(
      container
        .querySelector('[aria-label="월 달력"]')
        ?.getAttribute("aria-expanded"),
    ).toBe("true");
  });
});

describe("날 숫자 · 날짜 머리", () => {
  it("오는 날은 fg-neutral-subtle(불투명도 0), 일 · 토는 critical · brand, 고른 날은 브랜드 알약", () => {
    render(
      <>
        <LedgerCellNum future>1</LedgerCellNum>
        <LedgerCellNum dow={0}>2</LedgerCellNum>
        <LedgerCellNum dow={6}>3</LedgerCellNum>
        <LedgerCellNum selected>4</LedgerCellNum>
      </>,
    );
    const [future, sun, sat, sel] = Array.from(
      container.querySelectorAll("span"),
    );
    expect(future!.className).toContain("text-fg-neutral-subtle");
    expect(future!.className).not.toContain("opacity");
    expect(sun!.className).toContain("text-fg-critical");
    expect(sat!.className).toContain("text-fg-brand");
    expect(sel!.className).toContain("bg-bg-brand-solid");
  });

  it("날짜 머리는 List Header(t4 · 500) 안 h2 — 합계는 h2 밖, 오늘 · 어제는 h2 안에 붙는다", () => {
    render(
      <LedgerDayGroup day="2026-10-15">
        <LedgerDayHead>
          <LedgerDayDate relative="오늘">26. 10. 15(목)</LedgerDayDate>
          <LedgerDaySum>12,000원</LedgerDaySum>
        </LedgerDayHead>
      </LedgerDayGroup>,
    );
    const head = container.querySelector("[data-slot=list-header]")!;
    expect(head.className).toContain("text-t4");
    expect(head.className).toContain("font-medium");
    expect(head.className).toContain("px-0");
    expect(head.querySelector("h2")?.className).toContain(
      "text-[color:inherit]",
    );
    expect(head.querySelector("h2")?.textContent).toContain("오늘");
    expect(head.querySelector("h2")?.textContent).not.toContain("12,000");
    expect(container.querySelector("[data-ledger-day]")).not.toBeNull();
  });

  it("임시 gutter 인자를 켜면 머리가 제 좌우 24 를 갖는다(px-0 이 빠진다)", () => {
    render(<LedgerDayHead gutter>x</LedgerDayHead>);
    expect(
      container.querySelector("[data-slot=list-header]")!.className,
    ).not.toContain("px-0");
  });
});

describe("칸 · 선", () => {
  it("스켈레톤용 empty 칸도 안의 날 숫자를 그린다 — 눌리는 칸이 아니라 div 다", () => {
    render(
      <LedgerCell empty>
        <LedgerCellNum>18</LedgerCellNum>
      </LedgerCell>,
    );
    expect(container.textContent).toBe("18");
    expect(container.querySelector("button")).toBeNull();
  });

  it("머리 아래 선은 ds Divider 한 줄이다 — 풀블리드, inset 이면 들이지 않는다", () => {
    render(
      <>
        <LedgerDivider />
        <LedgerDivider inset />
      </>,
    );
    const lines = container.querySelectorAll("div");
    expect(lines[0]!.className).toContain("-mx-global-gutter");
    // 부모 폭 + 양쪽 24 — w-full 만 두면 왼쪽만 나가고 오른쪽 24 가 모자라다
    expect(lines[0]!.className).toContain(
      "w-[calc(100%+2*var(--spacing-global-gutter))]",
    );
    expect(lines[0]!.className).toContain("bg-stroke-neutral-subtle");
    expect(lines[1]!.className).not.toContain("-mx-global-gutter");
  });
});
