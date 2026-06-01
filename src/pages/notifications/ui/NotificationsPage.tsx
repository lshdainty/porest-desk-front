import { Calendar, CheckSquare, Info, Wallet, X } from 'lucide-react'
import { cn } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import { Skeleton as SkeletonBase } from '@/shared/ui/skeleton'
import {
  useDeleteNotification,
  useMarkAllRead,
  useMarkRead,
  useNotifications,
  useUnreadCount,
} from '@/features/notification'
import type { Notification, NotificationType } from '@/entities/notification'

const TYPE_ICONS: Record<NotificationType, React.ReactNode> = {
  EVENT_REMINDER: <Calendar size={16} />,
  BUDGET_ALERT: <Wallet size={16} />,
  TODO_REMINDER: <CheckSquare size={16} />,
  SYSTEM: <Info size={16} />,
}

/** 알림 목록 skeleton — icon(32x32) + 제목+메시지 + 시간 + 삭제버튼 행 × 6. */
function NotificationsPageSkeleton() {
  return (
    <div className="m-scroll" style={{ padding: 0 }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="notif-row" style={{ pointerEvents: 'none' }}>
          <SkeletonBase className="h-8 w-8 rounded-md shrink-0" />
          <div className="notif-row__text">
            <SkeletonBase className={`h-3.5 mb-1.5 ${i % 3 === 0 ? 'w-36' : i % 3 === 1 ? 'w-28' : 'w-40'}`} />
            <SkeletonBase className="h-3 w-48" />
          </div>
          <SkeletonBase className="h-3 w-8 shrink-0" />
          <SkeletonBase className="h-7 w-7 rounded-md shrink-0" />
        </div>
      ))}
    </div>
  )
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '방금'
  if (minutes < 60) return `${minutes}분 전`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}시간 전`
  const days = Math.floor(hours / 24)
  return `${days}일 전`
}

/**
 * 알림 페이지 — Flutter `NotificationScreen` 미러.
 *
 * 풀 페이지로 알림 리스트를 보여주고, 읽음/모두 읽음/삭제 액션 제공.
 * 이전: MobileNotificationSheet (드로어) → 변경: 풀 페이지 라우트.
 */
export function NotificationsPage() {
  const { data: notifications = [], isLoading } = useNotifications()
  const { data: unreadCount = 0 } = useUnreadCount()
  const markRead = useMarkRead()
  const markAllRead = useMarkAllRead()
  const deleteNotif = useDeleteNotification()

  const handleClick = (n: Notification) => {
    if (!n.isRead) markRead.mutate(n.rowId)
  }

  if (isLoading) return <NotificationsPageSkeleton />

  return (
    <div className="m-scroll" style={{ padding: 0 }}>
      {unreadCount > 0 && (
        <div
          style={{
            padding: '12px 20px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: 'var(--fg-secondary)',
            fontSize: 'var(--text-label-sm)',
          }}
        >
          <b style={{ color: 'var(--fg-brand-strong)', fontWeight: '700' }}>{unreadCount}</b>
          <span>개의 새 알림</span>
          <Button
            variant="ghost"
            size="sm"
            loading={markAllRead.isPending}
            onClick={() => markAllRead.mutate()}
            className="ml-auto text-[var(--fg-brand-strong)] hover:bg-[var(--bg-brand-subtle)] hover:text-[var(--fg-brand-strong)]"
          >
            모두 읽음
          </Button>
        </div>
      )}
      {notifications.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-[var(--fg-tertiary)]">
          새 알림이 없습니다
        </div>
      ) : (
        notifications.map(n => (
          <div
            key={n.rowId}
            className={cn('notif-row', !n.isRead && 'unread')}
            onClick={() => handleClick(n)}
          >
            <div
              className="notif-row__icon"
              style={{
                background: 'var(--bg-brand-subtle)',
                color: 'var(--fg-brand-strong)',
              }}
            >
              {TYPE_ICONS[n.notificationType]}
            </div>
            <div className="notif-row__text">
              <div className="notif-row__title">
                {n.title}
                {!n.isRead && <span className="notif-row__dot" />}
              </div>
              <div className="notif-row__desc">{n.message}</div>
            </div>
            <div className="notif-row__time">{timeAgo(n.createAt)}</div>
            <Button
              variant="ghost"
              size="icon"
              loading={deleteNotif.isPending}
              onClick={e => {
                e.stopPropagation()
                deleteNotif.mutate(n.rowId)
              }}
              className="h-7 w-7 text-[var(--fg-tertiary)]"
              aria-label="삭제"
            >
              <X size={12} />
            </Button>
          </div>
        ))
      )}
    </div>
  )
}
