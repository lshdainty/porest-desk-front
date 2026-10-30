// 관심 그룹 보임 판정(I-13 22) — 위아래 200px · 300ms 머문 묶음만, 나가면 바로 뺀다
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useVisibleIds } from "./useVisibleIds";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

type Cb = (e: Partial<IntersectionObserverEntry>[]) => void;
let cb: Cb;
let opts: IntersectionObserverInit | undefined;
class FakeIO {
  constructor(c: Cb, o?: IntersectionObserverInit) {
    cb = c;
    opts = o;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

let seen: ReadonlySet<number> = new Set();
function Probe() {
  const { visibleIds, track } = useVisibleIds();
  seen = visibleIds;
  return (
    <>
      <div ref={track(1)} />
      <div ref={track(2)} />
    </>
  );
}
const el = (id: number) =>
  ({ dataset: { groupId: String(id) } }) as unknown as Element;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  vi.useFakeTimers();
  vi.stubGlobal("IntersectionObserver", FakeIO);
  const host = document.createElement("div");
  document.body.appendChild(host);
  act(() => createRoot(host).render(<Probe />));
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("useVisibleIds", () => {
  it("위아래 200px 를 본다", () => {
    expect(opts?.rootMargin).toBe("200px 0px");
  });
  it("300ms 머물러야 보인 것으로 친다 — 지나가는 스크롤은 거른다", () => {
    act(() => cb([{ target: el(1), isIntersecting: true }]));
    act(() => void vi.advanceTimersByTime(200));
    expect(seen.has(1)).toBe(false);
    act(() => cb([{ target: el(1), isIntersecting: false }]));
    act(() => void vi.advanceTimersByTime(400));
    expect(seen.has(1)).toBe(false);
  });
  it("머문 묶음은 보이고, 나가면 바로 빠진다", () => {
    act(() => cb([{ target: el(2), isIntersecting: true }]));
    act(() => void vi.advanceTimersByTime(300));
    expect([...seen]).toEqual([2]);
    act(() => cb([{ target: el(2), isIntersecting: false }]));
    expect(seen.size).toBe(0);
  });
});
