import { i18n } from '@/shared/i18n/config'

/** 현재 로케일이 영어인지. 순수 함수라 React 밖에서도 i18n.language 직접 참조. */
const isEn = (): boolean => (i18n.language ?? '').startsWith('en')

export const KRW = (n: number, { sign = false, abs = false }: { sign?: boolean; abs?: boolean } = {}): string => {
  const v = abs ? Math.abs(n) : n
  const s = v.toLocaleString('ko-KR')
  if (sign && n > 0) return `+${s}`
  return s
}

/**
 * 통화 표기 — ko `10,000원`(기존 `${KRW(n)}원`과 100% 동일) / en `₩10,000`.
 * KRW 숫자부(부호·abs 포함)를 재사용하고, en 은 선행 부호 뒤에 ₩ 삽입(`-₩10,000`).
 * ko 회귀0: ko 분기는 `${KRW(n, opts)}원` 그대로.
 */
export const money = (n: number, opts: { sign?: boolean; abs?: boolean } = {}): string => {
  const s = KRW(n, opts)
  if (!isEn()) return `${s}원`
  const m = /^([+-]?)(.*)$/.exec(s)
  return m ? `${m[1]}₩${m[2]}` : `₩${s}`
}

/**
 * 차트 Y축 라벨 — ko 한국어 단위 축약(억/만) + 100만 단위 round / en `Intl.NumberFormat(compact)`(120M·52K).
 * 음수도 부호 prepend. 예: ko -517,500,000 → "-5,200만"·1,200,000,000 → "12.0억".
 * ko 회귀0: ko 분기는 기존 로직 그대로. App asset_detail_dialog.dart `_fmtAxisNum` 와 정합.
 */
export const formatChartAxis = (v: number): string => {
  const sign = v < 0 ? '-' : ''
  const n = Math.abs(v)
  if (isEn()) {
    return `${sign}${new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n)}`
  }
  if (n >= 100_000_000) return `${sign}${(n / 100_000_000).toFixed(1)}억`
  if (n >= 10_000) {
    const mil = Math.round(n / 1_000_000) * 100
    return `${sign}${mil.toLocaleString('ko-KR')}만`
  }
  return `${sign}${n.toLocaleString('ko-KR')}`
}

export const formatDay = (dStr: string) => {
  const parts = dStr.split('-').map(Number)
  const y = parts[0] ?? 1970
  const m = parts[1] ?? 1
  const d = parts[2] ?? 1
  const dt = new Date(y, m - 1, d)
  const days = ['일', '월', '화', '수', '목', '금', '토']
  return { md: `${m}월 ${d}일`, dow: days[dt.getDay()] ?? '', dt }
}

/**
 * Returns ISO_LOCAL_DATE_TIME string "YYYY-MM-DDTHH:mm:ss" based on local time.
 * Safe to send to a Java LocalDateTime endpoint (no timezone suffix).
 */
export const toLocalIso = (d: Date = new Date()): string => {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}
