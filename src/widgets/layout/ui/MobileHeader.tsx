import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Bell, Calendar, CheckSquare, Info, Search, Wallet } from 'lucide-react'
import { cn } from '@/shared/lib'
import {
  useDeleteNotification,
  useMarkAllRead,
  useMarkRead,
  useNotifications,
  useUnreadCount,
} from '@/features/notification'
import type { Notification, NotificationType } from '@/entities/notification'
import { NAV } from './PorestSidebar'

const MTITLE: Record<string, string> = {
  '/desk': '홈',
  '/desk/asset': '자산',
  '/desk/expense': '가계부',
  '/desk/stats': '통계·분석',
  '/desk/budget': '예산',
  '/desk/calendar': '캘린더',
  '/desk/todo': '할 일',
  '/desk/dutch-pay': '더치페이',
  '/desk/memo': '메모',
  '/desk/more': '전체',
}

const TYPE_ICONS: Record<NotificationType, React.ReactNode> = {
  EVENT_REMINDER: <Calendar size={16} />,
  BUDGET_ALERT: <Wallet size={16} />,
  TODO_REMINDER: <CheckSquare size={16} />,
  SYSTEM: <Info size={16} />,
}

function title(pathname: string) {
  if (MTITLE[pathname]) return MTITLE[pathname]
  const nav = NAV.find(n => pathname.startsWith(n.path) && n.path !== '/desk')
  return nav?.label ?? '홈'
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

export function MobileHeader() {
  const location = useLocation()
  const isHome = location.pathname === '/desk'
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const { data: unreadCount = 0 } = useUnreadCount()

  return (
    <>
      <div className="m-header">
        <h1>{title(location.pathname)}</h1>
        <button
          className="ico-btn"
          aria-label={isHome ? '알림' : '검색'}
          onClick={() => isHome && setIsNotifOpen(true)}
        >
          {isHome ? <Bell size={20} /> : <Search size={20} />}
          {isHome && unreadCount > 0 && <span className="dot" />}
        </button>
      </div>
      {isNotifOpen && <MobileNotificationSheet onClose={() => setIsNotifOpen(false)} />}
    </>
  )
}

function MobileNotificationSheet({ onClose }: { onClose: () => void }) {
  const { data: notifications = [] } = useNotifications()
  const { data: unreadCount = 0 } = useUnreadCount()
  const markRead = useMarkRead()
  const markAllRead = useMarkAllRead()
  const deleteNotif = useDeleteNotification()

  const handleClick = (n: Notification) => {
    if (!n.isRead) markRead.mutate(n.rowId)
  }

  return (
    <>
      <div className="notif-backdrop" onClick={onClose} />
      <div className="notif-pop" role="dialog" aria-label="알림">
        <div className="notif-pop__head">
          <div>
            <div className="notif-pop__title">알림</div>
            {unreadCount > 0 && (
              <div className="notif-pop__sub">
                <b>{unreadCount}</b>개의 새 알림
              </div>
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
          {notifications.length === 0 ? (
            <div
              style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: 'var(--fg-tertiary)',
                fontSize: 13,
              }}
            >
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
                <button
                  onClick={e => {
                    e.stopPropagation()
                    deleteNotif.mutate(n.rowId)
                  }}
                  disabled={deleteNotif.isPending}
                  style={{
                    border: 0,
                    background: 'transparent',
                    color: 'var(--fg-tertiary)',
                    cursor: 'pointer',
                    padding: 4,
                    fontSize: 11,
                  }}
                  aria-label="삭제"
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}
