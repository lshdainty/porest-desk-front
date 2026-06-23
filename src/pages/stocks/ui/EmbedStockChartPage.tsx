/**
 * 차트 임베드 페이지 — 앱 ChartWebView 등 외부 컨텍스트가 띄우는 풀블리드 차트 뷰.
 * - ProtectedRoute 밖 라우트(`/embed/stocks/:symbol`)로 인증 게이트 우회
 * - 인증은 querystring 의 60초 단명 embed_token (백엔드 POST /api/v1/auth/embed-token 발급)
 * - 글로벌 apiClient(쿠키·withCredentials·401 리다이렉트) 와 격리된 embedClient 사용
 * - JS bridge: window.PorestChart.postMessage('ready'|'error'), window.__themeBridge / __rangeBridge / __tokenBridge
 *   __tokenBridge: Dart 가 만료 전 새 embed_token 을 push → reload 없이 헤더만 교체(스피너 없는 갱신).
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import type { ApiResponse } from '@/shared/types'
import {
  type TossCandleCursorPage,
  type TossCandlePage,
} from '@/features/stock/api/stockApi'
import { LightweightStockChart, type CandleFetcher } from './LightweightStockChart'

type Range = '1D' | '1주' | '1개월' | '3개월' | '1년'
type Theme = 'light' | 'dark'

const RANGES: ReadonlyArray<Range> = ['1D', '1주', '1개월', '3개월', '1년']

interface PorestChartChannel {
  postMessage(message: string): void
}
declare global {
  interface Window {
    PorestChart?: PorestChartChannel
    __themeBridge?: (mode: Theme) => void
    __rangeBridge?: (range: Range) => void
    __tokenBridge?: (token: string) => void
  }
}

function postBridge(payload: { type: string; [k: string]: unknown }) {
  try {
    window.PorestChart?.postMessage(JSON.stringify(payload))
  } catch {
    /* WebView 미연결 (직접 브라우저로 열림) — 무시 */
  }
}

/**
 * embed 컨텍스트 전용 axios. withCredentials=false, 401 redirect 안 함.
 * Authorization 은 매 요청마다 getToken() 으로 읽어 — Dart 가 __tokenBridge 로 토큰을 갱신해도
 * 클라이언트 재생성/리로드 없이 다음 요청부터 새 토큰이 적용된다.
 */
function createEmbedClient(getToken: () => string) {
  const baseURL = `${import.meta.env.VITE_BASE_URL}${import.meta.env.VITE_API_URL}`
  const client = axios.create({
    baseURL,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: false,
  })
  client.interceptors.request.use(config => {
    config.headers.Authorization = `Bearer ${getToken()}`
    return config
  })
  client.interceptors.response.use(
    response => response.data,
    error => {
      const status = error?.response?.status
      // embed 안에서 401/403 은 부모 WebView 에 알리고 페이지 이동은 하지 않는다.
      postBridge({ type: 'error', code: status ?? 0, msg: error?.response?.data?.message ?? error?.message ?? 'error' })
      return Promise.reject(error)
    },
  )
  return client
}

function isRange(v: string | null): v is Range {
  return v !== null && (RANGES as ReadonlyArray<string>).includes(v)
}

export function EmbedStockChartPage() {
  const { symbol = '' } = useParams<{ symbol: string }>()
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const isUs = params.get('isUs') === '1' || params.get('market')?.toUpperCase() === 'US'

  const initRange: Range = isRange(params.get('range')) ? (params.get('range') as Range) : '1D'
  const initTheme: Theme = params.get('theme') === 'dark' ? 'dark' : 'light'

  const [range, setRange] = useState<Range>(initRange)
  const [theme, setTheme] = useState<Theme>(initTheme)
  // 현재 유효 토큰 — __tokenBridge 가 갱신, embedClient 가 매 요청마다 읽음(리로드 없는 토큰 회전).
  const tokenRef = useRef(token)

  // 테마 적용 — LightweightStockChart 가 cssVar('--*') 를 직접 읽으므로 documentElement 클래스로 푸시.
  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
    root.setAttribute('data-theme', theme)
    // 임베드 페이지는 자체 chrome 가 없으므로 배경 투명 — 호스트(WebView) 의 배경이 비치도록.
    document.body.style.background = 'transparent'
  }, [theme])

  // JS 채널 노출 — Dart 측 runJavaScript 가 호출
  useEffect(() => {
    window.__themeBridge = (mode: Theme) => setTheme(mode === 'dark' ? 'dark' : 'light')
    window.__rangeBridge = (r: Range) => setRange(isRange(r) ? r : '1D')
    window.__tokenBridge = (t: string) => {
      if (t) tokenRef.current = t // 다음 요청부터 새 토큰 — 차트 리로드 없음
    }
    postBridge({ type: 'ready', v: '1.0' })
    return () => {
      window.__themeBridge = undefined
      window.__rangeBridge = undefined
      window.__tokenBridge = undefined
    }
  }, [])

  const fetcher: CandleFetcher | undefined = useMemo(() => {
    if (!token) return undefined
    const client = createEmbedClient(() => tokenRef.current)
    return async (sym, interval, opts) => {
      const resp: ApiResponse<TossCandleCursorPage> = await client.get('/v1/toss/candles', {
        params: { symbol: sym, interval, size: opts.count, cursor: opts.before },
      })
      const page: TossCandlePage = {
        candles: resp.data?.content ?? [],
        nextBefore: resp.data?.meta?.nextCursor ?? null,
      }
      return page
    }
  }, [token])

  if (!symbol || !token) {
    return (
      <div style={fillCenter}>
        <span style={{ fontSize: 13, color: 'var(--fg-tertiary)' }}>차트를 표시할 수 없어요</span>
      </div>
    )
  }

  return (
    <div style={fill}>
      <LightweightStockChart
        symbol={symbol}
        isUs={isUs}
        range={range}
        height="100%"
        fetcher={fetcher}
      />
    </div>
  )
}

const fill: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'transparent',
  // WebView 안에서 시트/스크롤 부모와의 핀치/팬 충돌을 줄이기 위해 페이지 자체 스크롤·오버스크롤 비활성.
  overflow: 'hidden',
  overscrollBehavior: 'none',
}
const fillCenter: React.CSSProperties = {
  ...fill,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}
