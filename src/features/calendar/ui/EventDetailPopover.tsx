import { differenceInCalendarDays, differenceInMinutes, format, parseISO } from 'date-fns'
import { enUS, ko } from 'date-fns/locale'
import { Bell, MapPin, Pencil, Repeat, Tag, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/shared/ui/button'
import { eventBadgeColor } from '@/features/calendar/lib/helpers'

import type { IEvent } from '@/features/calendar/model/interfaces'

interface EventDetailPopoverProps {
  event: IEvent
  onEdit: () => void
  onDelete: () => void
}

function getRruleText(rrule: string, t: (key: string) => string): string {
  if (rrule.includes('FREQ=DAILY')) return t('recurrence.daily')
  if (rrule.includes('FREQ=WEEKLY')) return t('recurrence.weekly')
  if (rrule.includes('FREQ=MONTHLY')) return t('recurrence.monthly')
  if (rrule.includes('FREQ=YEARLY')) return t('recurrence.yearly')
  return rrule
}

function getReminderText(minutes: number, t: (key: string) => string): string {
  if (minutes === 5) return t('reminder.5min')
  if (minutes === 15) return t('reminder.15min')
  if (minutes === 30) return t('reminder.30min')
  if (minutes === 60) return t('reminder.1hour')
  if (minutes === 1440) return t('reminder.1day')
  return `${minutes}min`
}

/** 디자인 CAL_PALETTE 공식 — 이벤트 색을 surface/fg 와 섞어 다크 자동 적응. */
const toneBg = (c: string) => `color-mix(in oklab, ${c} 16%, var(--bg-surface))`
const toneFg = (c: string) => `color-mix(in oklab, ${c} 70%, var(--fg-primary))`

/** 원형 tone 아이콘 + 캡션/값 — 디자인 DetailRow 미러(34 원형, caption 11/600, label 13/500). */
function DetailRow({ icon, caption, label, color }: { icon: React.ReactNode; caption: string; label: string; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '11px 2px' }}>
      <span
        style={{
          width: 34,
          height: 34,
          borderRadius: 'var(--radius-full)',
          background: toneBg(color),
          color: toneFg(color),
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 'var(--text-badge)', fontWeight: 600, color: 'var(--fg-tertiary)', marginBottom: 1 }}>{caption}</div>
        <div style={{ fontSize: 'var(--text-label-sm)', color: 'var(--fg-primary)', fontWeight: 500, wordBreak: 'keep-all' }}>{label}</div>
      </div>
    </div>
  )
}

