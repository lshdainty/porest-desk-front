import type { RecurringFrequency } from '@/entities/recurring-transaction'

// 반복 거래 다이얼로그 공용 date helpers — RecurringFromTxDialog / RecurringAddDialog 공유.
// (컴포넌트 파일이 함수도 export하면 react-refresh 룰 위반이라 별도 .ts 로 분리)

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export function addYears(iso: string, years: number): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  d.setFullYear(d.getFullYear() + years)
  return d.toISOString().slice(0, 10)
}

export function formatKoreanMonthDay(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return `${String(d.getMonth() + 1).padStart(2, '0')}월 ${String(d.getDate()).padStart(2, '0')}일`
}

export function previewNextDates(
  startIso: string,
  freq: RecurringFrequency,
  dayOfWeekUi: number, // 0=일~6=토
  dayOfMonth: number,
  count: number,
): string[] {
  const start = new Date(startIso)
  if (isNaN(start.getTime())) return []
  const out: string[] = []
  const cursor = new Date(start)

  if (freq === 'WEEKLY') {
    // 시작일을 dayOfWeekUi 요일로 정규화
    const diff = (dayOfWeekUi - cursor.getDay() + 7) % 7
    cursor.setDate(cursor.getDate() + diff)
  } else if (freq === 'MONTHLY') {
    cursor.setDate(Math.min(dayOfMonth, daysInMonth(cursor.getFullYear(), cursor.getMonth())))
  }

  for (let i = 0; i < count; i++) {
    out.push(cursor.toISOString().slice(0, 10))
    if (freq === 'DAILY') cursor.setDate(cursor.getDate() + 1)
    else if (freq === 'WEEKLY') cursor.setDate(cursor.getDate() + 7)
    else if (freq === 'MONTHLY') {
      const ny = cursor.getFullYear()
      const nm = cursor.getMonth() + 1
      const nd = Math.min(dayOfMonth, daysInMonth(ny, nm))
      cursor.setFullYear(ny, nm, nd)
    }
    else if (freq === 'YEARLY') cursor.setFullYear(cursor.getFullYear() + 1)
  }
  return out
}

function daysInMonth(year: number, monthIdx: number): number {
  return new Date(year, monthIdx + 1, 0).getDate()
}
