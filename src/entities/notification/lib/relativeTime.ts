import { i18n } from '@/shared/i18n/config'

/**
 * 알림 상대시간 포맷 — Popover·Page 공용 single source(SoT 정합).
 *
 * createAt (ISO 또는 date-ms) →
 *   "방금"(<1분) / "n분 전"(<60분) / "n시간 전"(<24시간) /
 *   "어제"(1일) / "n일 전"(<7일) / "yyyy-MM-dd"(≥7일)
 * ko 회귀0: ko 는 date ns 값이 기존 literal 과 동일. en 은 date-fns 없이 문자열 키.
 */
export function relativeTime(createAt: string): string {
  const then = new Date(createAt).getTime()
  if (Number.isNaN(then)) return ''
  const diffMs = Date.now() - then
  const m = Math.floor(diffMs / 60_000)
  if (m < 1) return i18n.t('date:justNow')
  if (m < 60) return i18n.t('date:minutesAgo', { count: m })
  const h = Math.floor(m / 60)
  if (h < 24) return i18n.t('date:hoursAgo', { count: h })
  const d = Math.floor(h / 24)
  if (d === 1) return i18n.t('date:yesterday')
  if (d < 7) return i18n.t('date:daysAgo', { count: d })
  // 1주 이상 지난 건 날짜만
  return createAt.slice(0, 10)
}
