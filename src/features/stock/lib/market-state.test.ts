import { describe, expect, it } from "vitest";

import {
  clock12,
  clockAt,
  marketLookup,
  marketState,
  sessionInstant,
  tradeClock,
} from "./market-state";

// 시험 시계는 늘 `now` 를 넘겨 고정한다 — 벽시계를 타지 않는다(pinned-clock).
// 입력은 실제 계약 모양 — 토스 market-calendar 는 `+09:00` 오프셋이 붙은 ISO date-time 이다.
const KST = (iso: string) => new Date(`${iso}+09:00`);
const KR = {
  startTime: "2026-10-29T09:00:00+09:00",
  endTime: "2026-10-29T15:30:00+09:00",
};
// 미국 정규장 — 한국 시각 22:30 ~ 다음 날 05:00(자정을 넘는다)
const US = {
  startTime: "2026-10-29T22:30:00+09:00",
  endTime: "2026-10-30T05:00:00+09:00",
};

describe("clock12 — 시각은 오전 · 오후 12시간, 초는 쓰지 않는다", () => {
  it("한국어: 13:00 → 오후 1:00", () => {
    expect(clock12("13:00")).toBe("오후 1:00");
    expect(clock12("22:30")).toBe("오후 10:30");
  });
  it("정오 · 자정", () => {
    expect(clock12("12:00")).toBe("오후 12:00");
    expect(clock12("00:00")).toBe("오전 12:00");
  });
  it("초가 딸려 와도 떼고 분까지(체결 시각 오후 12:59)", () => {
    expect(clock12("12:59:10")).toBe("오후 12:59");
  });
  it("읽지 못하면 그대로", () => {
    expect(clock12("장마감")).toBe("장마감");
  });
});

describe("sessionInstant — 세션 글을 한 순간으로", () => {
  it("오프셋 붙은 ISO 는 그대로 그 순간", () => {
    expect(sessionInstant(US.startTime)!.toISOString()).toBe(
      "2026-10-29T13:30:00.000Z",
    );
  });
  it("옛 'HH:MM:SS' 는 달력의 그날 한국 시각으로(폴백)", () => {
    expect(sessionInstant("09:00:00", "2026-10-29")!.toISOString()).toBe(
      "2026-10-29T00:00:00.000Z",
    );
  });
  it("날짜 없는 폴백 · 읽지 못하는 글 · 빈 값은 null", () => {
    expect(sessionInstant("09:00:00")).toBeNull();
    expect(sessionInstant("장중", "2026-10-29")).toBeNull();
    expect(sessionInstant(null)).toBeNull();
  });
  it("변환은 한 번 — 이미 한국 시각이라 서머타임이 끝난 날도 22:30 은 22:30", () => {
    const at = sessionInstant("2026-11-02T22:30:00+09:00")!;
    expect(clockAt(at)).toBe("22:30");
  });
});

