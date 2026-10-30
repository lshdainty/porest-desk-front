// useDayKey — 시간대가 바뀌면 타이머를 기다리지 않고 바로 다시 계산한다(D1: 통화가 늦게 와 한국 → 뉴욕으로 바뀔 때 60초 안 보이던 결함)
import { act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useDayKey } from "./useDayKey";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

let container: HTMLDivElement;
let root: Root;
let seen: string[] = [];

function Probe({ tz }: { tz: string }) {
  const key = useDayKey(tz);
  useEffect(() => {
    seen.push(key);
  });
  return null;
}
const render = (tz: string) => act(() => root.render(<Probe tz={tz} />));

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  vi.useFakeTimers({ toFake: ["Date", "setInterval", "clearInterval"] });
  // 한국 10-30 03:00 = 뉴욕 10-29 14:00 — 한국 날짜가 뉴욕보다 앞선다
  vi.setSystemTime(new Date("2026-10-30T03:00:00+09:00"));
  seen = [];
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.useRealTimers();
});
const last = () => seen[seen.length - 1];

describe("useDayKey", () => {
  it("처음에는 그 시간대의 오늘", () => {
    render("Asia/Seoul");
    expect(last()).toBe("2026-10-30");
  });
  it("시간대가 바뀌면 그 렌더에서 바로 다시 계산한다 — 타이머 · 시계가 움직이지 않아도(한국 → 뉴욕 = 10-29)", () => {
    render("Asia/Seoul");
    expect(last()).toBe("2026-10-30");
    render("America/New_York");
    expect(last()).toBe("2026-10-29");
  });
  it("뉴욕에서 다시 한국으로도 바로", () => {
    render("America/New_York");
    render("Asia/Seoul");
    expect(last()).toBe("2026-10-30");
  });
  it("같은 시간대에서는 타이머 전에 다시 계산하지 않는다 — 시계가 자정을 넘어도 60초 신호 전까지 그대로", () => {
    render("Asia/Seoul");
    vi.setSystemTime(new Date("2026-10-30T23:59:59+09:00"));
    vi.setSystemTime(new Date("2026-10-31T00:00:30+09:00"));
    render("Asia/Seoul"); // 다시 그려도(타이머 신호 없이) 값은 그대로
    expect(last()).toBe("2026-10-30");
  });
  it("60초 타이머 신호가 오면 그때 다시 읽는다 — 날이 바뀌면 값이 바뀐다", () => {
    render("Asia/Seoul");
    vi.setSystemTime(new Date("2026-10-31T00:00:30+09:00"));
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(last()).toBe("2026-10-31");
  });
  it("탭이 다시 보일 때(visibilitychange)도 다시 읽는다", () => {
    render("Asia/Seoul");
    vi.setSystemTime(new Date("2026-10-31T00:00:30+09:00"));
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(last()).toBe("2026-10-31");
  });
});
