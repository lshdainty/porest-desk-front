// 토스 화면에만 있던 표기 규칙을 나무와 공용으로 끌어냈다.
// 옮기면서 값이 바뀌면 같은 금액이 화면마다 다르게 보인다 — 그 회귀를 여기서 막는다.
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { i18n } from "@/shared/i18n/config";
import { fmtByCurrency, fmtCapKRW, fmtShares, num, trendColor } from "./format";

describe("num", () => {
  it("서버가 String 으로 주는 금액을 숫자로 읽는다", () => {
    expect(num("1234.56")).toBe(1234.56);
  });

  it("없거나 숫자가 아니면 0 — 평가액 계산이 NaN 으로 번지지 않게", () => {
    expect(num(null)).toBe(0);
    expect(num(undefined)).toBe(0);
    expect(num("")).toBe(0);
    expect(num("abc")).toBe(0);
  });
});

describe("trendColor — 국내 증권 통념(상승=빨강, 하락=파랑)", () => {
  it("상승·보합은 danger, 하락은 brand", () => {
    expect(trendColor(1)).toBe("var(--status-danger-fg)");
    expect(trendColor(0)).toBe("var(--status-danger-fg)");
    expect(trendColor(-1)).toBe("var(--fg-brand)");
  });
});

describe("fmtByCurrency", () => {
  it("USD 는 소수 두 자리 달러", () => {
    expect(fmtByCurrency(123.456, "USD")).toBe("$123.46");
  });

  // 원화 표기는 **로케일마다 다르다**(ko `1,235원` / en `₩1,235`). 공용으로 끌어내면서
  // `toLocaleString()+'원'` 을 손수 만들 뻔했는데, 그러면 영어 화면에만 원이 붙는다.
  // 두 로케일을 다 박아 둬 다음에 누가 같은 지름길을 타면 여기서 깨지게 한다.
  it("KRW 는 반올림 + 로케일별 원화 표기 — 규칙을 money() 에 맡긴다", async () => {
    const before = i18n.language;
    try {
      await i18n.changeLanguage("ko");
      expect(fmtByCurrency(1234.7, "KRW")).toBe("1,235원");
      await i18n.changeLanguage("en");
      expect(fmtByCurrency(1234.7, "KRW")).toBe("₩1,235");
    } finally {
      await i18n.changeLanguage(before);
    }
  });

  it("그 밖의 통화는 통화코드를 병기한다 — 나무 해외가 늘어도 숫자만 덩그러니 남지 않게", () => {
    expect(fmtByCurrency(1234.5, "JPY")).toBe("1,234.5 JPY");
  });
});

describe("fmtByCurrency — 달러 천단위", () => {
  it("네 자리 이상 달러는 천단위를 끊는다", () => {
    expect(fmtByCurrency(11514.3, "USD")).toBe("$11,514.30");
  });

  it("소수 두 자리를 유지한다", () => {
    expect(fmtByCurrency(7412.1, "USD")).toBe("$7,412.10");
    expect(fmtByCurrency(9.5, "USD")).toBe("$9.50");
  });

  it("로케일과 무관하게 같은 표기 — en-US 고정", () => {
    expect(fmtByCurrency(1234567.891, "USD")).toBe("$1,234,567.89");
  });
});

/**
 * 시가총액·상장주식수 축약 — **앱과 같은 글자를 내야 한다.**
 *
 * 기대값은 앱 `test/core/format/formatters_locale_test.dart` 의 `chartAxis` 표와
 * 같은 규칙이다(QA #73) — 소수 첫째 자리까지, `.0` 은 뗀다, 1만 미만은 천단위 콤마.
 * 웹만 손계산이 남아 있어 두 화면이 갈려 있었다:
 *
 *   시가총액 5,000만원  웹 `1억원`   앱 `5,000만원`  ← 반올림이 값을 두 배로 부풀렸다
 *   시가총액 5,000원    웹 `0억원`   앱 `5,000원`    ← 값이 통째로 사라졌다
 *   주식수 12,345,678   웹 `1,235만 주` 앱 `1,234.6만 주`
 *   주식수 500,000,000  웹 `5.0억 주`   앱 `5억 주`
 *
 * **테스트 기본 로케일은 en 이다** — `changeLanguage("ko")` 로 고정하지 않으면
 * 한국어 축약을 단언한다면서 영어 compact 를 검사하게 된다.
 */
describe("fmtCapKRW / fmtShares — 앱과 같은 축약(ko)", () => {
  const orig = i18n.language;
  beforeEach(async () => {
    await i18n.changeLanguage("ko");
  });
  afterEach(async () => {
    await i18n.changeLanguage(orig);
  });

  it.each([
    [0, "0원"],
    [5_000, "5,000원"],
    [50_000_000, "5,000만원"],
    [99_999_999, "1억원"],
    [100_000_000, "1억원"],
    [120_000_000, "1.2억원"],
    [999_900_000_000, "9,999억원"],
    [1_234_500_000_000, "1.2조원"],
    [5_000_000_000_000, "5조원"],
  ])("시가총액 %i → %s", (v, expected) => {
    expect(fmtCapKRW(v)).toBe(expected);
  });

  it.each([
    [5_912, "5,912 주"],
    [12_345_678, "1,234.6만 주"],
    [59_000_000, "5,900만 주"],
    [500_000_000, "5억 주"],
    [1_250_000_000, "12.5억 주"],
    [5_969_782_550, "59.7억 주"],
  ])("상장주식수 %i → %s", (n, expected) => {
    expect(fmtShares(n)).toBe(expected);
  });

  // 1억 밑을 억으로 반올림하던 자리 — 5,000만원은 `1억원`, 5,000원은 `0억원` 이었다.
  // 축약이 원값보다 커지거나 0 으로 사라지면 화면이 거짓말을 한다.
  it("1억 미만을 억으로 반올림하지 않는다", () => {
    expect(fmtCapKRW(50_000_000)).not.toBe("1억원");
    expect(fmtCapKRW(5_000)).not.toBe("0억원");
  });

  // 규칙이 구간마다 바뀌지 않는다 — 어느 구간에서도 소수부 0 은 뗀다(QA #73).
  it("`.0` 을 남기지 않는다", () => {
    for (const v of [5_000_000_000_000, 500_000_000, 100_000_000, 10_000]) {
      expect(fmtCapKRW(v)).not.toContain(".0");
      expect(fmtShares(v)).not.toContain(".0");
    }
  });
});

/**
 * en — 앱 `_fmtCapKrw`·`_fmtShares` 의 분기를 그대로 미러한다.
 * 시가총액은 `₩` 를 **앞에** 붙이고(ko 는 뒤에 `원`), 주식수는 단위를 붙이지 않는다
 * (영어 화면은 행 라벨 `Shares outstanding` 이 이미 단위를 들고 있다).
 */
describe("fmtCapKRW / fmtShares (en)", () => {
  const orig = i18n.language;
  beforeEach(async () => {
    await i18n.changeLanguage("en");
  });
  afterEach(async () => {
    await i18n.changeLanguage(orig);
  });

  it("시가총액은 ₩ 를 앞에 붙인다", () => {
    expect(fmtCapKRW(50_000_000)).toBe("₩50M");
    expect(fmtCapKRW(5_000_000_000_000)).toBe("₩5T");
    expect(fmtCapKRW(50_000_000)).not.toContain("원");
  });

  it("주식수는 단위를 붙이지 않는다 — 행 라벨이 들고 있다", () => {
    expect(fmtShares(500_000_000)).toBe("500M");
    expect(fmtShares(12_345_678)).not.toContain("주");
  });
});
