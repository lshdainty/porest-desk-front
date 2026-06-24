/**
 * KRX 상장종목 마스터(코드↔이름) 검색 유틸.
 *
 * 데이터(~225KB, 3500여 종목)는 초기 번들에 넣지 않고 `?url` 정적 에셋으로 두어
 * 최초 검색 시 1회 fetch + 메모리 캐시한다. 종목코드는 KRX 표준 6자리라 토스 시세와 호환되며,
 * 실제 유효성(시세 제공 여부)은 연결 시 백엔드가 토스로 검증한다.
 */
import krxStocksUrl from '@/features/stock/data/krxStocks.json?url'

export interface KrxStock {
  ticker: string
  name: string
  market: string
}

let cache: KrxStock[] | null = null
let loading: Promise<KrxStock[]> | null = null

async function loadAll(): Promise<KrxStock[]> {
  if (cache) return cache
  if (!loading) {
    loading = fetch(krxStocksUrl)
      .then(r => r.json() as Promise<KrxStock[]>)
      .then(data => {
        cache = data
        return data
      })
      .catch(err => {
        loading = null // 실패 시 재시도 가능하도록
        throw err
      })
  }
  return loading
}

/** 이름 부분일치 또는 코드 일치로 검색. prefix 매칭을 우선 정렬해 상위 [limit]개 반환. */
export async function searchKrxStocks(query: string, limit = 8): Promise<KrxStock[]> {
  const q = query.trim()
  if (!q) return []
  const all = await loadAll()
  const lower = q.toLowerCase()
  const upper = q.toUpperCase()
  const matched = all.filter(
    s => s.name.toLowerCase().includes(lower) || s.ticker.includes(upper),
  )
  matched.sort((a, b) => {
    const ap = a.name.toLowerCase().startsWith(lower) || a.ticker.startsWith(upper) ? 0 : 1
    const bp = b.name.toLowerCase().startsWith(lower) || b.ticker.startsWith(upper) ? 0 : 1
    if (ap !== bp) return ap - bp
    return a.name.length - b.name.length
  })
  return matched.slice(0, limit)
}

/** 종목코드로 이름 조회 (없으면 undefined). */
export async function getKrxStockName(ticker: string): Promise<string | undefined> {
  if (!ticker) return undefined
  const all = await loadAll()
  return all.find(s => s.ticker === ticker)?.name
}
