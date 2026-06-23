/**
 * 증권 상세 캔들 차트 — TradingView Lightweight Charts(Apache-2.0) 기반.
 * 캔들스틱 + 크로스헤어 + 줌/팬 내장. 데이터는 viewport 커서 lazy-load:
 * 초기 1페이지(≤200)만 받고, 과거로 팬해 좌측 끝(logicalRange.from)이 임계치 아래로
 * 떨어지면 백엔드 nextCursor(= 토스 nextBefore)로 다음 과거 페이지를 당겨 prepend 한다.
 * (백엔드 candle 응답 = porest-core CursorResponse 단일 페이지 프록시)
 */
import { useEffect, useRef, useState } from 'react'
import {
  createChart,
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type UTCTimestamp,
  type LogicalRange,
} from 'lightweight-charts'
import { useTheme } from '@/shared/ui/theme-provider'
import { stockApi, type TossCandle } from '@/features/stock/api/stockApi'

type Range = '1D' | '1주' | '1개월' | '3개월' | '1년'

/** 기간 탭 → interval + 초기 표시 봉 수. 1D=분봉(1m), 그 외=일봉(1d). */
const RANGE_CFG: Record<Range, { interval: '1m' | '1d'; show: number }> = {
  '1D': { interval: '1m', show: 200 },
  '1주': { interval: '1d', show: 5 },
  '1개월': { interval: '1d', show: 22 },
  '3개월': { interval: '1d', show: 66 },
  '1년': { interval: '1d', show: 252 },
}

/** 백엔드 candle 한 페이지 크기(토스 상한). lazy-load 1회 요청량. */
const PAGE = 200

/** 좌측 끝에 남은 봉이 이 수 미만이면 과거 페이지를 추가 로드. */
const LOAD_THRESHOLD = 12

function cssVar(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v || fallback
}

function toCandle(c: TossCandle): CandlestickData<UTCTimestamp> | null {
  const t = Date.parse(c.timestamp)
  const open = Number.parseFloat(c.openPrice)
  const high = Number.parseFloat(c.highPrice)
  const low = Number.parseFloat(c.lowPrice)
  const close = Number.parseFloat(c.closePrice)
  if (!Number.isFinite(t) || !Number.isFinite(close)) return null
  return { time: Math.floor(t / 1000) as UTCTimestamp, open, high, low, close }
}

/** time 오름차순 + 중복(같은 timestamp) 제거 — Lightweight Charts setData 요구사항. */
function sortDedup(items: CandlestickData<UTCTimestamp>[]): CandlestickData<UTCTimestamp>[] {
  const map = new Map<number, CandlestickData<UTCTimestamp>>()
  for (const it of items) map.set(it.time as number, it)
  return [...map.values()].sort((a, b) => (a.time as number) - (b.time as number))
}

