import type { AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";

import { LOADING_TIMING } from "@/shared/ds/skeleton";

/*
 * 불러오기 요청 제한 10초 — skeleton.yaml region · skeleton.md "요청 제한 10초 · 다시 시도는 그 안에서"(2026-10-03 사용자 결정).
 * 처음 요청부터 다시 시도까지 합쳐 10초가 지나면 끊고 실패로 그린다(LoadingRegion 은 실패를 받아 그리기만 한다 —
 * 요청을 끊는 것은 제품의 요청 설정이다). 다시 시도는 읽기(GET)만 2번까지, 1초 · 2초 뒤. 10초를 넘기게 되면 하지 않는다.
 * 4xx 는 다시 하지 않고, 쓰기(POST · PUT · PATCH · DELETE)는 저절로 다시 보내지 않으며 제한도 걸지 않는다.
 *
 * 한 번의 불러오기(첫 시도 + 다시 시도)를 같은 요청 주소(getUri)로 묶어 처음 시간을 기억한다. 시도마다 axios timeout 을
 * 남은 시간으로 준다. 제한을 걸지 않는 읽기: 파일 받기(responseType blob · arraybuffer · stream), timeout 을 직접 준 요청.
 * 받기는 "진행이 10초 멈추면 실패" 규칙이라 따로다(내보내기 이관 때).
 * 증권 읽기도 10초 한도는 건다(앱과 같다) — 다시 시도는 각 쿼리의 retry: false 가 막는다.
 */

const BUDGET = LOADING_TIMING.timeout;
const RETRY_DELAYS = LOADING_TIMING.retryDelays;
// 실패한 시도 뒤 이만큼 안에 같은 요청이 오면 다시 시도로 보고 이어 센다(가장 긴 다시 시도 간격 + 여유)
const LAST_DELAY = RETRY_DELAYS[RETRY_DELAYS.length - 1] ?? 2000;
const RETRY_WINDOW = LAST_DELAY + 500;

type Chain = { start: number; lastFailedAt?: number };
const chains = new Map<string, Chain>();

type Config = Pick<
  AxiosRequestConfig,
  "method" | "url" | "baseURL" | "params" | "responseType" | "timeout"
>;

const isBounded = (config: Config): boolean =>
  (config.method ?? "get").toLowerCase() === "get" &&
  // axios 는 인터셉터에 인스턴스 기본값을 합친 config 를 넘기고 기본 timeout 은 0 이다 — "안 줌" 은 0
  !config.timeout &&
  config.responseType !== "blob" &&
  config.responseType !== "arraybuffer" &&
  config.responseType !== "stream";

const keyOf = (config: Config): string =>
  `${config.baseURL ?? ""}${config.url ?? ""}?${JSON.stringify(config.params ?? null)}`;

/** 시도를 시작한다 — 처음이면 시간을 기억하고, 다시 시도면 이어 센다. axios timeout 을 남은 시간으로 준다 */
export function beginAttempt(config: InternalAxiosRequestConfig): void {
  if (!isBounded(config)) return;
  const key = keyOf(config);
  const now = Date.now();
  const chain = chains.get(key);
  const continued =
    chain?.lastFailedAt !== undefined &&
    now - chain.lastFailedAt <= RETRY_WINDOW;
  const start = continued ? chain!.start : now;
  chains.set(key, { start });
  config.timeout = Math.max(1, BUDGET - (now - start));
}

/** 불러오기가 끝났다(성공) — 기억을 지운다 */
export function endChain(config: Config | undefined): void {
  if (config) chains.delete(keyOf(config));
}

/** 시도가 실패했다 — 다시 시도가 오면 이어 세도록 때를 적는다 */
export function markFailed(config: Config | undefined): void {
  if (!config) return;
  const chain = chains.get(keyOf(config));
  if (chain) chain.lastFailedAt = Date.now();
}

/**
 * 이 실패 뒤에 다시 시도해도 되나 — 제한이 걸린 읽기는 2번까지, 다시 시도 간격까지 더해 10초를 넘기게 되면 하지 않는다.
 * 제한이 걸리지 않은 요청(파일 받기 등)은 chain 이 없다 → undefined(호출한 쪽이 기본 규칙으로).
 */
export function mayRetryWithinBudget(
  failureCount: number,
  config: Config | undefined,
): boolean | undefined {
  if (!config) return undefined;
  const chain = chains.get(keyOf(config));
  if (!chain) return undefined;
  const delay = RETRY_DELAYS[failureCount];
  const ok = delay !== undefined && Date.now() - chain.start + delay < BUDGET;
  if (!ok) chains.delete(keyOf(config));
  return ok;
}

/** 다시 시도하기 전 기다리는 시간 — 1초 · 2초 */
export const retryDelay = (failureCount: number): number =>
  RETRY_DELAYS[failureCount] ?? LAST_DELAY;

/** 시험용 — 기억을 비운다 */
export function resetBudget(): void {
  chains.clear();
}
