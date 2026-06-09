/**
 * Recharts 의 자동 축을 명시 nice 눈금으로 고정 — Flutter 앱(`lib/core/format/chart_axis.dart`)
 * 의 `niceAxis` 와 동일 알고리즘. `<YAxis domain={[a.min,a.max]} ticks={a.ticks} />` 로 적용하면
 * 같은 데이터에 대해 앱과 동일한 눈금이 그려진다 (0 포함 + 1·2·2.5·5×10ⁿ 딱 떨어지는 step).
 */

/** [rough] 이상이 되는 가장 가까운 "깔끔한" 간격 (1·2·2.5·5×10ⁿ). */
export function niceStep(rough: number): number {
  if (rough <= 0) return 1
  const exp = Math.floor(Math.log10(rough))
  const pow10 = Math.pow(10, exp)
  const frac = rough / pow10 // [1, 10)
  const niceFrac =
    frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 2.5 ? 2.5 : frac <= 5 ? 5 : 10
  return niceFrac * pow10
}

export interface NiceAxis {
  min: number
  max: number
  ticks: number[]
}

/**
 * 단일 Y축 — 항상 0 을 포함하고(양수는 0 부터, 음수면 0 아래로 확장),
 * 끝점·간격을 nice 값으로 ceil-tight 하게 맞춘 {min, max, ticks} 반환.
 * 예) max 60,881,200 → { min: 0, max: 80,000,000, ticks: [0,2천만,4천만,6천만,8천만] }.
 */
export function niceAxis(dataMin: number, dataMax: number, targetSteps = 4): NiceAxis {
  const lo = Math.min(0, dataMin)
  let hi = Math.max(0, dataMax)
  if (lo === hi) hi = lo + 1
  const step = niceStep((hi - lo) / targetSteps)
  const min = Math.round(Math.floor(lo / step) * step)
  const max = Math.round(Math.ceil(hi / step) * step)
  const ticks: number[] = []
  for (let v = min; v <= max + step * 0.5; v += step) ticks.push(Math.round(v))
  return { min, max, ticks }
}

export interface NiceCeil {
  max: number
  step: number
  ticks: number[]
}

/**
 * dual-axis(수입·지출)용 — 0 기준 고정 [ticks]개(기본 5) 눈금으로 ceil.
 * 좌·우 축에 각각 적용하면 둘 다 같은 개수의 균등 눈금을 가져 가로 그리드가 정렬된다.
 * 앱 `stats_screen.dart` 의 `_niceCeil` 과 동일.
 */
export function niceCeil(rawMax: number, ticks = 5): NiceCeil {
  const n = ticks - 1
  if (rawMax <= 0) {
    const step = 1 / n
    return { max: 1, step, ticks: Array.from({ length: ticks }, (_, i) => i * step) }
  }
  const roughStep = rawMax / n
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)))
  const mantissa = roughStep / magnitude
  const niceMantissa =
    mantissa <= 1 ? 1 : mantissa <= 2 ? 2 : mantissa <= 2.5 ? 2.5 : mantissa <= 5 ? 5 : 10
  const step = niceMantissa * magnitude
  const max = step * n
  return { max, step, ticks: Array.from({ length: ticks }, (_, i) => Math.round(i * step)) }
}
