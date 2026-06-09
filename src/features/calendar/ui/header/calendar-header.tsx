import { CalendarRange, Columns, Grid2x2, Grid3x3, List, ChevronLeft, ChevronRight, ChevronDown, Navigation, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { enUS, ko } from 'date-fns/locale'
import { useMemo, useState } from 'react'

import { useCalendar } from '@/features/calendar/model/calendar-context'
import { getEventsCount, navigateDate, rangeText } from '@/features/calendar/lib/helpers'
import { Button } from '@/shared/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'
import { Drawer, DrawerClose, DrawerContent, DrawerTrigger, DrawerHeader, DrawerTitle, DrawerBody } from '@/shared/ui/drawer'
import { CalendarSourceToggle } from '@/features/calendar/ui/header/calendar-source-toggle'
import { useIsMobile } from '@/shared/hooks'
import { cn } from '@/shared/lib'

import type { IEvent } from '@/features/calendar/model/interfaces'

interface IProps {
  events: IEvent[]
}

/** 연/월 선택 picker 내용 — Popover·Drawer 양쪽에서 재사용 */
const MonthYearPickerContent = ({
  selectedDate,
  onSelect,
  onToday,
  onClose,
}: {
  selectedDate: Date
  onSelect: (date: Date) => void
  onToday: () => void
  onClose: () => void
}) => {
  const [pickerYear, setPickerYear] = useState(selectedDate.getFullYear())

  return (
    <div className="min-w-[220px]">
      {/* Year navigation */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setPickerYear(y => y - 1)}
        >
          <ChevronLeft size={16} />
        </Button>
        <span className="text-sm font-semibold">{pickerYear}년</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setPickerYear(y => y + 1)}
        >
          <ChevronRight size={16} />
        </Button>
      </div>

      {/* Month grid — 4열 × 3행 */}
      <div className="grid grid-cols-4 gap-1 px-3 pb-3">
        {Array.from({ length: 12 }, (_, i) => {
          const isSelected =
            selectedDate.getFullYear() === pickerYear &&
            selectedDate.getMonth() === i
          return (
            <button
              key={i}
              onClick={() => {
                onSelect(new Date(pickerYear, i, 1))
                onClose()
              }}
              className={cn(
                'rounded py-2 text-sm font-medium transition-colors',
                isSelected
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'hover:bg-accent text-foreground',
              )}
            >
              {i + 1}월
            </button>
          )
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t px-3 py-2">
        <button
          className="flex items-center gap-1 text-sm font-medium text-primary hover:opacity-80"
          onClick={() => { onToday(); onClose() }}
        >
          <Navigation size={13} />
          오늘로
        </button>
        <button
          className="text-sm text-muted-foreground hover:text-foreground"
          onClick={onClose}
        >
          닫기
        </button>
      </div>
    </div>
  )
}

const CalendarHeader = ({ events }: IProps) => {
  const { t, i18n } = useTranslation('calendar')
  const { selectedDate, setSelectedDate, view, setView } = useCalendar()
  const isMobile = useIsMobile()
  const [pickerOpen, setPickerOpen] = useState(false)

  const locale = i18n.language.startsWith('ko') ? ko : enUS
  const dateFormat = i18n.language.startsWith('ko') ? 'yyyy년 M월' : 'MMMM yyyy'
  const formattedDate = format(selectedDate, dateFormat, { locale })

  const eventCount = useMemo(
    () => getEventsCount(events, selectedDate, view),
    [events, selectedDate, view]
  )

  const handlePrevious = () => setSelectedDate(navigateDate(selectedDate, view, 'previous'))
  const handleNext = () => setSelectedDate(navigateDate(selectedDate, view, 'next'))
  const handleTodayClick = () => setSelectedDate(new Date())

  // ── 모바일: < 2026년 N월 > 네비 (날짜 텍스트 → Drawer picker) + 필터 칩 ──
  if (isMobile) {
    return (
      <div className="flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrevious}>
            <ChevronLeft className="size-5" />
          </Button>

          <Drawer open={pickerOpen} onOpenChange={setPickerOpen}>
            <DrawerTrigger asChild>
              <button className="flex items-center gap-0.5 text-sm font-semibold focus-visible:outline-none">
                {formattedDate}
                <ChevronDown size={13} className="text-muted-foreground" />
              </button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle className="flex-1">날짜 이동</DrawerTitle>
                <DrawerClose asChild>
                  <button
                    type="button"
                    aria-label="닫기"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-0 bg-transparent text-[var(--fg-secondary)] cursor-pointer hover:bg-[var(--bg-muted)] hover:text-[var(--fg-primary)] transition-colors"
                  >
                    <X size={18} />
                  </button>
                </DrawerClose>
              </DrawerHeader>
              <DrawerBody className="pb-6">
                <MonthYearPickerContent
                  selectedDate={selectedDate}
                  onSelect={setSelectedDate}
                  onToday={handleTodayClick}
                  onClose={() => setPickerOpen(false)}
                />
              </DrawerBody>
            </DrawerContent>
          </Drawer>

          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNext}>
            <ChevronRight className="size-5" />
          </Button>
        </div>
        <CalendarSourceToggle />
      </div>
    )
  }

  // ── 데스크톱/태블릿: 기존 헤더 + 날짜 텍스트 → Popover picker ──
  return (
    <div className="flex flex-col gap-4 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-3">
        {/* Today 날짜 버튼 */}
        <button
          className="flex size-14 flex-col items-start overflow-hidden rounded-lg border focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          onClick={handleTodayClick}
        >
          <p className="flex h-6 w-full items-center justify-center bg-primary text-center text-xs font-semibold text-primary-foreground">
            {format(new Date(), i18n.language.startsWith('ko') ? 'M월' : 'MMM', { locale }).toUpperCase()}
          </p>
          <p className="flex w-full items-center justify-center text-lg font-bold">
            {new Date().getDate()}
          </p>
        </button>

        {/* Date navigator */}
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            {/* 날짜 텍스트 → Popover picker 트리거 */}
            <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-1 text-lg font-semibold hover:opacity-80 focus-visible:outline-none">
                  {formattedDate}
                  <ChevronDown size={14} className="text-muted-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-auto p-0">
                <MonthYearPickerContent
                  selectedDate={selectedDate}
                  onSelect={setSelectedDate}
                  onToday={handleTodayClick}
                  onClose={() => setPickerOpen(false)}
                />
              </PopoverContent>
            </Popover>
            <span className="inline-flex items-center rounded-md border px-1.5 py-0.5 text-xs font-medium">
              {t('header.eventCount', { count: eventCount })}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="size-6.5 px-0 [&_svg]:size-4.5"
              onClick={handlePrevious}
            >
              <ChevronLeft />
            </Button>
            <p className="text-sm text-muted-foreground">
              {rangeText(view, selectedDate, locale)}
            </p>
            <Button
              variant="outline"
              size="icon"
              className="size-6.5 px-0 [&_svg]:size-4.5"
              onClick={handleNext}
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 lg:gap-3">
        <CalendarSourceToggle />
        <div className="hidden h-6 w-px bg-border lg:block" />

        <div className="inline-flex">
          <Button
            aria-label={t('header.viewDay')}
            size="icon"
            variant={view === 'day' ? 'default' : 'outline'}
            className="rounded-r-none"
            onClick={() => setView('day')}
          >
            <List strokeWidth={1.8} />
          </Button>
          <Button
            aria-label={t('header.viewWeek')}
            size="icon"
            variant={view === 'week' ? 'default' : 'outline'}
            className="-ml-px rounded-none"
            onClick={() => setView('week')}
          >
            <Columns strokeWidth={1.8} />
          </Button>
          <Button
            aria-label={t('header.viewMonth')}
            size="icon"
            variant={view === 'month' ? 'default' : 'outline'}
            className="-ml-px rounded-none"
            onClick={() => setView('month')}
          >
            <Grid2x2 strokeWidth={1.8} />
          </Button>
          <Button
            aria-label={t('header.viewYear')}
            size="icon"
            variant={view === 'year' ? 'default' : 'outline'}
            className="-ml-px rounded-none"
            onClick={() => setView('year')}
          >
            <Grid3x3 strokeWidth={1.8} />
          </Button>
          <Button
            aria-label={t('header.viewAgenda')}
            size="icon"
            variant={view === 'agenda' ? 'default' : 'outline'}
            className="-ml-px rounded-l-none"
            onClick={() => setView('agenda')}
          >
            <CalendarRange strokeWidth={1.8} />
          </Button>
        </div>
      </div>
    </div>
  )
}

export { CalendarHeader }
