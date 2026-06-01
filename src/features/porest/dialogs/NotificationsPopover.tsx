import { ChevronRight } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Skeleton as SkeletonBase } from '@/shared/ui/skeleton'
import { useMarkAllRead, useMarkRead, useNotifications } from '@/features/notification'
import { notificationVisual } from '@/entities/notification'
import type { Notification } from '@/entities/notification'

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
          zIndex: 'var(--z-sticky)',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-xl)',
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
                letterSpacing: '-0.012em',
                color: 'var(--fg-primary)',
              }}
            >
              알림
            </div>
            {unreadCount > 0 ? (
              <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', marginTop: 1 }}>
                읽지 않은 알림 <b style={{ color: 'var(--fg-brand-strong)' }}>{unreadCount}</b>개
              </div>
            ) : (
              !isLoading && items.length === 0 && (
                <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', marginTop: 1 }}>
                  새 알림이 없어요
                </div>
              )
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              loading={markAllRead.isPending}
              onClick={() => markAllRead.mutate()}
              className="ml-auto text-[var(--fg-brand-strong)] hover:bg-[var(--bg-brand-subtle)] hover:text-[var(--fg-brand-strong)]"
            >
              모두 읽음
            </Button>
          )}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
          {isLoading && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="notif-row"
                  style={{ pointerEvents: 'none' }}
                >
                  <SkeletonBase className="h-8 w-8 rounded-md notif-row__icon" />
                  <div className="notif-row__text">
                    <SkeletonBase className="h-4 w-2/3 mb-1.5" />
                    <SkeletonBase className="h-3 w-full" />
                  </div>
                  <SkeletonBase className="h-3 w-10 shrink-0" />
                </div>
              ))}
            </div>
          )}
          {!isLoading && items.length === 0 && (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 'var(--text-label-sm)' }}>
              아직 알림이 없어요
            </div>
          )}
          {items.map(n => {
            const { Icon, bg, fg } = notificationVisual(n.notificationType)
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
            background: 'var(--bg-sunken)',
          }}
        >
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              onClose()
              onGoSettings?.()
            }}
            className="w-full justify-center gap-1 text-[var(--fg-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--fg-primary)]"
          >
            알림 설정 <ChevronRight size={12} />
          </Button>
        </div>
      </div>
    </>
  )
}
