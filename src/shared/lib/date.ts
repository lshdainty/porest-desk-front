import { format, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, isToday, isSameDay, isSameMonth } from 'date-fns'
import { ko, enUS } from 'date-fns/locale'
import { i18n } from '@/shared/i18n/config'

// 로케일 소스 = i18n.language(SoT). ko('ko'/'ko-KR'/미정) → ko, en → enUS.
const isEnLocale = (): boolean => (i18n.language ?? '').startsWith('en')

export const getLocale = () => (isEnLocale() ? enUS : ko)

export const formatDate = (date: Date | string, formatStr: string = 'yyyy-MM-dd') => {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, formatStr, { locale: getLocale() })
}

// ── 로케일 대응 날짜 헬퍼 ──────────────────────────────────────────────────
// ko 는 기존 인라인과 100% 바이트 동일한 literal 을 그대로 유지하고, en 만 date-fns 로
// 분기한다(ko 회귀0). 페이지/다이얼로그 인라인 요일·월일 포맷 중복 제거용 허브.

const DOW_KO = ['일', '월', '화', '수', '목', '금', '토']
const DOW_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** 'YYYY-MM-DD'(또는 datetime) 문자열 / Date → 로컬 Date. 문자열은 TZ shift 없이 파싱. */
const toDate = (input: Date | string): Date => {
  if (input instanceof Date) return input
  const [y, m, d] = input.slice(0, 10).split('-').map(Number)
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1)
}

/** 로케일 단축 요일 배열(일~토 / Sun~Sat). 캘린더 헤더 등. */
export const getWeekDays = (): string[] => (isEnLocale() ? DOW_EN : DOW_KO)

/** 단일 요일 라벨 — ko "수" / en "Wed". */
export const weekdayShort = (input: Date | string): string => getWeekDays()[toDate(input).getDay()] ?? ''

/** ko "M월 D일"(pad 시 "07월 08일") / en "Jul 8". */
export const formatMonthDay = (input: Date | string, opts: { pad?: boolean } = {}): string => {
  const d = toDate(input)
  if (isEnLocale()) return format(d, 'MMM d', { locale: enUS })
  const m = d.getMonth() + 1
  const day = d.getDate()
  return opts.pad
    ? `${String(m).padStart(2, '0')}월 ${String(day).padStart(2, '0')}일`
    : `${m}월 ${day}일`
}

/** ko "M월 D일 (수)" / en "Jul 8 (Wed)". */
export const formatMonthDayDow = (input: Date | string): string => {
  const d = toDate(input)
  if (isEnLocale()) return format(d, 'MMM d (EEE)', { locale: enUS })
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${DOW_KO[d.getDay()]})`
}

/** ko "M월 D일 수요일" / en "Jul 8, Wednesday". 다이얼로그 타이틀 등 전체 요일명. */
export const formatMonthDayWeekday = (input: Date | string): string => {
  const d = toDate(input)
  if (isEnLocale()) return format(d, 'MMM d, EEEE', { locale: enUS })
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${DOW_KO[d.getDay()]}요일`
}

/** ko "Y년 M월" / en "MMM yyyy"(예: "Jul 2026"). */
export const formatYearMonth = (input: Date | string): string => {
  const d = toDate(input)
  if (isEnLocale()) return format(d, 'MMM yyyy', { locale: enUS })
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월`
}

/** ko "Y년" / en "Y". 연도 number 직접 허용. */
export const formatYear = (input: Date | string | number): string => {
  const y = typeof input === 'number' ? input : toDate(input).getFullYear()
  return isEnLocale() ? String(y) : `${y}년`
}

/** ko "Y년 Q분기" / en "Q{q} yyyy"(예: "Q3 2026"). */
export const formatYearQuarter = (input: Date | string): string => {
  const d = toDate(input)
  const q = Math.floor(d.getMonth() / 3) + 1
  return isEnLocale() ? `Q${q} ${d.getFullYear()}` : `${d.getFullYear()}년 ${q}분기`
}

/** 단월 라벨 — ko "M월"(pad 시 "07월") / en "MMM"(Jul). 월 number(1~12) 직접 허용. */
export const formatMonthShort = (input: Date | string | number, opts: { pad?: boolean } = {}): string => {
  if (isEnLocale()) {
    const d = typeof input === 'number' ? new Date(2000, input - 1, 1) : toDate(input)
    return format(d, 'MMM', { locale: enUS })
  }
  const m = typeof input === 'number' ? input : toDate(input).getMonth() + 1
  return opts.pad ? `${String(m).padStart(2, '0')}월` : `${m}월`
}

export {
  format, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addMonths, subMonths, addWeeks, subWeeks, addDays, subDays,
  isToday, isSameDay, isSameMonth,
}
