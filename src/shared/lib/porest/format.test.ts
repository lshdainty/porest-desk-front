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

/**
 * QA #73 확정 표 — **앱과 한 글자도 갈리면 안 된다.**
 * 미러는 앱 `porest-desk-app/lib/core/format/krw.dart` 의 `formatChartAxis` 이고
 * 같은 표가 그 테스트에 들어 있다. 한 줄을 고치면 반드시 양쪽을 같이 고쳐라.
 *
 * 규칙은 전 구간 하나다 — 소수 첫째 자리까지 반올림하고 `.0` 은 뗀다.
 * 1만 미만은 단위 없이 천단위 콤마만(앱 #70 이 이걸 안 하고 있었다).
 */
const KO_TABLE: [number, string][] = [
  [0, "0"],
  [5_000, "5,000"],
  [9_999, "9,999"],
  [10_000, "1만"],
  [11_881, "1.2만"],
  [13_879, "1.4만"],
  [50_000, "5만"],
  [99_999, "10만"],
  [100_000, "10만"],
  [250_000, "25만"],
  [999_999, "100만"],
  [1_000_000, "100만"],
  [1_500_000, "150만"],
  [5_040_000, "504만"],
  [12_300_000, "1,230만"],
  [12_305_000, "1,230.5만"],
  [51_750_000, "5,175만"],
  [99_999_999, "1억"],
  [100_000_000, "1억"],
  [120_000_000, "1.2억"],
  [500_000_000, "5억"],
  [1_200_000_000, "12억"],
  [1_250_000_000, "12.5억"],
  [999_900_000_000, "9,999억"],
  [999_999_999_999, "1조"],
  [1_000_000_000_000, "1조"],
  [1_200_000_000_000, "1.2조"],
  [-51_750_000, `${MINUS}5,175만`],
  [-11_881, `${MINUS}1.2만`],
];

describe("formatChartAxis (ko)", () => {
  const orig = i18n.language;
  beforeEach(async () => {
    await i18n.changeLanguage("ko");
  });
  afterEach(async () => {
    await i18n.changeLanguage(orig);
  });

  it.each(KO_TABLE)("%d → %s", (input, expected) => {
    expect(formatChartAxis(input)).toBe(expected);
  });

  it("`.0` 을 남기지 않는다 — 합계 50,000 인 달의 도넛 중앙이 `5.0만` 이었다(QA #73)", () => {
    for (const [, out] of KO_TABLE) expect(out).not.toMatch(/\.0(만|억|조)$/);
    expect(formatChartAxis(50_000)).toBe("5만");
  });

  it("자리올림 — 반올림이 단위를 채우면 위 칸으로 올린다", () => {
    // 9,999.9999만 → 10,000.0만 이 아니라 1억.
    expect(formatChartAxis(99_999_999)).toBe("1억");
    // 9,999.99999억 → 10,000.0억 이 아니라 1조.
    expect(formatChartAxis(999_999_999_999)).toBe("1조");
    // 만 아래는 반올림이 없다 — 9,999 는 그대로 9,999.
    expect(formatChartAxis(9_999)).toBe("9,999");
  });

  it("구간별 예외가 없다 — 10억 위도, 1만~10만도 같은 규칙", () => {
    // 예전엔 10억 위가 정수 억이라 12.5억이 `13억` 으로 반올림됐다.
    expect(formatChartAxis(1_250_000_000)).toBe("12.5억");
    // 예전엔 1만~10만만 소수 한 자리라 10만 위가 정수 만이었다.
    expect(formatChartAxis(12_305_000)).toBe("1,230.5만");
  });

  it("음수 부호는 U+2212 — 앱 krw.dart 와 같은 문자열", () => {
    expect(formatChartAxis(-51_750_000)).toBe(`${MINUS}5,175만`);
    expect(formatChartAxis(-51_750_000).startsWith("-")).toBe(false);
  });

  /**
   * 축 눈금 겹침 가드 — 앱 `test/core/format/formatters_locale_test.dart` 이식.
   * 소수 한 자리를 넣어도 같은 라벨이 두 번 찍히거나 축 폭을 넘지 않아야 한다.
   */
  it.each([5e4, 1e6, 3e6, 5e7, 3e8, 3e9, 3e12])(
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
