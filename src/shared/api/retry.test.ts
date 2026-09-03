// 없는 자산을 열면 같은 GET 이 두 번 나갔다(QA #4). 원인은 전역 `retry: 1` 이었고,
// 여기서 고정하는 건 "어떤 실패가 다시 물을 값어치가 있느냐" 한 가지다.
import { AxiosError, AxiosHeaders, type AxiosResponse } from "axios";
import { describe, expect, it } from "vitest";
import { retryOnlyServerErrors } from "./retry";

function httpError(status: number): AxiosError {
  const config = { headers: new AxiosHeaders() };
  const response = {
    status,
    statusText: "",
    data: {},
    headers: {},
    config,
  } as AxiosResponse;
  return new AxiosError("http", String(status), config, {}, response);
}

describe("retryOnlyServerErrors", () => {
  it("404 는 첫 실패부터 재시도하지 않는다 — 없는 것은 다시 물어도 없다", () => {
    expect(retryOnlyServerErrors(0, httpError(404))).toBe(false);
  });

  it("400·403 도 마찬가지다", () => {
    expect(retryOnlyServerErrors(0, httpError(400))).toBe(false);
    expect(retryOnlyServerErrors(0, httpError(403))).toBe(false);
  });

  it("499 까지가 4xx 다 — 경계를 넘기지 않는다", () => {
    expect(retryOnlyServerErrors(0, httpError(499))).toBe(false);
  });

  it("5xx 는 한 번 더 물어본다 — 서버가 잠깐 흔들렸을 수 있다", () => {
    expect(retryOnlyServerErrors(0, httpError(500))).toBe(true);
    expect(retryOnlyServerErrors(0, httpError(503))).toBe(true);
  });

  it("5xx 라도 두 번째부터는 포기한다 — 종전 `retry: 1` 과 같은 횟수", () => {
    expect(retryOnlyServerErrors(1, httpError(500))).toBe(false);
  });

  it("응답이 없는 네트워크 오류는 재시도 대상이다", () => {
    const netErr = new AxiosError("Network Error", "ERR_NETWORK");
    expect(retryOnlyServerErrors(0, netErr)).toBe(true);
    expect(retryOnlyServerErrors(1, netErr)).toBe(false);
  });

  it("axios 가 아닌 오류도 네트워크 오류와 같게 다룬다", () => {
    expect(retryOnlyServerErrors(0, new Error("boom"))).toBe(true);
  });
});
