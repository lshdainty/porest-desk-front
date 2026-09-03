// 히트맵 셀은 축약을 직접 계산하고 있었다 — 1만 아래를 `${Math.round(v/1000)}천`.
//
// `천` 은 합의한 단위 집합(만·억·조)에 없다. 그래서 같은 4,900 원이 히트맵에선
// `5천`, 바로 위 도넛 중앙과 추이 축에선 `4,900` 으로 갈렸고, 반올림이 거칠어
// 라벨이 실제 값에서 2% 벗어났다(QA #38 과 같은 결함, QA #73 이 정한 규칙 위반).
//
// 값의 표(11,881 → `1.2만` …)는 `shared/lib/porest/format.test.ts` 가 들고 있다.
// 여기서 고정하는 건 **셀 라벨이 그 함수를 실제로 통과하느냐** 다.
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { i18n } from "@/shared/i18n/config";
import { formatChartAxis } from "@/shared/lib/porest/format";
import { heatCellLabel } from "./heat-label";

// 테스트 기본 로케일은 en 이다 — ko 로 고정하지 않으면 영어 출력을 검사하게 된다.
const orig = i18n.language;
beforeEach(async () => {
  await i18n.changeLanguage("ko");
});
afterEach(async () => {
  await i18n.changeLanguage(orig);
});

describe("히트맵 셀 라벨", () => {
  it("`천` 을 쓰지 않는다 — 1만 미만은 천단위 콤마 정수", () => {
    expect(heatCellLabel(4_900)).toBe("4,900");
    expect(heatCellLabel(9_999)).toBe("9,999");
    for (const v of [1_000, 4_900, 5_400, 9_999])
      expect(heatCellLabel(v)).not.toContain("천");
  });

  it("1만 위는 만·억·조 — 공용 함수와 한 글자도 다르지 않다", () => {
    for (const v of [10_000, 11_881, 12_305_000, 120_000_000, 1.2e12])
      expect(heatCellLabel(v)).toBe(formatChartAxis(v));
  });

  it("값이 없는 칸은 숫자가 아니라 `—`", () => {
    expect(heatCellLabel(0)).toBe("—");
    expect(heatCellLabel(-1)).toBe("—");
  });
});