describe("marketState — 한 순간끼리 견주고 보이는 시각은 한국 시각", () => {
  it("국내 장중 → '장중 · 오후 1:00'", () => {
    expect(marketState(KR, "2026-10-29", KST("2026-10-29T13:00:00"))).toEqual({
      open: true,
      labelKey: "market.live",
      time: "오후 1:00",
    });
  });
  it("국내 장 시작 전 → '개장 오전 9:00' · 장마감", () => {
    expect(marketState(KR, "2026-10-29", KST("2026-10-29T08:00:00"))).toEqual({
      open: false,
      labelKey: "market.preopen",
      time: "오전 9:00",
    });
    expect(
      marketState(KR, "2026-10-29", KST("2026-10-29T16:00:00")).labelKey,
    ).toBe("market.afterClose");
  });
  it("미국 개장 전(한국 13:00) → '개장 오후 10:30' — 변환 없이 받은 한국 시각 그대로", () => {
    expect(marketState(US, "2026-10-28", KST("2026-10-29T13:00:00"))).toEqual({
      open: false,
      labelKey: "market.preopen",
      time: "오후 10:30",
    });
  });
  it("서머타임이 끝난 뒤에도 같은 계약 — 값이 22:30 이면 오후 10:30(서버가 주는 대로)", () => {
    const winter = {
      startTime: "2026-11-02T23:30:00+09:00",
      endTime: "2026-11-03T06:00:00+09:00",
    };
    expect(
      marketState(winter, "2026-11-02", KST("2026-11-02T13:00:00")).time,
    ).toBe("오후 11:30");
  });
  it("자정을 넘는 미국 장중 — 한국 저녁 11시와 새벽 3시 모두 열림", () => {
    expect(marketState(US, "2026-10-28", KST("2026-10-29T23:00:00"))).toEqual({
      open: true,
      labelKey: "market.live",
      time: "오후 11:00",
    });
    expect(marketState(US, "2026-10-28", KST("2026-10-30T03:00:00")).open).toBe(
      true,
    );
  });
  it("자정 넘김 장 — 끝 +1분은 장마감", () => {
    expect(
      marketState(US, "2026-10-28", KST("2026-10-30T05:01:00")).labelKey,
    ).toBe("market.afterClose");
  });
  it("경계 — 시작 · 끝 정각은 열림", () => {
    expect(marketState(KR, "2026-10-29", KST("2026-10-29T09:00:00")).open).toBe(
      true,
    );
    expect(marketState(KR, "2026-10-29", KST("2026-10-29T15:30:00")).open).toBe(
      true,
    );
  });
  it("옛 'HH:MM:SS' 폴백 — 그날 한국 시각, 끝이 시작보다 이르면 자정 넘김", () => {
    const old = { startTime: "22:30:00", endTime: "05:00:00" };
    expect(
      marketState(old, "2026-10-29", KST("2026-10-29T23:00:00")).open,
    ).toBe(true);
    expect(
      marketState(old, "2026-10-29", KST("2026-10-30T03:00:00")).open,
    ).toBe(true);
    expect(marketState(old, "2026-10-29", KST("2026-10-29T13:00:00"))).toEqual({
      open: false,
      labelKey: "market.preopen",
      time: "오후 10:30",
    });
  });
  it("세션이 없다고 달력이 말하면 휴장", () => {
    expect(marketState(null, "2026-10-29").labelKey).toBe("market.holiday");
  });
  it("실제 응답을 'HH:MM' 로 잘라 읽으면 '2026-' 이 되던 오독이 없다(늘 휴장이던 결함)", () => {
    expect(
      marketState(KR, "2026-10-29", KST("2026-10-29T13:00:00")).labelKey,
    ).not.toBe("market.holiday");
  });
});

describe("marketLookup — 달력을 모르면 상태를 지어내지 않는다(검수 H4)", () => {
  const pick = (d: { session: typeof KR | null; date: string }) => d;
  it("아직 못 받았다(로딩) → pending", () => {
    expect(marketLookup({ data: undefined, isError: false }, pick)).toEqual({
      pending: true,
    });
  });
  it("실패했고 받아 둔 값이 없다 → null(줄에서 뺀다) — 휴장이 아니다", () => {
    expect(marketLookup({ data: undefined, isError: true }, pick)).toBeNull();
  });
  it("받았다 → 판정(세션 없음은 휴장)", () => {
    expect(
      marketLookup(
        { data: { session: null, date: "2026-10-29" }, isError: false },
        pick,
      ),
    ).toMatchObject({ open: false, labelKey: "market.holiday" });
  });
  it("받아 둔 값이 있으면 폴링 실패(isError)여도 그 값으로 판정한다", () => {
    expect(
      marketLookup(
        { data: { session: KR, date: "2026-10-29" }, isError: true },
        pick,
      ),
    ).not.toBeNull();
  });
});

describe("tradeClock — 체결 시각은 한국 시각(장 상태와 같은 기준) · 분까지", () => {
  it("+09:00 은 그대로 → 오후 12:59", () => {
    expect(tradeClock("2026-10-29T12:59:10+09:00")).toBe("오후 12:59");
  });
  it("거래소 현지 오프셋(-04:00)은 한국 시각으로 — 나무 미국 체결이 '오전 10:30' 으로 보이지 않는다", () => {
    expect(tradeClock("2026-10-29T10:30:05-04:00")).toBe("오후 11:30");
  });
  it("Z(UTC)도 한국 시각으로", () => {
    expect(tradeClock("2026-10-29T03:00:00Z")).toBe("오후 12:00");
  });
  it("오프셋이 없으면 쓰인 벽시계 그대로 · 읽지 못하면 원문 · 없으면 빈 글", () => {
    expect(tradeClock("2026-10-29T13:05:09")).toBe("오후 1:05");
    expect(tradeClock("장중")).toBe("장중");
    expect(tradeClock(null)).toBe("");
  });
});
