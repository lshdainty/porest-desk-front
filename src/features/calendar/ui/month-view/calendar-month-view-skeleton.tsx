import { useTranslation } from 'react-i18next'

import { Skeleton } from '@/shared/ui/skeleton'
import { useIsMobile } from '@/shared/hooks/use-mobile'

const WEEK_DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const WEEK_DAYS_KO = ['일', '월', '화', '수', '목', '금', '토']

/**
 * 실제 MonthDayCell 미러 — 모바일은 셀 보더 없음(lg 이상만 grid line),
 * 이벤트 placeholder 는 실제 칩과 동일한 높이: 모바일 h-4(앱 타이트 칩) /
 * 데스크톱·태블릿 h-5.5 lg:h-6.5 (실제 MonthEventBadge 분기 정합).
 */
const DayCellSkeleton = ({ isSunday, chips, isMobile }: { isSunday: boolean; chips: number; isMobile: boolean }) => {
  return (
    <div className={`flex h-full flex-col gap-1 lg:border-l lg:border-t py-1.5 lg:pb-2 lg:pt-1 ${isSunday ? 'lg:border-l-0' : ''}`}>
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <Skeleton className="size-6 rounded-full" />
        </div>
      </div>

      <div className="flex flex-col flex-1 min-h-0 gap-1">
        {Array.from({ length: chips }).map((_, i) => (
          <Skeleton
            key={i}
            className={`${isMobile ? 'h-4' : 'h-5.5 lg:h-6.5'} mx-0.5 lg:mx-1 rounded-sm lg:rounded-md`}
          />
        ))}
      </div>
    </div>
  )
}

const CalendarMonthViewSkeleton = () => {
  const { i18n } = useTranslation()
  const isMobile = useIsMobile()
  const weekDays = i18n.language.startsWith('ko') ? WEEK_DAYS_KO : WEEK_DAYS_EN

  const cells = Array.from({ length: 42 }, (_, i) => i)

  return (
    <div className="flex flex-col h-full">
      {/* 요일 행 — 실제 월뷰와 동일(모바일 보더 없음, lg 는 첫 셀행의 border-t 가 라인 역할) */}
      <div className="grid grid-cols-7 flex-shrink-0">
        {weekDays.map((day, index) => {
          const isSunday = index === 0
          const isSaturday = index === 6

          return (
            <div key={day} className="flex items-center justify-center py-2">
              <span
                className="text-xs font-medium"
                style={{ color: isSunday ? 'var(--fg-expense)' : isSaturday ? 'var(--fg-brand)' : undefined }}
              >
                {day}
              </span>
            </div>
          )
        })}
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="grid grid-cols-7 auto-rows-fr h-full">
          {cells.map(index => (
            <DayCellSkeleton
              key={index}
              isSunday={index % 7 === 0}
              isMobile={isMobile}
              // 일부 셀에만 0~2개 칩 — 시각적 다양성 (실데이터 밀도 흉내)
              chips={index % 7 === 0 ? 2 : index % 5 === 0 ? 1 : 0}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export { CalendarMonthViewSkeleton }