export function LightweightStockChart({
  symbol,
  isUs,
  range,
  height,
}: {
  symbol: string
  isUs: boolean
  range: Range
  height: number
}) {
  const { resolvedTheme } = useTheme()
  const wrapRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const dataRef = useRef<CandlestickData<UTCTimestamp>[]>([])
  const cursorRef = useRef<string | null>(null) // 다음 과거 페이지 커서(= 토스 nextBefore)
  const loadingRef = useRef(false)
  const noMoreRef = useRef(false)
  const reqIdRef = useRef(0) // symbol/interval 변경 시 진행 중 비동기 무효화
  const loadOlderRef = useRef<() => void>(() => {})
  const [version, setVersion] = useState(0) // 초기 로드 완료 신호(가시범위 재설정 트리거)

  const interval = RANGE_CFG[range].interval

  function applyTheme() {
    const chart = chartRef.current
    const series = seriesRef.current
    if (!chart || !series) return
    const up = cssVar('--status-danger-fg', '#e5484d') // 상승=빨강(국내 관례)
    const down = cssVar('--fg-brand', '#3b82f6') // 하락=파랑
    const grid = cssVar('--border-subtle', '#e5e7eb')
    const text = cssVar('--fg-tertiary', '#9ca3af')
    chart.applyOptions({
      layout: { textColor: text },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: grid, style: LineStyle.Dotted },
      },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderColor: grid },
      crosshair: { vertLine: { color: text }, horzLine: { color: text } },
    })
    series.applyOptions({
      upColor: up,
      downColor: down,
      borderUpColor: up,
      borderDownColor: down,
      wickUpColor: up,
      wickDownColor: down,
      priceFormat: { type: 'price', precision: isUs ? 2 : 0, minMove: isUs ? 0.01 : 1 },
    })
  }

  // 차트 생성 (마운트 1회) + lazy-load 콜백 등록
  useEffect(() => {
    if (!wrapRef.current) return
    const chart = createChart(wrapRef.current, {
      autoSize: true,
      layout: { background: { type: ColorType.Solid, color: 'transparent' }, attributionLogo: true },
      crosshair: { mode: CrosshairMode.Normal },
      handleScale: true,
      handleScroll: true,
      rightPriceScale: { scaleMargins: { top: 0.12, bottom: 0.08 } },
    })
    const series = chart.addSeries(CandlestickSeries, {})
    chartRef.current = chart
    seriesRef.current = series
    applyTheme()

    const ts = chart.timeScale()
    const onRange = (lr: LogicalRange | null) => {
      if (lr && lr.from < LOAD_THRESHOLD) loadOlderRef.current()
    }
    ts.subscribeVisibleLogicalRangeChange(onRange)
    return () => {
      ts.unsubscribeVisibleLogicalRangeChange(onRange)
      chart.remove()
      chartRef.current = null
      seriesRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 테마/종목 변경 시 색·가격정밀도(isUs) 재적용 (canvas 라 CSS var 직접 못 씀 → 재해석)
  useEffect(() => {
    applyTheme()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedTheme, isUs])

  // 심볼/interval 변경 → 데이터 리셋 + 초기 1페이지 로드
  useEffect(() => {
    if (!symbol || !seriesRef.current) return
    const reqId = ++reqIdRef.current
    dataRef.current = []
    cursorRef.current = null
    noMoreRef.current = false
    loadingRef.current = true
    seriesRef.current.setData([])
    chartRef.current?.applyOptions({
      timeScale: { timeVisible: interval === '1m', secondsVisible: false },
    })

    stockApi
      .getCandles(symbol, interval, { count: PAGE })
      .then(page => {
        if (reqId !== reqIdRef.current || !seriesRef.current) return
        const arr = sortDedup(
          page.candles.map(toCandle).filter((x): x is CandlestickData<UTCTimestamp> => x !== null),
        )
        dataRef.current = arr
        cursorRef.current = page.nextBefore
        noMoreRef.current = !page.nextBefore
        seriesRef.current.setData(arr)
        setVersion(v => v + 1)
      })
      .catch(() => {
        /* 키 미등록/에러 → 빈 차트 */
      })
      .finally(() => {
        if (reqId === reqIdRef.current) loadingRef.current = false
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, interval])

  // 과거 1페이지를 당겨 prepend. 새 봉이 0이면(중복/커서 경계) 진행 없음 → 종료. 충전용 Promise 반환.
  const loadOlder = async (): Promise<void> => {
    if (loadingRef.current || noMoreRef.current || !cursorRef.current || !seriesRef.current) return
    const reqId = reqIdRef.current
    loadingRef.current = true
    try {
      const page = await stockApi.getCandles(symbol, interval, { count: PAGE, before: cursorRef.current })
      if (reqId !== reqIdRef.current || !seriesRef.current) return
      const older = page.candles
        .map(toCandle)
        .filter((x): x is CandlestickData<UTCTimestamp> => x !== null)
      const prevLen = dataRef.current.length
      const merged = sortDedup([...older, ...dataRef.current])
      if (merged.length === prevLen) {
        // 새 봉 0개(전부 중복) → 커서가 남아도 종료해 진행 없는 헛 요청 누적을 막는다.
        noMoreRef.current = true
        return
      }
      dataRef.current = merged
      cursorRef.current = page.nextBefore
      noMoreRef.current = !page.nextBefore
      seriesRef.current.setData(merged) // setData 는 가시 시간범위를 보존 → 스크롤 위치 유지
    } catch {
      /* 유지 */
    } finally {
      if (reqId === reqIdRef.current) loadingRef.current = false
    }
  }
  // 마운트시 등록한 onRange 콜백이 최신 loadOlder 를 가리키도록 매 렌더 갱신
  loadOlderRef.current = () => {
    void loadOlder()
  }

  // 요청한 show 봉을 채울 때까지 과거 페이지를 반복 로드한 뒤 가시범위를 확정한다.
  // setData 가 가시범위를 보존해 onRange 자동 트리거가 1회로 끝나는 한계를 명시적 루프로 보완.
  const fillToShow = async (show: number): Promise<void> => {
    let guard = 0
    while (dataRef.current.length < show && cursorRef.current && !noMoreRef.current && guard < 12) {
      await loadOlder()
      guard += 1
    }
    const chart = chartRef.current
    const len = dataRef.current.length
    if (chart && len > 0) {
      chart.timeScale().setVisibleLogicalRange({ from: Math.max(0, len - show), to: len - 1 })
    }
  }

  // 기간 탭 또는 초기 로드 완료 → 가시범위를 최근 show 봉으로 맞추고 부족분을 채움
  useEffect(() => {
    const chart = chartRef.current
    const len = dataRef.current.length
    if (!chart || len === 0) return
    const show = RANGE_CFG[range].show
    chart.timeScale().setVisibleLogicalRange({ from: Math.max(0, len - show), to: len - 1 })
    void fillToShow(show)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, version])

  return <div ref={wrapRef} style={{ width: '100%', height }} />
}
