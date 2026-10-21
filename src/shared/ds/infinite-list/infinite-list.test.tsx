// Infinite List 의 동작 — 모양 · 색은 scripts/check-ds-spec.mjs 가 크로미움에서 스펙 값과 맞춘다.
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { InfiniteListEnd } from "./infinite-list";
import { REACH_THRESHOLD } from "./infinite-list-variants";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

let container: HTMLDivElement;
let root: Root;

// 받는 시점을 보려고 IntersectionObserver 를 붙잡는다 — 만든 관찰자마다 옵션과 콜백을 남긴다
type FakeEntry = { isIntersecting: boolean };
const observers: {
  options: IntersectionObserverInit | undefined;
  callback: (entries: FakeEntry[]) => void;
  observed: Element[];
  disconnected: boolean;
}[] = [];

class FakeIntersectionObserver {
  private record: (typeof observers)[number];
  constructor(
    callback: (entries: FakeEntry[]) => void,
    options?: IntersectionObserverInit,
  ) {
    this.record = { options, callback, observed: [], disconnected: false };
    observers.push(this.record);
  }
  observe(el: Element) {
    this.record.observed.push(el);
  }
  unobserve() {}
  disconnect() {
    this.record.disconnected = true;
  }
}

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  observers.length = 0;
  vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

function render(node: ReactNode) {
  act(() => root.render(node));
  return container.firstElementChild as HTMLElement;
}
const slot = (name: string) =>
  container.querySelector<HTMLElement>(`[data-slot=${name}]`);
const reach = (isIntersecting: boolean) =>
  act(() => observers[observers.length - 1]!.callback([{ isIntersecting }]));

describe("InfiniteListEnd — 상태", () => {
  it("받는 중은 원 24 하나 — 글 · 다시 시도가 없다", () => {
    render(<InfiniteListEnd status="loading" />);
    expect(slot("infinite-list-end-progress")).not.toBeNull();
    expect(slot("infinite-list-end-message")!.textContent).toBe("");
    expect(slot("infinite-list-end-retry")).toBeNull();
    expect(slot("infinite-list-end-progress")!.getAttribute("aria-label")).toBe(
      "불러오는 중",
    );
  });

  it("원은 1초가 지나야 보인다 — 그 전에는 보이지 않게 그려 높이만 지킨다", () => {
    vi.useFakeTimers();
    render(<InfiniteListEnd status="loading" />);
    // 원은 SVG 라 className 이 문자열이 아니다 — class 속성으로 본다
    const progress = () =>
      slot("infinite-list-end-progress")!.getAttribute("class") ?? "";
    expect(progress()).toContain("invisible");
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(progress()).not.toContain("invisible");
  });

  it('못 불러옴은 "더 불러오지 못했어요." + 다시 시도 — 누르면 onRetry', () => {
    const onRetry = vi.fn();
    render(<InfiniteListEnd status="error" onRetry={onRetry} />);
    expect(slot("infinite-list-end-message")!.textContent).toBe(
      "더 불러오지 못했어요.",
    );
    expect(slot("infinite-list-end-message")!.getAttribute("role")).toBe(
      "status",
    );
    const retry = slot("infinite-list-end-retry") as HTMLButtonElement;
    expect(retry.textContent).toBe("다시 시도");
    // Button neutralWeak small · 글 아래 12
    expect(retry.className).toContain("mt-x3");
    act(() => retry.click());
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(slot("infinite-list-end-progress")).toBeNull();
  });

  it('끝은 기본 "모두 봤어요." — 목록마다 endText 로 바꾼다', () => {
    render(<InfiniteListEnd status="end" />);
    expect(slot("infinite-list-end-message")!.textContent).toBe("모두 봤어요.");
    render(<InfiniteListEnd status="end" endText="카드를 모두 봤어요." />);
    expect(slot("infinite-list-end-message")!.textContent).toBe(
      "카드를 모두 봤어요.",
    );
    expect(slot("infinite-list-end-retry")).toBeNull();
  });

  it("목록 마지막 줄 아래 24 · 가운데 · 글 색은 못 불러옴 muted · 끝 subtle", () => {
    const el = render(<InfiniteListEnd status="error" />);
    expect(el.className).toContain("py-x6");
    expect(el.className).toContain("justify-center");
    expect(el.querySelector("p")!.className).toContain("text-fg-neutral-muted");
    render(<InfiniteListEnd status="end" />);
    expect(container.querySelector("p")!.className).toContain(
      "text-fg-neutral-subtle",
    );
    expect(container.querySelector("p")!.className).toContain("text-t4");
  });

  it("ref · className · 속성을 넘긴다", () => {
    const ref = { current: null as HTMLDivElement | null };
    render(
      <InfiniteListEnd
        ref={ref}
        status="end"
        className="mb-x4"
        data-testid="x"
      />,
    );
    expect(ref.current).toBe(container.firstElementChild);
    expect(ref.current!.className).toContain("mb-x4");
    expect(ref.current!.dataset.testid).toBe("x");
    expect(ref.current!.dataset.status).toBe("end");
  });
});

describe("InfiniteListEnd — 받는 시점(300)", () => {
  it("화면 아래 끝에서 300 안으로 오면 한 번 부른다 — 받는 동안 거듭 부르지 않는다", () => {
    const onReachEnd = vi.fn();
    render(<InfiniteListEnd status="loading" onReachEnd={onReachEnd} />);
    expect(observers).toHaveLength(1);
    expect(observers[0]!.options?.rootMargin).toBe(
      `0px 0px ${REACH_THRESHOLD}px 0px`,
    );
    expect(REACH_THRESHOLD).toBe(300);
    reach(true);
    expect(onReachEnd).toHaveBeenCalledTimes(1);
    reach(true);
    expect(onReachEnd).toHaveBeenCalledTimes(1);
    // 300 밖으로 나갔다 오면 다시 부른다
    reach(false);
    reach(true);
    expect(onReachEnd).toHaveBeenCalledTimes(2);
  });

  it("받는 중이 아니면(못 불러옴 · 끝) 관찰하지 않는다", () => {
    const onReachEnd = vi.fn();
    render(<InfiniteListEnd status="error" onReachEnd={onReachEnd} />);
    expect(observers).toHaveLength(0);
    render(<InfiniteListEnd status="end" onReachEnd={onReachEnd} />);
    expect(observers).toHaveLength(0);
    expect(onReachEnd).not.toHaveBeenCalled();
  });

  it("다시 시도로 돌아온 loading 은 다시 시도가 받고 있어 바로 부르지 않는다 — 나갔다 오면 부른다", () => {
    const onReachEnd = vi.fn();
    render(<InfiniteListEnd status="error" onReachEnd={onReachEnd} />);
    render(<InfiniteListEnd status="loading" onReachEnd={onReachEnd} />);
    reach(true);
    expect(onReachEnd).not.toHaveBeenCalled();
    reach(false);
    reach(true);
    expect(onReachEnd).toHaveBeenCalledTimes(1);
  });

  it("상태가 바뀌거나 사라지면 관찰을 끊는다", () => {
    render(<InfiniteListEnd status="loading" />);
    const first = observers[0]!;
    render(<InfiniteListEnd status="end" />);
    expect(first.disconnected).toBe(true);
  });
});
