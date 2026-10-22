// 불러오기 요청 제한 10초 · 다시 시도는 그 안에서 — skeleton.md "요청 제한 10초" (03E-021)
import {
  AxiosError,
  AxiosHeaders,
  type InternalAxiosRequestConfig,
} from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  beginAttempt,
  endChain,
  markFailed,
  resetBudget,
  retryDelay,
} from "./request-budget";
import { retryOnlyServerErrors } from "./retry";

const config = (
  extra: Partial<InternalAxiosRequestConfig> = {},
): InternalAxiosRequestConfig => ({
  method: "get",
  baseURL: "/api",
  url: "/v1/expense",
  params: { month: "2026-10" },
  headers: new AxiosHeaders(),
  ...extra,
});

const failure = (cfg: InternalAxiosRequestConfig, status?: number) =>
  new AxiosError(
    status ? "http" : "Network Error",
    status ? String(status) : "ERR_NETWORK",
    cfg,
    {},
    status
      ? { status, statusText: "", data: {}, headers: {}, config: cfg }
      : undefined,
  );

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-22T00:00:00Z"));
  resetBudget();
});
afterEach(() => vi.useRealTimers());

describe("읽기 요청 제한 10초", () => {
  it("읽기는 첫 시도에 10초를 받는다", () => {
    const cfg = config();
    beginAttempt(cfg);
    expect(cfg.timeout).toBe(10_000);
  });

  it("다시 시도는 처음부터 이어 센다 — 1초 뒤 시도는 남은 9초(1초 실패 + 1초 간격 뒤 8초)", () => {
    const first = config();
    beginAttempt(first);
    vi.advanceTimersByTime(1_000);
    markFailed(first); // 1초에 실패
    expect(retryOnlyServerErrors(0, failure(first, 503))).toBe(true);
    expect(retryDelay(0)).toBe(1_000);
    vi.advanceTimersByTime(1_000); // 1초 기다린 뒤 두 번째 시도
    const second = config();
    beginAttempt(second);
    expect(second.timeout).toBe(8_000);
    // 두 번째도 실패 → 2초 뒤 세 번째(마지막)
    markFailed(second);
    expect(retryOnlyServerErrors(1, failure(second, 503))).toBe(true);
    expect(retryDelay(1)).toBe(2_000);
    vi.advanceTimersByTime(2_000);
    const third = config();
    beginAttempt(third);
    expect(third.timeout).toBe(6_000);
    // 다시 시도는 2번까지
    markFailed(third);
    expect(retryOnlyServerErrors(2, failure(third, 503))).toBe(false);
  });

  it("간격까지 더해 10초를 넘기게 되면 다시 하지 않는다", () => {
    const cfg = config();
    beginAttempt(cfg);
    vi.advanceTimersByTime(8_500);
    markFailed(cfg);
    // 8.5초 + 1초 간격 = 9.5초 → 한 번 더 할 수 있다
    expect(retryOnlyServerErrors(0, failure(cfg))).toBe(true);
    vi.advanceTimersByTime(500);
    // 9초 + 1초 간격 = 10초 → 넘겼다
    expect(retryOnlyServerErrors(0, failure(cfg))).toBe(false);
  });

  it("10초에 끊긴 요청(timeout)은 다시 하지 않는다", () => {
    const cfg = config();
    beginAttempt(cfg);
    vi.advanceTimersByTime(10_000);
    markFailed(cfg);
    expect(retryOnlyServerErrors(0, failure(cfg))).toBe(false);
  });

  it("4xx 는 바로 실패, 5xx 는 다시 시도", () => {
    const cfg = config();
    beginAttempt(cfg);
    expect(retryOnlyServerErrors(0, failure(cfg, 404))).toBe(false);
    expect(retryOnlyServerErrors(0, failure(cfg, 500))).toBe(true);
  });

  it("쓰기 · 파일 받기 · 직접 준 timeout · 증권 시세는 제한을 걸지 않는다", () => {
    for (const extra of [
      { method: "post" },
      { method: "delete" },
      { responseType: "blob" as const },
      { timeout: 60_000 },
      { url: "/v1/securities/quote" },
      { url: "/v1/toss/accounts" },
    ]) {
      const cfg = config(extra);
      const before = cfg.timeout;
      beginAttempt(cfg);
      expect(cfg.timeout, JSON.stringify(extra)).toBe(before);
    }
    // 제한이 없는 요청은 종전처럼 한 번만 다시
    const download = config({ responseType: "blob" });
    beginAttempt(download);
    expect(retryOnlyServerErrors(0, failure(download, 500))).toBe(true);
    expect(retryOnlyServerErrors(1, failure(download, 500))).toBe(false);
  });

  it("끝난 불러오기는 잊는다 — 곧바로 다시 불러와도 새로 10초", () => {
    const first = config();
    beginAttempt(first);
    vi.advanceTimersByTime(3_000);
    endChain(first);
    const again = config();
    beginAttempt(again);
    expect(again.timeout).toBe(10_000);
  });

  it("실패 뒤 한참 지나 사용자가 다시 부르면 새 불러오기다", () => {
    const first = config();
    beginAttempt(first);
    vi.advanceTimersByTime(4_000);
    markFailed(first);
    vi.advanceTimersByTime(60_000);
    const again = config();
    beginAttempt(again);
    expect(again.timeout).toBe(10_000);
  });
});
