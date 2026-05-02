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
      return { Icon: AlertTriangle, bg: 'var(--status-warning-subtle)', fg: 'var(--status-warning-fg)' }
    case 'TODO_REMINDER':
      return { Icon: ListChecks, bg: 'var(--bg-brand-subtle)', fg: 'var(--fg-brand-strong)' }
    case 'EVENT_REMINDER':
      return { Icon: CalendarClock, bg: 'var(--status-info-subtle)', fg: 'var(--status-info-fg)' }
    default:
      return { Icon: Bell, bg: 'var(--pd-surface-inset)', fg: 'var(--fg-secondary)' }
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
      <div
        role="dialog"
        aria-label="알림"
        style={{
          position: 'fixed',
          top: 58,
          right: 20,
          width: 380,
          maxWidth: 'calc(100vw - 32px)',
          maxHeight: 'min(640px, calc(100vh - 80px))',
          zIndex: 90,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 16,
          boxShadow: '0 18px 50px -12px rgba(20, 28, 22, 0.24), 0 4px 14px -2px rgba(20, 28, 22, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '16px 18px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div>
            <div
              style={{
                font: '700 15px/1.3 var(--font-sans)',
                letterSpacing: '-0.015em',
                color: 'var(--fg-primary)',
              }}
            >
              알림
            </div>
            {unreadCount > 0 ? (
              <div style={{ fontSize: 11.5, color: 'var(--fg-tertiary)', marginTop: 1 }}>
                읽지 않은 알림 <b style={{ color: 'var(--fg-brand-strong)' }}>{unreadCount}</b>개
              </div>
            ) : (
              !isLoading && items.length === 0 && (
                <div style={{ fontSize: 11.5, color: 'var(--fg-tertiary)', marginTop: 1 }}>
                  새 알림이 없어요
                </div>
              )
            )}
          </div>
          {unreadCount > 0 && (
            <button
              className="hover:bg-[var(--bg-brand-subtle)]"
              style={{
                marginLeft: 'auto',
                border: 0,
                background: 'transparent',
                color: 'var(--fg-brand-strong)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: 6,
              }}
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
            >
              모두 읽음
            </button>
          )}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
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
        <div
          style={{
            padding: '10px 14px',
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--pd-surface-inset)',
          }}
        >
          <button
            className="hover:bg-[var(--bg-surface)] hover:text-[var(--fg-primary)]"
            style={{
              width: '100%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              border: 0,
              background: 'transparent',
              color: 'var(--fg-secondary)',
              fontSize: 12.5,
              fontWeight: 600,
              padding: 8,
              borderRadius: 8,
              cursor: 'pointer',
            }}
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
