import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { i18n } from "@/shared/i18n/config";
import { KRW, MINUS, formatChartAxis, minusOf } from "./format";

describe("MINUS / minusOf", () => {
  it("부호는 U+2212 — 하이픈이 아니다", () => {
    expect(MINUS).toBe("−");
    expect(MINUS).not.toBe("-");
  });

  it("0 이면 부호가 없다 — 빈 계정의 '−0원'(QA #1)", () => {
    expect(minusOf(0)).toBe("");
    expect(`${minusOf(0)}${KRW(0)}`).toBe("0");
  });

  it("양수면 −", () => {
    expect(minusOf(7560)).toBe(MINUS);
  });

  it("음수면 + — 선결제로 총 부채가 음수가 되면 '−-356,800' 이 됐다(QA #21)", () => {
    expect(minusOf(-356800)).toBe("+");
    expect(`${minusOf(-356800)}${KRW(Math.abs(-356800))}`).toBe("+356,800");
  });

  it("KRW(0) 은 '0' — -0 이 흘러들지 않는 한 부호가 안 붙는다", () => {
    expect(KRW(0)).toBe("0");
  });
});

describe("formatChartAxis (ko)", () => {
  const orig = i18n.language;
  beforeEach(async () => {
    await i18n.changeLanguage("ko");
  });
  afterEach(async () => {
    await i18n.changeLanguage(orig);
  });

  it("1만~10만은 소수 한 자리 — 11,881 이 '1만'(−16%) 이었다(QA #38)", () => {
    expect(formatChartAxis(11881)).toBe("1.2만");
    expect(formatChartAxis(10000)).toBe("1.0만");
    expect(formatChartAxis(12500)).toBe("1.3만");
    expect(formatChartAxis(99000)).toBe("9.9만");
  });

  it("반올림해 10.0 이 되는 값은 정수 만 — 100,000 과 모양을 맞춘다", () => {
    expect(formatChartAxis(99999)).toBe("10만");
    expect(formatChartAxis(100000)).toBe("10만");
  });

  it("10만 위 구간은 그대로 정수 만/억/조 (회귀 고정)", () => {
    expect(formatChartAxis(250000)).toBe("25만");
    expect(formatChartAxis(457400)).toBe("46만");
    expect(formatChartAxis(517500000)).toBe("5.2억");
    expect(formatChartAxis(1200000000)).toBe("12억");
    expect(formatChartAxis(1.2e12)).toBe("1.2조");
    expect(formatChartAxis(5000)).toBe("5,000");
    expect(formatChartAxis(0)).toBe("0");
  });

  it("음수 부호는 U+2212 — 앱 krw.dart 와 같은 문자열", () => {
    expect(formatChartAxis(-51750000)).toBe(`${MINUS}5,175만`);
  });

  /**
   * 축 눈금 겹침 가드 — 앱 `test/core/format/formatters_locale_test.dart` 이식.
   * 소수 한 자리를 넣어도 같은 라벨이 두 번 찍히거나 축 폭을 넘지 않아야 한다.
   */
  it.each([5e4, 1e6, 3e6, 5e7, 3e8, 3e9])(
    "top=%d 축의 5눈금 라벨이 전부 다르고 8자 이하",
    (top) => {
      const labels = [0, 1, 2, 3, 4].map((i) => formatChartAxis((top * i) / 4));
      expect(new Set(labels).size).toBe(labels.length);
      for (const l of labels) expect(l.length).toBeLessThanOrEqual(8);
    },
  );
});

describe("formatChartAxis (en)", () => {
  const orig = i18n.language;
  beforeEach(async () => {
    await i18n.changeLanguage("en");
  });
  afterEach(async () => {
    await i18n.changeLanguage(orig);
  });

  it("Intl compact 그대로 — 부호도 Intl 쪽 ASCII 를 쓴다", () => {
    expect(formatChartAxis(120000000)).toBe("120M");
    expect(formatChartAxis(52000)).toBe("52K");
    expect(formatChartAxis(-52000)).toBe("-52K");
  });
});
