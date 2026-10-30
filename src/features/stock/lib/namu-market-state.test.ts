// 나무 장 상태 글(I-13b 17) · 대표 종목 · 증권사 경로(I-13b 16)
import { describe, expect, it } from "vitest";
import { clock12, namuMarketStatus } from "./market-state";
import { candlesPath } from "../api/securitiesApi";

describe("나무 장 상태 여덟 가지", () => {
  // 13-1 규칙 — 보이는 시각은 한국 시각이고 순간(Date)으로 읽는다. 오프셋 붙은 ISO(+09:00) 입력으로 고정한다
  const at = new Date("2026-10-29T13:05:00+09:00");
  it("REGULAR 만 열림 · 시각은 한국 시각의 오전 · 오후 12시간", () => {
    expect(namuMarketStatus("REGULAR", at)).toEqual({
      open: true,
      labelKey: "market.live",
      time: clock12("13:05"),
    });
  });
  it("자정을 넘기는 순간도 한국 시각으로 — UTC · 미국 현지로 읽지 않는다", () => {
    const late = new Date("2026-10-29T23:30:00+09:00");
    expect(namuMarketStatus("REGULAR", late)?.time).toBe(clock12("23:30"));
    const early = new Date("2026-10-30T00:05:00+09:00");
    expect(namuMarketStatus("REGULAR", early)?.time).toBe(clock12("00:05"));
  });
  it("CLOSED → 장마감, 나머지 여섯은 새 글", () => {
    expect(namuMarketStatus("CLOSED", at)?.labelKey).toBe("market.afterClose");
    for (const s of [
      "PRE",
      "AFTER",
      "DAYTIME",
      "SINGLE_PRICE",
      "HALTED",
      "BEFORE_OPEN",
    ]) {
      const m = namuMarketStatus(s, at);
      expect(m?.open).toBe(false);
      expect(m?.labelKey).toBe(`market.state.${s}`);
      expect(m?.time).toBeUndefined();
    }
  });
  it("모르는 값은 그리지 않는다(null)", () => {
    expect(namuMarketStatus("???", at)).toBeNull();
  });
});

describe("증권사 경로", () => {
  it("토스 · 나무는 자기 경로, 없으면 기본 증권사 경로(옛 앱)", () => {
    expect(candlesPath("TOSS")).toBe("/v1/toss/candles");
    expect(candlesPath("NAMU")).toBe("/v1/namu/candles");
    expect(candlesPath()).toBe("/v1/securities/candles");
  });
});
