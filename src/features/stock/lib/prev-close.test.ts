import { describe, expect, it } from "vitest";

import { dateKeyIn, prevCloseOf, todayKeyIn } from "./prev-close";

const KST = (iso: string) => new Date(`${iso}+09:00`);
const bar = (timestamp: string, closePrice: string) => ({
  timestamp,
  closePrice,
});

describe("prevCloseOf — 순서를 가정하지 않고 시각으로 정렬한 뒤 오늘 봉이 아닌 가장 최근 봉", () => {
  // 오늘 15,200 · 어제 15,150 · 그제 14,900
  const NEWEST_FIRST = [
    bar("2026-10-29T00:00:00+09:00", "15200"),
    bar("2026-10-28T00:00:00+09:00", "15150"),
    bar("2026-10-27T00:00:00+09:00", "14900"),
  ];
  const now = KST("2026-10-29T13:00:00");

  it("토스 문서대로 최신순(배열 첫 요소가 가장 최근) → 어제 15,150(그제 14,900 아님)", () => {
    expect(prevCloseOf(NEWEST_FIRST, "Asia/Seoul", now)).toBe(15150);
  });
  it("오름차순으로 와도 같은 값 — 순서 가정이 없다", () => {
    expect(prevCloseOf([...NEWEST_FIRST].reverse(), "Asia/Seoul", now)).toBe(
      15150,
    );
  });
  it("섞인 순서도 같은 값", () => {
    const [a, b, c] = NEWEST_FIRST;
    expect(prevCloseOf([b!, c!, a!], "Asia/Seoul", now)).toBe(15150);
  });
  it("장 시작 전(오늘 봉이 아직 없다)이면 가장 최근 봉이 곧 전일", () => {
    expect(prevCloseOf(NEWEST_FIRST.slice(1), "Asia/Seoul", now)).toBe(15150);
  });
  it("머리 증감이 어긋나던 경우 — 옳은 '▲ 50원 · 0.33%' 의 기준", () => {
    const prev = prevCloseOf(NEWEST_FIRST, "Asia/Seoul", now)!;
    expect(15200 - prev).toBe(50);
    expect(((15200 - prev) / prev) * 100).toBeCloseTo(0.33, 2);
  });
  it("봉이 없으면 null · 전부 오늘 봉(신규 상장 첫날)이어도 null — 오늘 봉으로 지어내지 않는다", () => {
    expect(prevCloseOf([], "Asia/Seoul", now)).toBeNull();
    expect(prevCloseOf([NEWEST_FIRST[0]!], "Asia/Seoul", now)).toBeNull();
  });
  it("종가를 읽지 못하면 null", () => {
    expect(
      prevCloseOf([bar("2026-10-28T00:00:00+09:00", "n/a")], "Asia/Seoul", now),
    ).toBeNull();
  });
});

describe("미국 종목 — 오늘은 미국 현지 날짜(1d 봉은 현지 자정 고정)", () => {
  const NY = "America/New_York";
  // 한국 3/26 01:00 = 뉴욕 3/25 11:00(장중, EDT)
  const now = KST("2026-03-26T01:00:00");
  const bars = [
    bar("2026-03-25T00:00:00-04:00", "185.42"), // 오늘 봉(뉴욕 3/25)
    bar("2026-03-24T00:00:00-04:00", "183.10"), // 전일
    bar("2026-03-23T00:00:00-04:00", "181.00"),
  ];
  it("한국 날짜(3/26)로 가르면 오늘 봉을 전일로 집던 결함 — 뉴욕 날짜로 가르면 183.10", () => {
    expect(todayKeyIn(NY, now)).toBe("2026-03-25");
    expect(prevCloseOf(bars, NY, now)).toBe(183.1);
    // 같은 입력을 한국 시간대로 가르면 오늘 봉(185.42)이 전일이 된다 — 이 결함을 잠근다
    expect(prevCloseOf(bars, "Asia/Seoul", now)).toBe(185.42);
  });
  it("봉 시각이 한국 오프셋이어도 뉴욕 날짜로 읽는다(+09:00 로 와도 같은 순간)", () => {
    // 뉴욕 3/25 자정(EDT) = 한국 3/25 13:00
    expect(dateKeyIn("2026-03-25T13:00:00+09:00", NY)).toBe("2026-03-25");
  });
});

describe("dateKeyIn · todayKeyIn", () => {
  it("오프셋 없는 글은 쓰인 날짜 그대로", () => {
    expect(dateKeyIn("2026-10-29T00:00:00", "America/New_York")).toBe(
      "2026-10-29",
    );
  });
  it("오프셋이 있으면 그 순간의 tz 날짜", () => {
    expect(dateKeyIn("2026-10-28T23:30:00Z", "Asia/Seoul")).toBe("2026-10-29");
  });
  it("todayKeyIn 은 tz 별로 다르다", () => {
    const now = KST("2026-10-29T03:00:00");
    expect(todayKeyIn("Asia/Seoul", now)).toBe("2026-10-29");
    expect(todayKeyIn("America/New_York", now)).toBe("2026-10-28");
  });
});
