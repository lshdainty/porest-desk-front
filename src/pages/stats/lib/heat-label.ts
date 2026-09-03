import { formatChartAxis } from "@/shared/lib/porest/format";

/**
 * 히트맵 셀 라벨 — 좁은 칸에 들어갈 만큼 짧게.
 *
 * 축약은 **공용 `formatChartAxis` 하나만** 통과한다(만·억·조). 예전엔 1만 아래를
 * 여기서 `천` 으로 더 줄였다 — `4,900` 을 `5천` 으로. 칸이 좁다는 이유였는데,
 * `천` 은 축·도넛·추이 어디에도 없는 단위라 **같은 값이 화면마다 다른 글자**가 됐다.
 * 게다가 반올림이 거칠어 `5천` 은 실제 값에서 2% 씩 벗어난다(QA #38 과 같은 결함).
 * 단위 집합은 만·억·조 하나뿐이고, 1만 미만은 천단위 콤마 정수로 적는다(QA #73).
 *
 * 값이 없는 칸은 숫자 대신 `—`.
 */
export const heatCellLabel = (v: number): string =>
  v <= 0 ? "—" : formatChartAxis(v);
