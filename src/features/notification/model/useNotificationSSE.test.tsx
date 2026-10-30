import { StrictMode } from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { notificationKeys } from "@/shared/config";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const toast = vi.hoisted(() => vi.fn());
vi.mock("sonner", () => ({ toast }));

class FakeEventSource {
  static all: FakeEventSource[] = [];
  closed = false;
  listeners: Record<string, ((e: MessageEvent) => void)[]> = {};
  onerror: (() => void) | null = null;
  constructor(
    public url: string,
    public init?: EventSourceInit,
  ) {
    FakeEventSource.all.push(this);
  }
  addEventListener(type: string, fn: (e: MessageEvent) => void) {
    (this.listeners[type] ??= []).push(fn);
  }
  close() {
    this.closed = true;
  }
  emit(type: string, data = "{}") {
    this.listeners[type]?.forEach((f) => f({ data } as MessageEvent));
  }
}

const { useNotificationSSE } = await import("./useNotificationSSE");
const open = () => FakeEventSource.all.filter((s) => !s.closed);
const first = (): FakeEventSource => {
  const s = open()[0];
  if (!s) throw new Error("열린 스트림이 없다");
  return s;
};

const setup = (strict = false) => {
  const qc = new QueryClient();
  const spy = vi.spyOn(qc, "invalidateQueries");
  const Probe = () => {
    useNotificationSSE();
    return null;
  };
  const host = document.createElement("div");
  const root = createRoot(host);
  const tree = (
    <QueryClientProvider client={qc}>
      <Probe />
    </QueryClientProvider>
  );
  act(() => root.render(strict ? <StrictMode>{tree}</StrictMode> : tree));
  return { spy, unmount: () => act(() => root.unmount()) };
};

describe("useNotificationSSE", () => {
  beforeEach(() => {
    FakeEventSource.all = [];
    toast.mockClear();
    vi.stubGlobal("EventSource", FakeEventSource);
    vi.useFakeTimers();
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("쿠키를 실어 스트림 하나를 연다", () => {
    setup();
    expect(open()).toHaveLength(1);
    expect(first().init).toEqual({ withCredentials: true });
    expect(first().url).toMatch(/\/v1\/notifications\/stream$/);
  });

  it("StrictMode 이중 마운트에서도 열려 있는 스트림은 하나다", () => {
    setup(true);
    expect(open()).toHaveLength(1);
  });

  it("알림이 오면 알림 질의를 다시 받고 띠(토스트)는 띄우지 않는다", () => {
    const { spy } = setup();
    act(() => first().emit("NOTIFICATION", '{"title":"t","message":"m"}'));
    expect(spy).toHaveBeenCalledWith({ queryKey: notificationKeys.all });
    expect(toast).not.toHaveBeenCalled();
  });

  it("글이 깨져 와도 점은 갱신한다", () => {
    const { spy } = setup();
    act(() => first().emit("NOTIFICATION", "not json"));
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("끊기면 늘려 가며 다시 잇고, 이어지면 한 번 맞춘다", () => {
    const { spy } = setup();
    act(() => first().onerror?.());
    expect(open()).toHaveLength(0);
    act(() => void vi.advanceTimersByTime(1000));
    expect(open()).toHaveLength(1);
    act(() => first().emit("CONNECT"));
    expect(spy).toHaveBeenCalledTimes(1);
    act(() => first().emit("CONNECT"));
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("처음 이어질 때는 맞추지 않는다", () => {
    const { spy } = setup();
    act(() => first().emit("CONNECT"));
    expect(spy).not.toHaveBeenCalled();
  });

  it("떠나면(로그아웃 · 계정 전환) 스트림을 닫고 다시 잇지 않는다", () => {
    const { unmount } = setup();
    const es = first();
    act(() => es.onerror?.());
    unmount();
    act(() => void vi.advanceTimersByTime(60000));
    expect(open()).toHaveLength(0);
    expect(FakeEventSource.all).toHaveLength(1);
  });
});
