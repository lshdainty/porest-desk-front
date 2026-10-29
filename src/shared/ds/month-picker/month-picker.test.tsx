// 달 고르기 동작 — 연 | 월 휠 + "완료"(I-27). 모양 · 크기는 wheel-picker 의 ds:check 가 잰다.
import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { MonthPicker, type MonthValue } from "./month-picker";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

let wide = false;
beforeAll(() => {
  Element.prototype.scrollTo = function (
    this: Element,
    arg?: ScrollToOptions | number,
    y?: number,
  ) {
    const top = typeof arg === "object" ? arg.top : y;
    if (typeof top === "number") this.scrollTop = top;
    this.dispatchEvent(new Event("scroll"));
  } as Element["scrollTo"];
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  window.matchMedia = ((query: string) => ({
    matches: query.includes("min-width: 1280px") ? wide : false,
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
});
afterAll(() => {
  delete (Element.prototype as Partial<Element>).scrollTo;
});

let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  vi.useFakeTimers();
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.useRealTimers();
  wide = false;
});

const onChange = vi.fn<(v: MonthValue) => void>();

function Host({ initial }: { initial: MonthValue }) {
  const [value, setValue] = useState(initial);
  return (
    <MonthPicker
      value={value}
      onValueChange={(v) => {
        setValue(v);
        onChange(v);
      }}
      title="달 선택"
      doneLabel="완료"
      trigger={
        <button type="button">
          {value.year}-{value.month}
        </button>
      }
    />
  );
}

const settle = () =>
  act(() => {
    vi.advanceTimersByTime(300);
  });
const press = (el: Element, key: string) =>
  act(() => {
    el.dispatchEvent(
      new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }),
    );
  });
const open = () =>
  act(() => {
    container
      .querySelector("button")!
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
const col = (name: string) =>
  document.body.querySelector<HTMLElement>(
    `[role="spinbutton"][aria-label="${name}"]`,
  )!;
const doneButton = () =>
  [...document.body.querySelectorAll("button")].find(
    (b) => b.textContent === "완료",
  )!;

describe("달 고르기", () => {
  it("1280 미만 — 시트가 열리고 연 | 월 두 칼럼이 지금 달에서 시작한다", () => {
    act(() => root.render(<Host initial={{ year: 2026, month: 10 }} />));
    open();
    expect(document.body.querySelector('[role="dialog"]')).not.toBeNull();
    expect(document.body.textContent).toContain("달 선택");
    expect(col("연도").getAttribute("aria-valuetext")).toBe("2026년");
    expect(col("월").getAttribute("aria-valuetext")).toBe("10월");
    // 4 × 3 격자는 없다
    expect(document.body.querySelectorAll('[role="spinbutton"]')).toHaveLength(
      2,
    );
  });

  it("굴려도 완료 전에는 넣지 않고, 완료로 연 · 월을 한꺼번에 넣는다", () => {
    act(() => root.render(<Host initial={{ year: 2026, month: 10 }} />));
    open();
    press(col("연도"), "ArrowDown");
    press(col("월"), "ArrowDown");
    press(col("월"), "ArrowDown");
    settle();
    expect(onChange).not.toHaveBeenCalled();
    act(() => doneButton().click());
    expect(onChange).toHaveBeenCalledWith({ year: 2027, month: 12 });
  });

  it("월은 돌아간다 — 12월 다음은 1월(연은 그대로)", () => {
    act(() => root.render(<Host initial={{ year: 2026, month: 12 }} />));
    open();
    press(col("월"), "ArrowDown");
    settle();
    act(() => doneButton().click());
    expect(onChange).toHaveBeenLastCalledWith({ year: 2026, month: 1 });
  });

  it("Esc 로 닫으면 굴린 값을 버리고, 다시 열면 지금 달에서 시작한다", () => {
    onChange.mockClear();
    act(() => root.render(<Host initial={{ year: 2026, month: 10 }} />));
    open();
    press(col("연도"), "ArrowDown");
    settle();
    act(() => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );
    });
    settle();
    expect(onChange).not.toHaveBeenCalled();
    open();
    expect(col("연도").getAttribute("aria-valuetext")).toBe("2026년");
  });

  it("1280 이상 — 팝오버로 열리고 같은 휠 · 완료가 있다", () => {
    wide = true;
    act(() => root.render(<Host initial={{ year: 2026, month: 10 }} />));
    open();
    expect(
      document.body.querySelector('[data-slot="popover-content"]'),
    ).not.toBeNull();
    expect(
      document.body.querySelector(
        '[role="dialog"][data-slot="bottom-sheet-content"]',
      ),
    ).toBeNull();
    expect(col("연도")).not.toBeNull();
    expect(doneButton()).toBeDefined();
  });

  it("연 범위는 기본 오늘 ± 100년이다", () => {
    act(() => root.render(<Host initial={{ year: 2026, month: 10 }} />));
    open();
    expect(col("연도").getAttribute("aria-valuemax")).toBe("200");
  });
});
