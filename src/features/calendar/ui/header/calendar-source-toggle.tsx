import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Receipt, ListTodo, Flag, Settings, Settings2, ChevronDown } from 'lucide-react'

import { useCalendar } from '@/features/calendar/model/calendar-context'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'
import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerBody } from '@/shared/ui/drawer'
import { Button } from '@/shared/ui/button'
import { Separator } from '@/shared/ui/separator'
import { cn } from '@/shared/lib'
import { getPaletteByColor } from '@/shared/lib/porest/chart-palette'
import { useIsMobile } from '@/shared/hooks'

import type { IBuiltinSource, TCalendarSourceType } from '@/features/calendar/model/types'
import type { UserCalendar } from '@/entities/user-calendar'
import { CalendarManagementDialog } from './CalendarManagementDialog'
import { HolidayManagementDialog } from './HolidayManagementDialog'

const SOURCE_ICONS: Record<TCalendarSourceType, React.ElementType> = {
  holiday: Flag,
  expense: Receipt,
  todo: ListTodo,
}

const CheckboxIndicator = ({
  checked,
  color,
}: {
  checked: boolean
  color: string
}) => (
  <span
    className={cn(
      'flex size-4 shrink-0 items-center justify-center rounded-sm border transition-colors',
    )}
    style={{
      borderColor: color,
      backgroundColor: checked ? color : 'transparent',
    }}
  >
    {checked && (
      <svg
        width="10"
        height="10"
        viewBox="0 0 10 10"
        fill="none"
        style={{ color: 'var(--swatch-check)' }}
      >
        <path
          d="M8.5 2.5L3.5 7.5L1.5 5.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )}
  </span>
)

const UserCalendarItem = ({ calendar }: { calendar: UserCalendar }) => {
  const { toggleCalendarVisibility } = useCalendar()

  return (
    <button
      type="button"
      onClick={() => toggleCalendarVisibility(calendar.rowId)}
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
        'hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        !calendar.isVisible && 'opacity-50',
      )}
    >
      <CheckboxIndicator checked={calendar.isVisible} color={getPaletteByColor(calendar.color).color} />
      <span
        className="size-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: getPaletteByColor(calendar.color).color }}
      />
      <span className="truncate">{calendar.calendarName}</span>
    </button>
  )
}

const BuiltinSourceItem = ({ source, onSettings }: { source: IBuiltinSource; onSettings?: () => void }) => {
  const { t } = useTranslation('calendar')
  const { toggleBuiltinSource } = useCalendar()

  const Icon = SOURCE_ICONS[source.id]

  return (
    <div className="flex items-center gap-0.5">
      <button
        type="button"
        onClick={() => toggleBuiltinSource(source.id)}
        className={cn(
          'flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
          'hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
          !source.enabled && 'opacity-50',
        )}
      >
        <CheckboxIndicator checked={source.enabled} color={getPaletteByColor(source.color).color} />
        <Icon className="size-4 shrink-0" style={{ color: source.enabled ? getPaletteByColor(source.color).color : undefined }} />
        <span className="truncate">
          {t(`source.${source.id}`)}
        </span>
      </button>
      {onSettings && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
          onClick={onSettings}
          aria-label={t('manage')}
        >
          <Settings size={14} />
        </Button>
      )}
    </div>
  )
}

/** 캘린더 필터 내용 — Popover·Drawer 양쪽에서 재사용 */
const CalendarSourceContent = ({
  onManage,
  onHolidayManage,
}: {
  onManage: () => void
  onHolidayManage: () => void
}) => {
  const { t } = useTranslation('calendar')
  const { builtinSources, userCalendars } = useCalendar()

  return (
    <>
      {/* Section 1: User Calendars (앱 정합 — 헤더 gear/+추가 제거, 하단 관리 링크로 통합) */}
      <div className="p-3 pb-2">
        <span className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {t('title')}
        </span>
        <div className="space-y-0.5">
          {userCalendars.map((calendar) => (
            <UserCalendarItem key={calendar.rowId} calendar={calendar} />
          ))}
          {userCalendars.length === 0 && (
            <p className="px-2 py-1.5 text-xs text-muted-foreground">-</p>
          )}
        </div>
      </div>

      <Separator />

      {/* Section 2: 기타 소스 — 공휴일만 (가계부/할일 제거) */}
      <div className="p-3 py-2">
        <span className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {t('otherSources')}
        </span>
        <div className="space-y-0.5">
          {builtinSources
            .filter((source) => source.id === 'holiday')
            .map((source) => (
              <BuiltinSourceItem
                key={source.id}
                source={source}
                onSettings={onHolidayManage}
              />
            ))}
        </div>
      </div>

      <Separator />

      {/* Section 3: 캘린더 관리 · 공유 설정 링크 (앱 정합) */}
      <button
        type="button"
        onClick={onManage}
        className="flex w-full items-center gap-2 p-3 text-sm font-semibold text-[var(--fg-brand)] transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <Settings2 size={15} />
        {t('manageShare')}
      </button>
    </>
  )
}

const CalendarSourceToggle = () => {
  const { t } = useTranslation('calendar')
  const { builtinSources, userCalendars } = useCalendar()
  const isMobile = useIsMobile()
  const [managementOpen, setManagementOpen] = useState(false)
  const [holidayManagementOpen, setHolidayManagementOpen] = useState(false)

  // 필터 칩 도트 — visible 캘린더 최대 3개 + builtin 소스 색상
  const dotColors = [
    ...userCalendars.filter(c => c.isVisible).map(c => c.color),
    ...builtinSources.filter(s => s.enabled).map(s => s.color),
  ].slice(0, 3)

  const totalCount = userCalendars.filter(c => c.isVisible).length + builtinSources.filter(s => s.enabled).length

  const triggerButton = (
    <Button variant="outline" size="sm" className="gap-1 h-7 px-2 rounded-full">
      <span className="flex items-center gap-0.5">
        {dotColors.map((color, i) => (
          <span key={i} className="size-1.5 rounded-full" style={{ backgroundColor: color }} />
        ))}
      </span>
      <span className="text-xs font-medium">{totalCount}개</span>
      <ChevronDown size={11} className="text-muted-foreground" />
    </Button>
  )

  return (
    <>
      {isMobile ? (
        <Drawer>
          <DrawerTrigger asChild>{triggerButton}</DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{t('title')}</DrawerTitle>
            </DrawerHeader>
            <DrawerBody className="pb-6">
              <CalendarSourceContent
                onManage={() => setManagementOpen(true)}
                onHolidayManage={() => setHolidayManagementOpen(true)}
              />
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      ) : (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <span className="size-2 rounded-full bg-primary" />
              {t('title')}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64 p-0">
            <CalendarSourceContent
              onManage={() => setManagementOpen(true)}
              onHolidayManage={() => setHolidayManagementOpen(true)}
            />
          </PopoverContent>
        </Popover>
      )}

      <CalendarManagementDialog
        open={managementOpen}
        onOpenChange={setManagementOpen}
      />

      <HolidayManagementDialog
        open={holidayManagementOpen}
        onOpenChange={setHolidayManagementOpen}
      />
    </>
  )
}

export { CalendarSourceToggle }
