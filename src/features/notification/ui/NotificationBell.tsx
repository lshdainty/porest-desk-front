import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Bell, Check, CheckCheck, Trash2, Calendar, Wallet, CheckSquare, Info } from 'lucide-react'
import { cn } from '@/shared/lib'
import type { Notification, NotificationType } from '@/entities/notification'
import {
  useNotifications,
  useUnreadCount,
  useMarkRead,
  useMarkAllRead,
  useDeleteNotification,
} from '../model/useNotifications'

const notificationTypeIcons: Record<NotificationType, React.ReactNode> = {
  EVENT_REMINDER: <Calendar size={14} className="text-blue-500" />,
  BUDGET_ALERT: <Wallet size={14} className="text-red-500" />,
  TODO_REMINDER: <CheckSquare size={14} className="text-green-500" />,
  SYSTEM: <Info size={14} className="text-gray-500" />,
}

const formatTimeAgo = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}

export const NotificationBell = () => {
  const { t } = useTranslation('notification')
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { data: notifications = [] } = useNotifications()
  const { data: unreadCount = 0 } = useUnreadCount()
  const markRead = useMarkRead()
  const markAllRead = useMarkAllRead()
  const deleteNotification = useDeleteNotification()

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleItemClick = (notification: Notification) => {
    if (!notification.isRead) {
      markRead.mutate(notification.rowId)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-md p-1.5 hover:bg-muted transition-colors"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-lg border bg-background shadow-lg">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h3 className="text-sm font-semibold">{t('title')}</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <CheckCheck size={12} />
                {t('markAllRead')}
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                {t('empty')}
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.rowId}
                  onClick={() => handleItemClick(notification)}
                  className={cn(
                    'flex cursor-pointer gap-3 border-b px-4 py-3 transition-colors hover:bg-muted/50 last:border-b-0',
                    !notification.isRead && 'bg-primary/5'
                  )}
                >
                  <div className="mt-0.5 shrink-0">
                    {notificationTypeIcons[notification.notificationType]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn(
                        'text-sm',
                        !notification.isRead && 'font-medium'
                      )}>
                        {notification.title}
                      </p>
                      {!notification.isRead && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                    <span className="mt-1 text-[10px] text-muted-foreground">
                      {formatTimeAgo(notification.createAt)}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteNotification.mutate(notification.rowId)
                    }}
                    className="mt-0.5 shrink-0 rounded p-0.5 text-muted-foreground/50 hover:text-destructive transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
