/**
 * porest-design chart palette base hex ↔ light variant 매핑.
 *
 * DB (expense_category.color) 는 base hex 만 저장하는 single-source.
 * 다크모드 swap 은 CSS variable alias (`--color-cat-*`, index.css 정의) 가
 * 처리하며, 본 헬퍼는 base hex → alias var 문자열 변환을 수행한다.
 *
 * porest-tokens.css `--color-chart-*` base hex 값:
 *   red    #c73838  orange #b36418  yellow #8c7400
 *   green  #2d8060  blue   #2c70bf  indigo #5e60c8
 *   violet #8b4dba  pink   #b83b7a  brown  #9a6536  gray #6b7484
 */

export type ChartKey =
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'indigo'
  | 'violet'
  | 'pink'
  | 'brown'
  | 'gray'

export type ChartPair = {
  key: ChartKey
  /** 라이트 모드 base hex — DB 저장값 single-source. */
  base: string
  /** 다크 모드 light variant hex (참고용 — 실제 swap 은 CSS alias 가 처리). */
  light: string
  /** CSS variable alias — 라이트/다크에서 자동 swap. */
  cssVar: string
}

export const CHART_PAIRS: ChartPair[] = [
  { key: 'red',    base: '#c73838', light: '#eca0a0', cssVar: '--color-cat-red' },
  { key: 'orange', base: '#b36418', light: '#e8b266', cssVar: '--color-cat-orange' },
  { key: 'yellow', base: '#8c7400', light: '#d4b83a', cssVar: '--color-cat-yellow' },
  { key: 'green',  base: '#2d8060', light: '#6bcb86', cssVar: '--color-cat-green' },
  { key: 'blue',   base: '#2c70bf', light: '#7bbbed', cssVar: '--color-cat-blue' },
  { key: 'indigo', base: '#5e60c8', light: '#abb0f0', cssVar: '--color-cat-indigo' },
  { key: 'violet', base: '#8b4dba', light: '#d2a8ec', cssVar: '--color-cat-violet' },
  { key: 'pink',   base: '#b83b7a', light: '#eca0bc', cssVar: '--color-cat-pink' },
  { key: 'brown',  base: '#9a6536', light: '#dcb088', cssVar: '--color-cat-brown' },
  { key: 'gray',   base: '#6b7484', light: '#b5bbc5', cssVar: '--color-cat-gray' },
]

const BASE_TO_PAIR = new Map(CHART_PAIRS.map(p => [p.base.toLowerCase(), p]))

/**
 * 카테고리 색의 fg / bg 를 결정한다.
 *
 * - base hex 가 chart palette 안에 있으면 alias CSS var (다크 자동 swap)
 * - 알 수 없는 hex 는 그대로 (사용자 커스텀 색)
 * - 색 없음(undefined / null) → semantic 토큰 fallback
 */
export function getPaletteByColor(
  color: string | null | undefined,
): { color: string; bg: string } {
  if (!color) {
    // 색 없음(예: 예산 '전체' 행) — 컬러 타일과 동일하게 brand 색 @18% 틴트.
    // bg-brand-subtle(=primary base @12%) 은 다크에서 어두운 navy 라 light variant
    // 인 fg-brand-strong 기반 틴트로 통일(앱 softBg(fgBrand) 정합).
    return {
      color: 'var(--fg-brand-strong)',
      bg: 'color-mix(in oklch, var(--fg-brand-strong) 18%, transparent)',
    }
  }
  const pair = BASE_TO_PAIR.get(color.toLowerCase())
  if (pair) {
    const aliasVar = `var(${pair.cssVar})`
    return {
      color: aliasVar,
      bg: `color-mix(in oklch, ${aliasVar} 18%, transparent)`,
    }
  }
  if (/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(color)) {
    const hex =
      color.length === 4
        ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`
        : color
    return { color: hex, bg: `color-mix(in oklch, ${hex} 18%, transparent)` }
  }
  return {
    color: 'var(--fg-brand-strong)',
    bg: 'color-mix(in oklch, var(--fg-brand-strong) 18%, transparent)',
  }
}

/**
 * 색상 picker grid 표시용 entries.
 * - `color` / `bg`: UI 에 보여줄 alias var (다크 자동 swap)
 * - `baseHex`: 사용자가 swatch 를 선택했을 때 DB 에 저장할 값
 */
export const CAT_PALETTE = CHART_PAIRS.map(p => ({
  color: `var(${p.cssVar})`,
  bg: `color-mix(in oklch, var(${p.cssVar}) 18%, transparent)`,
  baseHex: p.base,
}))
