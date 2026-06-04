import { ChevronRight, Plus } from 'lucide-react'
import { parseISO } from 'date-fns'

import { Button } from '@/shared/ui/button'
import { ModalShell } from '@/shared/ui/porest/dialogs'
import { getPaletteByColor } from '@/shared/lib/porest/chart-palette'
import type { IEvent } from '@/features/calendar/model/interfaces'

/**
 * 일별 이벤트 시트 — 앱 `_DayEventsSheetBody` + 가계부 `DayDetailDialog` 패턴 미러.
 *
 * 모바일 월간뷰에서 셀(날짜/칩) 탭 시 표시: 제목 'M월 d일 X요일' /
 * 'N건' + [+] 추가 / 행: [종일|HH:mm][색 바][제목 + 위치·라벨][>].
 * 행 탭 → 이벤트 편집(앱 정합), [+] → 해당 날짜로 이벤트 추가.
 */
export function DayEventsDialog({
  date,
  events,
  mobile,
  onClose,
  onAdd,
  onTapEvent,
}: {
  date: Date
  events: IEvent[]
  mobile: boolean
  onClose: () => void
  onAdd: () => void
  onTapEvent: (event: IEvent) => void
}) {
  const dows = ['일', '월', '화', '수', '목', '금', '토']
  const title = `${date.getMonth() + 1}월 ${date.getDate()}일 ${dows[date.getDay()] ?? ''}요일`

  const hhmm = (iso: string) => {
    const d = parseISO(iso)
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  // 앱 색 우선순위 정합: label > calendar > event 색 (공휴일은 일요일색 error 고정)
  const barColor = (e: IEvent) =>
    e.sourceType === 'holiday'
      ? 'var(--color-error)'
      : getPaletteByColor(e.labelColor ?? e.calendarColor ?? e.color).color

  return (
    <ModalShell title={title} onClose={onClose} mobile={mobile} size="sm">
      {/* N건 + 이벤트 추가 */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ fontSize: 'var(--text-body-sm)', color: 'var(--fg-tertiary)' }}>
          {events.length}건
        </span>
        <Button
          variant="ghost"
          size="icon"
          title="이벤트 추가"
          style={{ marginLeft: 'auto' }}
          onClick={onAdd}
        >
          <Plus size={16} />
        </Button>
      </div>

      {events.length === 0 ? (
        <div
          style={{
            padding: '32px 0',
            textAlign: 'center',
            fontSize: 'var(--text-body-sm)',
            color: 'var(--fg-tertiary)',
          }}
        >
          이날 이벤트가 없습니다
        </div>
      ) : (
        events.map((e, i) => {
          // 공휴일은 읽기 전용 — 행 표시만 하고 편집 진입 없음 (chevron 숨김)
          const tappable = e.sourceType !== 'holiday'
          return (
          <div
            key={e.id}
            role={tappable ? 'button' : undefined}
            tabIndex={tappable ? 0 : undefined}
            onClick={tappable ? () => onTapEvent(e) : undefined}
            onKeyDown={(ev) => {
              if (tappable && (ev.key === 'Enter' || ev.key === ' ')) {
                ev.preventDefault()
                onTapEvent(e)
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 0',
              cursor: tappable ? 'pointer' : 'default',
              borderTop: i > 0 ? '1px solid var(--border-subtle)' : 'none',
            }}
          >
            {/* 시간 (종일 | HH:mm) — 앱 고정폭 40 정합 */}
            <span
              style={{
                width: 40,
                flexShrink: 0,
                fontSize: 'var(--text-caption)',
                color: 'var(--fg-secondary)',
              }}
            >
              {e.isAllDay ? '종일' : hhmm(e.startDate)}
            </span>
            <span style={{ width: 8, flexShrink: 0 }} />
            {/* 세로 색 바 4×24 */}
            <span
              style={{
                width: 4,
                height: 24,
                flexShrink: 0,
                borderRadius: 'var(--radius-xs)',
                background: barColor(e),
              }}
            />
            <span style={{ width: 12, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 'var(--text-body-sm)',
                  fontWeight: '600',
                  color: 'var(--fg-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {e.title}
              </div>
              {(e.location || e.labelName) && (
                <div
                  style={{
                    marginTop: 4,
                    fontSize: 'var(--text-caption)',
                    color: 'var(--fg-tertiary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {[e.location, e.labelName].filter(Boolean).join(' · ')}
                </div>
              )}
            </div>
            {tappable && (
              <ChevronRight size={16} style={{ flexShrink: 0, color: 'var(--fg-tertiary)' }} />
            )}
          </div>
          )
        })
      )}
    </ModalShell>
  )
}
