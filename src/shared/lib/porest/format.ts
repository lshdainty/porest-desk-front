export const KRW = (n: number, { sign = false, abs = false }: { sign?: boolean; abs?: boolean } = {}): string => {
  const v = abs ? Math.abs(n) : n
  const s = v.toLocaleString('ko-KR')
  if (sign && n > 0) return `+${s}`
  return s
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
