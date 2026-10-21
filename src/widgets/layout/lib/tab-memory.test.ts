// 탭 기억 — 경로 · 스크롤을 탭마다 들고, 높이가 생긴 뒤에야 스크롤을 복원한다.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  forget,
  recall,
  remember,
  rememberScroll,
  restoreScroll,
  tabOf,
} from "./tab-memory";

describe("탭 기억", () => {
  it("가계부 묶음 네 경로는 모두 expense 탭이다", () => {
    for (const p of [
      "/desk/expense",
      "/desk/asset",
      "/desk/stats",
      "/desk/budget",
    ])
      expect(tabOf(p)).toBe("expense");
    expect(tabOf("/desk")).toBe("home");
    expect(tabOf("/desk/settings")).toBeNull();
  });

  it("같은 화면이면 스크롤을 지키고, 다른 화면으로 가면 0 에서 다시 센다", () => {
    remember("calendar", "/desk/calendar");
    rememberScroll("calendar", 300);
    remember("calendar", "/desk/calendar");
    expect(recall("calendar")?.scroll).toBe(300);
    remember("calendar", "/desk/calendar?m=2");
    expect(recall("calendar")).toEqual({
      path: "/desk/calendar?m=2",
      scroll: 0,
    });
  });

  it("다시 누르면 첫 화면 · 0", () => {
    remember("all", "/desk/more");
    rememberScroll("all", 90);
    forget("all", "/desk/more");
    expect(recall("all")).toEqual({ path: "/desk/more", scroll: 0 });
  });
});

describe("restoreScroll", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const box = (height: number) => {
    const el = document.createElement("div");
    Object.defineProperty(el, "scrollHeight", {
      configurable: true,
      get: () => height,
    });
    Object.defineProperty(el, "clientHeight", { value: 100 });
    return el;
  };

  it("높이가 충분해지면 그 자리로 간다", () => {
    let h = 150;
    const el = document.createElement("div");
    Object.defineProperty(el, "scrollHeight", { get: () => h });
    Object.defineProperty(el, "clientHeight", { value: 100 });
    restoreScroll(el, 400);
    vi.advanceTimersByTime(100);
    expect(el.scrollTop).toBe(0);
    h = 600;
    vi.advanceTimersByTime(100);
    expect(el.scrollTop).toBe(400);
  });

  it("끝내 닿지 않으면 닿는 데까지만 간다", () => {
    const el = box(300);
    restoreScroll(el, 900);
    vi.advanceTimersByTime(2000);
    expect(el.scrollTop).toBe(200);
  });

  it("사용자가 휠을 돌리면 복원을 멈춘다", () => {
    const el = box(150);
    restoreScroll(el, 400);
    el.dispatchEvent(new Event("wheel"));
    Object.defineProperty(el, "scrollHeight", { value: 900 });
    vi.advanceTimersByTime(500);
    expect(el.scrollTop).toBe(0);
  });
});
