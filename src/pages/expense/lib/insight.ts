import { formatChartAxis, isEn } from "@/shared/lib/porest/format";

/**
 * 지난달 대비 차액이 이보다 작으면 금액을 말하지 않고 "비슷하게 쓰고 있어요" 로 넘긴다.
 *
 * 예전엔 `Math.abs(Math.round(diff / 10000)) < 1` 이 이 문턱이었다 — 만원 반올림의
 * 부산물이라 값이 코드에 안 적혀 있었다. 반올림을 걷어내면서 같은 5,000 원을
 * 이름 있는 상수로 남긴다(문턱 자체는 그대로다).
 */
export const INSIGHT_SAME_MAX = 5_000;

/**
 * "지난달보다 {{amount}} 덜/더 쓰는 중" 문장에 넣을 금액.
 *
 * 축약은 **공용 `formatChartAxis` 하나만** 통과한다. 예전엔 여기서 `KRW(Math.round(
 * diff / 10000))만원` 으로 만원 반올림을 했다 — 11,881 원 차이가 `1만원` 이 되어
 * 문장이 실제보다 16% 적게 말했다(QA #38). 지금은 `1.2만원` 이다.
 *
 * 단위는 문장 안이라 반드시 붙인다 — ko 는 뒤에 `원`, en 은 앞에 `₩`
 * (`money()` 와 같은 자리 규칙이고, 숫자부만 축약된 값이다).
 */
export const insightDiffAmount = (diff: number): string => {
  const short = formatChartAxis(Math.abs(diff));
  return isEn() ? `₩${short}` : `${short}원`;
};