/** 일정 상세 본문 — 디자인 EventDetailDialog 미러(모바일 drawer / 데스크톱 popover 공용). */
const EventDetailPopover = ({ event, onEdit, onDelete }: EventDetailPopoverProps) => {
  const { t, i18n } = useTranslation('calendar')
  const isKo = i18n.language.startsWith('ko')
  const locale = isKo ? ko : enUS
  const timeFormat = isKo ? 'a h:mm' : 'h:mm a'
  const shortDateFormat = isKo ? 'M월 d일 (EE)' : 'MMM d (EEE)'

  const startDate = parseISO(event.startDate)
  const endDate = parseISO(event.endDate)
  const sameDay = format(startDate, 'yyyy-MM-dd') === format(endDate, 'yyyy-MM-dd')
  const color = eventBadgeColor(event)
  const isCalendarSource = event.sourceType === 'calendar'

  // D-day (오늘 기준, 시작일)
  const dd = differenceInCalendarDays(startDate, new Date())
  const ddLabel = dd === 0 ? t('detail.dday') : dd > 0 ? t('detail.ddayLeft', { n: dd }) : t('detail.ddayPast', { n: -dd })

  // 기간 — 같은 날 시간 일정만(다일은 날짜로 이미 표현), 종일은 '종일'
  const durMin = !event.isAllDay && sameDay ? differenceInMinutes(endDate, startDate) : null
  const durLabel =
    durMin != null && durMin > 0
      ? durMin >= 60
        ? durMin % 60
          ? t('detail.durationHM', { h: Math.floor(durMin / 60), m: durMin % 60 })
          : t('detail.durationH', { h: Math.floor(durMin / 60) })
        : t('detail.durationM', { m: durMin })
      : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Hero — 좌측 컬러 바 + 캘린더 pill·그룹·D-day + 큰 제목 */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 6 }}>
        <span style={{ width: 4, borderRadius: 'var(--radius-full)', background: color, flexShrink: 0, alignSelf: 'stretch' }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 5 }}>
            {event.calendarName && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 'var(--text-badge)',
                  fontWeight: 600,
                  color: toneFg(event.calendarColor ?? color),
                  background: toneBg(event.calendarColor ?? color),
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-full)',
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ width: 7, height: 7, borderRadius: 'var(--radius-full)', background: event.calendarColor ?? color }} />
                {event.calendarName}
              </span>
            )}
            {event.groupName && (
              <span style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', whiteSpace: 'nowrap' }}>{event.groupName}</span>
            )}
            <span
              className="num"
              style={{
                marginLeft: 'auto',
                fontSize: 'var(--text-badge)',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                color: dd >= 0 && dd <= 3 ? 'var(--status-danger)' : 'var(--fg-tertiary)',
                background: 'var(--bg-muted)',
                padding: '3px 10px',
                borderRadius: 'var(--radius-full)',
              }}
            >
              {ddLabel}
            </span>
          </div>
          <div style={{ fontSize: 'var(--text-title-lg)', fontWeight: 700, letterSpacing: '-0.02em', wordBreak: 'keep-all', lineHeight: 1.3 }}>
            {event.title}
          </div>
        </div>
      </div>

      {/* 시간 블록 — 시작 → 종료 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: 'var(--bg-muted)',
          borderRadius: 'var(--radius-md)',
          padding: '16px 18px',
          margin: '14px 0',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 'var(--text-badge)', fontWeight: 600, color: 'var(--fg-tertiary)', marginBottom: 3 }}>{t('detail.start')}</div>
          <div style={{ fontSize: 'var(--text-body-sm)', fontWeight: 700, letterSpacing: '-0.01em' }}>{format(startDate, shortDateFormat, { locale })}</div>
          {!event.isAllDay && (
            <div className="num" style={{ fontSize: 'var(--text-label-sm)', color: 'var(--fg-secondary)', marginTop: 2 }}>
              {format(startDate, timeFormat, { locale })}
            </div>
          )}
        </div>
        <div style={{ color: 'var(--fg-tertiary)', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <span aria-hidden style={{ display: 'inline-flex' }}>→</span>
          {(durLabel || event.isAllDay) && (
            <span style={{ fontSize: 'var(--text-badge)', fontWeight: 600, whiteSpace: 'nowrap' }}>
              {event.isAllDay ? t('allDay') : durLabel}
            </span>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
          <div style={{ fontSize: 'var(--text-badge)', fontWeight: 600, color: 'var(--fg-tertiary)', marginBottom: 3 }}>{t('detail.end')}</div>
          <div style={{ fontSize: 'var(--text-body-sm)', fontWeight: 700, letterSpacing: '-0.01em' }}>
            {format(sameDay ? startDate : endDate, shortDateFormat, { locale })}
          </div>
          {!event.isAllDay && (
            <div className="num" style={{ fontSize: 'var(--text-label-sm)', color: 'var(--fg-secondary)', marginTop: 2 }}>
              {format(endDate, timeFormat, { locale })}
            </div>
          )}
        </div>
      </div>

      {/* Detail rows — 장소/라벨(있을 때만) · 반복(항상) · 알림(있을 때만) */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {event.location && <DetailRow icon={<MapPin size={15} />} caption={t('form.location')} label={event.location} color={color} />}
        {event.labelName && <DetailRow icon={<Tag size={15} />} caption={t('form.label')} label={event.labelName} color={event.labelColor ?? color} />}
        <DetailRow
          icon={<Repeat size={15} />}
          caption={t('form.recurrence')}
          label={event.rrule ? getRruleText(event.rrule, t) : t('recurrence.none')}
          color={color}
        />
        {event.reminders.length > 0 && (
          <DetailRow
            icon={<Bell size={15} />}
            caption={t('form.reminder')}
            label={event.reminders.map(r => getReminderText(r.minutesBefore, t)).join(', ')}
            color={color}
          />
        )}
      </div>

      {/* 메모 */}
      {event.description && (
        <div style={{ marginTop: 10, padding: '14px 16px', background: 'var(--bg-muted)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: 'var(--text-badge)', fontWeight: 600, color: 'var(--fg-tertiary)', marginBottom: 6 }}>{t('detail.memo')}</div>
          <div style={{ fontSize: 'var(--text-label-sm)', color: 'var(--fg-primary)', lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {event.description}
          </div>
        </div>
      )}

      {/* Actions — 디자인 푸터: 삭제(좌, ghost danger) / 수정(primary). 닫기는 컨테이너(X·밖 클릭)가 담당 */}
      {isCalendarSource && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14 }}>
          <Button variant="ghost" size="sm" onClick={onDelete} className="text-destructive hover:text-destructive" style={{ marginRight: 'auto' }}>
            <Trash2 className="mr-1 size-3.5" />
            {t('deleteEvent')}
          </Button>
          <Button size="sm" onClick={onEdit}>
            <Pencil className="mr-1 size-3.5" />
            {t('editEvent')}
          </Button>
        </div>
      )}
    </div>
  )
}

export { EventDetailPopover }
