import {
  AlertTriangle,
  Bell,
  CalendarClock,
  ChevronRight,
  ListChecks,
} from 'lucide-react'
import { useMarkAllRead, useMarkRead, useNotifications } from '@/features/notification'
import type { Notification, NotificationType } from '@/entities/notification'

function iconFor(type: NotificationType): {
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>
  bg: string
  fg: string
} {
  switch (type) {
    case 'BUDGET_ALERT':
      return { Icon: AlertTriangle, bg: 'var(--sunlit-100)', fg: 'var(--sunlit-700)' }
    case 'TODO_REMINDER':
      return { Icon: ListChecks, bg: 'var(--bg-brand-subtle)', fg: 'var(--fg-brand-strong)' }
    case 'EVENT_REMINDER':
      return { Icon: CalendarClock, bg: 'var(--sky-100)', fg: 'var(--sky-700)' }
    default:
      return { Icon: Bell, bg: 'var(--mist-200)', fg: 'var(--fg-secondary)' }
  }
}

/**
 * createAt (ISO 또는 date-ms) → "방금 / n분 전 / n시간 전 / 어제 / n일 전 / yyyy-MM-dd"
 */
function relativeTime(createAt: string): string {
  const then = new Date(createAt).getTime()
  if (Number.isNaN(then)) return ''
  const diffMs = Date.now() - then
  const m = Math.floor(diffMs / 60_000)
  if (m < 1) return '방금'
  if (m < 60) return `${m}분 전`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}시간 전`
  const d = Math.floor(h / 24)
  if (d === 1) return '어제'
  if (d < 7) return `${d}일 전`
  // 1주 이상 지난 건 날짜만
  return createAt.slice(0, 10)
}

export function NotificationsPopover({
  onClose,
  onGoSettings,
}: {
  onClose: () => void
  onGoSettings?: () => void
}) {
  const { data, isLoading } = useNotifications()
  const markRead = useMarkRead()
  const markAllRead = useMarkAllRead()

  const items: Notification[] = data ?? []
  const unreadCount = items.filter(n => !n.isRead).length

  return (
    <>
      <div className="notif-backdrop" onClick={onClose} />
      <div className="notif-pop" role="dialog" aria-label="알림">
        <div className="notif-pop__head">
          <div>
            <div className="notif-pop__title">알림</div>
            {unreadCount > 0 ? (
              <div className="notif-pop__sub">
                읽지 않은 알림 <b>{unreadCount}</b>개
              </div>
            ) : (
              !isLoading && items.length === 0 && (
                <div className="notif-pop__sub">새 알림이 없어요</div>
              )
            )}
          </div>
          {unreadCount > 0 && (
            <button
              className="notif-pop__read-all"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
            >
              모두 읽음
            </button>
          )}
        </div>
        <div className="notif-pop__body">
          {isLoading && (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 13 }}>
              불러오는 중…
            </div>
          )}
          {!isLoading && items.length === 0 && (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 13 }}>
              아직 알림이 없어요
            </div>
          )}
          {items.map(n => {
            const { Icon, bg, fg } = iconFor(n.notificationType)
            return (
              <div
                key={n.rowId}
                className={`notif-row ${n.isRead ? '' : 'unread'}`}
                onClick={() => {
                  if (!n.isRead) markRead.mutate(n.rowId)
                }}
              >
                <span className="notif-row__icon" style={{ background: bg, color: fg }}>
                  <Icon size={16} strokeWidth={1.9} />
                </span>
                <div className="notif-row__text">
                  <div className="notif-row__title">
                    {n.title}
                    {!n.isRead && <span className="notif-row__dot" />}
                  </div>
                  <div className="notif-row__desc">{n.message}</div>
                </div>
                <div className="notif-row__time">{relativeTime(n.createAt)}</div>
              </div>
            )
          })}
        </div>
        <div className="notif-pop__foot">
          <button
            className="notif-pop__all"
            onClick={() => {
              onClose()
              onGoSettings?.()
            }}
          >
            알림 설정 <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </>
  )
}
