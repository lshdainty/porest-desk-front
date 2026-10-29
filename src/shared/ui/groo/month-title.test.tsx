// 달 글 — 누르면 연 | 월 휠, 미래 달은 max 로 되돌린다(I-27 · 사용자 10-29 (가))
import { act } from "react";
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

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

const { MonthTitle } = await import("./month-title");

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
  window.matchMedia = ((query: string) => ({
    matches: false,
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
});

// 칼럼 순서는 연 → 월 — 이름은 언어를 따라 바뀌어 번호로 짚는다
const col = (name: "연도" | "월") =>
  document.body.querySelectorAll<HTMLElement>('[role="spinbutton"]')[
    name === "연도" ? 0 : 1
  ]!;
const press = (el: Element, key: string) =>
  act(() => {
    el.dispatchEvent(
      new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }),
    );
  });
const run = (max?: string) => {
  const onChange = vi.fn();
  act(() =>
    root.render(<MonthTitle month="2026-10" onChange={onChange} max={max} />),
  );
  act(() => {
    container
      .querySelector("button")!
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  return onChange;
};
const done = () => {
  act(() => {
    vi.advanceTimersByTime(300);
  });
  act(() =>
    document.body
      .querySelector<HTMLButtonElement>(
        '[data-slot="bottom-sheet-footer"] button',
      )!
      .click(),
  );
};

describe("달 글", () => {
  it("글 + 꺾쇠 하나뿐 — ‹ › 단추가 없다", () => {
    act(() => root.render(<MonthTitle month="2026-10" onChange={() => {}} />));
    expect(container.querySelectorAll("button")).toHaveLength(1);
    expect(container.textContent).toContain("2026");
    // 누르는 높이는 px 44 — rem 이면 글자 200% 에서 88 이 된다(DESIGN.md:2442)
    expect(container.querySelector("button")!.className).toContain(
      "min-h-[44px]",
    );
    expect(container.querySelector("button")!.className).not.toContain(
      "min-h-11",
    );
  });

  it("휠로 고른 달을 완료로 넣는다", () => {
    const onChange = run();
    press(col("월"), "ArrowDown");
    done();
    expect(onChange).toHaveBeenCalledWith("2026-11");
  });

  it("max 보다 뒤 달에서 완료하면 max 로 되돌린다(홈 — 미래 달은 이번 달)", () => {
    const onChange = run("2026-10");
    press(col("월"), "ArrowDown");
    press(col("연도"), "ArrowDown");
    done();
    expect(onChange).toHaveBeenCalledWith("2026-10");
  });
});
