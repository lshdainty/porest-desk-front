/**
 * 차트 임베드 페이지 — 앱 ChartWebView 등 외부 컨텍스트가 띄우는 풀블리드 차트 뷰.
 * - ProtectedRoute 밖 라우트(`/embed/stocks/:symbol`)로 인증 게이트 우회
 * - 인증은 60초 단명 embed_token (백엔드 POST /api/v1/auth/embed-token 발급)
 * - 글로벌 apiClient(쿠키·withCredentials·401 리다이렉트) 와 격리된 embedClient 사용
 * - JS bridge: window.PorestChart.postMessage('ready'|'error'), window.__themeBridge / __rangeBridge / __tokenBridge
 *
 * 토큰은 **브릿지로 받는다 — 쿼리스트링이 아니다.**
 * URL 에 실린 시크릿은 아무도 "남기겠다" 고 결정한 적 없는 곳에 남는다(nginx 요청줄 ·
 * 같은 오리진이라 full URL 이 붙는 Referer · WebView 히스토리). 그래서 순서를 뒤집었다 —
 * 페이지가 먼저 ready 를 알리고, 호스트가 __tokenBridge 로 첫 토큰을 밀어넣는다.
 * 회전 토큰이 이미 다니던 길이라 새 배선이 아니다.
 *
 * 토큰이 오기 전에는 차트를 마운트하지 않는다. LightweightStockChart 의 로드 이펙트 deps 는
 * [symbol, interval] 이라 fetcher 가 나중에 바뀌어도 재조회가 안 걸리고, fetcher 없이 마운트하면
 * 기본값인 쿠키 클라이언트로 조회해 버린다(임베드엔 쿠키가 없다).
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import axios from 'axios'
import type { ApiResponse } from '@/shared/types'
import {
  type TossCandleCursorPage,
  type TossCandlePage,
} from '@/features/stock/api/stockApi'
import { LightweightStockChart, type CandleFetcher } from '@/features/stock/ui/LightweightStockChart'

type Range = '1D' | '1주' | '1개월' | '3개월' | '1년'
type Theme = 'light' | 'dark'

const RANGES: ReadonlyArray<Range> = ['1D', '1주', '1개월', '3개월', '1년']

/**
 * 브릿지 토큰을 이만큼 기다려도 안 오면 "차트를 볼 수 없어요" 를 띄운다.
 * 호스트가 ready 를 못 받았거나(로드 실패) 브라우저로 직접 열린 경우 — 빈 화면으로 영원히
 * 매달려 있지 않게 하는 안전장치다. 늦게라도 토큰이 오면 아래 gate 가 풀려 차트가 뜬다.
 */
const TOKEN_WAIT_MS = 8000

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
 * Authorization 은 매 요청마다 getToken() 으로 읽어 — 호스트가 __tokenBridge 로 토큰을 갱신해도
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
  const { t } = useTranslation('stocks')
  const isUs = params.get('isUs') === '1' || params.get('market')?.toUpperCase() === 'US'

  // range·theme·isUs 는 시크릿이 아니고 **첫 페인트 전에** 필요하다(테마 깜빡임 · 잘못된 기간으로
  // 첫 조회). 브릿지는 mount 뒤에야 도는 길이라 이 셋은 계속 쿼리로 받는다.
  const initRange: Range = isRange(params.get('range')) ? (params.get('range') as Range) : '1D'
  const initTheme: Theme = params.get('theme') === 'dark' ? 'dark' : 'light'

  // 레거시 호환 — 토큰을 아직 쿼리로 싣는 옛 앱 빌드. 스토어를 안 쓰는 앱이라 옛 빌드가 필드에
  // 남아 있고, 여기서 안 받으면 그 앱들의 차트가 그냥 죽는다. 앱 최소 빌드가 브릿지 릴리스를
  // 넘어서면 이 줄을 지운다. (여기서 읽는다고 노출이 늘지는 않는다 — 실은 쪽은 앱이다.)
  const urlToken = params.get('token') ?? ''

  const [range, setRange] = useState<Range>(initRange)
  const [theme, setTheme] = useState<Theme>(initTheme)
  // 현재 유효 토큰 — __tokenBridge 가 갱신, embedClient 가 매 요청마다 읽음(리로드 없는 토큰 회전).
  const tokenRef = useRef(urlToken)
  // 토큰이 "있다" 만 state 로 둔다. 45초 회전마다 값을 state 에 넣으면 리렌더가 도는데,
  // setState 는 같은 값이면 리렌더를 건너뛰므로 첫 토큰에서 한 번만 gate 가 열린다.
  const [hasToken, setHasToken] = useState(urlToken !== '')
  const [waitedTooLong, setWaitedTooLong] = useState(false)

  // 테마 적용 — LightweightStockChart 가 cssVar('--*') 를 직접 읽으므로 documentElement 클래스로 푸시.
  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
    root.setAttribute('data-theme', theme)
    // 임베드는 호스트(앱 PCard) 위에 투명하게 얹혀야 한다. index.css 가 html·body 에 --bg-canvas 를
    // 깔므로 html/body/#root 배경을 모두 inline 으로 투명 override (inline 이 스타일시트보다 우선).
    root.style.background = 'transparent'
    document.body.style.background = 'transparent'
    const mount = document.getElementById('root')
    if (mount) mount.style.background = 'transparent'
  }, [theme])

  // JS 채널 노출 — 호스트(Dart) 측 runJavaScript 가 호출.
  // 브릿지를 **먼저** 붙이고 그 다음 ready 를 알린다. 순서가 뒤집히면 호스트가 ready 를 받고
  // 곧바로 부른 __tokenBridge 가 undefined 라 첫 토큰이 통째로 유실된다.
  useEffect(() => {
    window.__themeBridge = (mode: Theme) => setTheme(mode === 'dark' ? 'dark' : 'light')
    window.__rangeBridge = (r: Range) => setRange(isRange(r) ? r : '1D')
    window.__tokenBridge = (tok: string) => {
      if (!tok) return
      tokenRef.current = tok // 다음 요청부터 새 토큰 — 차트 리로드 없음
      setHasToken(true) // 첫 토큰이면 gate 를 연다. 이후 회전은 같은 값이라 리렌더 없음
    }
    postBridge({ type: 'ready', v: '1.0' })
    return () => {
      window.__themeBridge = undefined
      window.__rangeBridge = undefined
      window.__tokenBridge = undefined
    }
  }, [])

  // 토큰 대기 타임아웃 — 안 오면 안내를 띄운다(빈 화면으로 매달리지 않게).
  useEffect(() => {
    if (hasToken) return
    const id = window.setTimeout(() => setWaitedTooLong(true), TOKEN_WAIT_MS)
    return () => window.clearTimeout(id)
  }, [hasToken])

  const fetcher: CandleFetcher | undefined = useMemo(() => {
    if (!hasToken) return undefined
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
  }, [hasToken])

  if (!symbol || (!hasToken && waitedTooLong)) {
    return (
      <div style={fillCenter}>
        <span style={{ fontSize: 13, color: 'var(--fg-tertiary)' }}>{t('embed.chartUnavailable')}</span>
      </div>
    )
  }

  // 토큰 대기 중 — 호스트가 이미 스켈레톤을 깔고 있으므로 투명한 빈 판으로 둔다.
  if (!fetcher) return <div style={fill} />

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
