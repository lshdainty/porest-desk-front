import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { i18n } from "@/shared/i18n/config";
import * as format from "./format";
import { KRW, MINUS, formatChartAxis, minusOf } from "./format";
import { niceAxis, niceCeil } from "./chartAxis";

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
 *
 * 이 표는 이제 **축약하는 모든 자리**를 규정한다 — 차트 Y축·도넛 중앙·통계 추이 틱.
 * 추이 축만 따로 쓰던 `formatChartAmount` 를 지우고 여기로 모았다.
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

/**
 * 축약 자리 통일 — 통계 추이 축이 쓰던 `formatChartAmount`(만은 정수, 억은 고정 `.0`)를
 * 지우고 `formatChartAxis` 하나로 모았다. `StatsPage` 의 `fmtTick` 이 이 함수다.
 *
 * 눈금은 `chartAxis` 의 nice 값(1·2·2.5·5×10ⁿ 배수)만 들어오므로, 여기서 만드는 라벨이
 * 실제로 축에 찍히는 문자열 전부다. 축 폭은 `<YAxis width={52} />` 고정(11px 글자).
 */
describe("통계 추이 축 눈금 (fmtTick = formatChartAxis)", () => {
  const orig = i18n.language;
  beforeEach(async () => {
    await i18n.changeLanguage("ko");
  });
  afterEach(async () => {
    await i18n.changeLanguage(orig);
  });

  it("축약 함수는 하나뿐 — formatChartAmount 는 더 없다", () => {
    // 되살아나면 한 화면에서 도넛 중앙 `5억` 옆에 추이 축 `5.0억` 이 다시 선다.
    expect(Object.keys(format)).not.toContain("formatChartAmount");
  });

  it("같은 라벨을 두 번 찍지 않는다 — 만 단위를 정수로 반올림하던 게 눈금을 뭉갰다", () => {
    // 최대 12,000원짜리 축 → 눈금 [0, 5천, 1만, 1.5만, 2만].
    // 옛 규칙은 15,000 과 20,000 을 둘 다 `2만` 으로 찍어 눈금이 겹쳤다.
    expect(niceCeil(12_000).ticks.map(formatChartAxis)).toEqual([
      "0",
      "5,000",
      "1만",
      "1.5만",
      "2만",
    ]);
  });

  it("`.0` 을 남기지 않는다 — 억대 축이 `2.0억 4.0억` 이었다", () => {
    expect(niceCeil(500_000_000).ticks.map(formatChartAxis)).toEqual([
      "0",
      "2억",
      "4억",
      "6억",
      "8억",
    ]);
  });

  it("조 단위로 올린다 — 옛 규칙은 억에 눌러 담아 `10000.0억` 을 냈다", () => {
    expect(formatChartAxis(1_000_000_000_000)).toBe("1조");
    expect(formatChartAxis(2_500_000_000_000)).toBe("2.5조");
  });

  it("순저축 축(음수 포함)도 소수를 그대로 — 옛 규칙은 25,000 을 `3만` 이라 했다", () => {
    // 눈금 간격 25,000 인 축. 옛 규칙: [−3만, 0, 3만, 5만, 8만] — 눈금값과 다른 숫자다.
    expect(niceAxis(-25_000, 60_000).ticks.map(formatChartAxis)).toEqual([
      `${MINUS}2.5만`,
      "0",
      "2.5만",
      "5만",
      "7.5만",
    ]);
  });

  /**
   * 폭 가드 — 축이 만들 수 있는 눈금을 전 구간 훑어 라벨을 검사한다.
   * `1,230.5만`(콤마 + 소수)만 52px 를 넘는데, nice 눈금은 그 자리에서 항상
   * 1만의 배수라 나올 수 없다. 그 사실을 여기서 못 박는다.
   */
  it("어떤 축을 그려도 라벨이 7자 이하 — 콤마와 소수가 같이 나오지 않는다", () => {
    const labels = new Set<string>();
    for (let exp = 3; exp <= 13; exp++) {
      for (let k = 100; k < 1000; k += 7) {
        const max = Math.round((k / 100) * 10 ** exp);
        for (const ticks of [
          niceCeil(max).ticks,
          niceAxis(0, max).ticks,
          niceAxis(-max, max).ticks,
        ]) {
          const drawn = ticks.map(formatChartAxis);
          // 한 축 안에서 같은 글자가 두 번 서면 눈금을 읽을 수 없다.
          expect(new Set(drawn).size).toBe(drawn.length);
          for (const l of drawn) labels.add(l);
        }
      }
    }
    expect(labels.size).toBeGreaterThan(100);
    for (const l of labels) {
      expect(l.length).toBeLessThanOrEqual(7);
      expect(l).not.toMatch(/,.*\./);
    }
  });
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
