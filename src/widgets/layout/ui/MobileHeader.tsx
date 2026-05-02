import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Bell, Calendar, CheckSquare, Eye, EyeOff, Info, Moon, Search, Sun, Wallet, X } from 'lucide-react'
import { cn } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/shared/ui/drawer'
import { useTheme } from '@/shared/ui/theme-provider'
import {
  disablePdHideAmounts,
  enablePdHideAmounts,
  useHideAmounts,
} from '@/shared/lib/porest/hide-amounts'
import { HideAmountsUnlockDialog } from '@/features/porest/dialogs/HideAmountsUnlockDialog'
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
  const [unlockOpen, setUnlockOpen] = useState(false)
  const { data: unreadCount = 0 } = useUnreadCount()
  const { resolvedTheme, setTheme } = useTheme()
  const hidden = useHideAmounts()
  const toggleTheme = () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')

  const handleHideToggle = () => {
    if (hidden) {
      setUnlockOpen(true)
    } else {
      enablePdHideAmounts()
    }
  }

  return (
    <>
      <div className="m-header">
        <h1>{title(location.pathname)}</h1>
        <button
          className="ico-btn"
          aria-label={resolvedTheme === 'dark' ? '라이트 모드' : '다크 모드'}
          title={resolvedTheme === 'dark' ? '라이트 모드' : '다크 모드'}
          onClick={toggleTheme}
        >
          {resolvedTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <button
          className="ico-btn"
          aria-label={hidden ? '금액 표시' : '금액 가리기'}
          title={hidden ? '금액 표시' : '금액 가리기'}
          onClick={handleHideToggle}
        >
          {hidden ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
        <button
          className="ico-btn"
          aria-label={isHome ? '알림' : '검색'}
          onClick={() => isHome && setIsNotifOpen(true)}
        >
          {isHome ? <Bell size={20} /> : <Search size={20} />}
          {isHome && unreadCount > 0 && <span className="dot" />}
        </button>
      </div>
      {isHome && (
        <MobileNotificationSheet
          open={isNotifOpen}
          onOpenChange={setIsNotifOpen}
        />
      )}
      <HideAmountsUnlockDialog
        open={unlockOpen}
        onOpenChange={setUnlockOpen}
        onVerified={disablePdHideAmounts}
      />
    </>
  )
}

function MobileNotificationSheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { data: notifications = [] } = useNotifications()
  const { data: unreadCount = 0 } = useUnreadCount()
  const markRead = useMarkRead()
  const markAllRead = useMarkAllRead()
  const deleteNotif = useDeleteNotification()

  const handleClick = (n: Notification) => {
    if (!n.isRead) markRead.mutate(n.rowId)
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <div className="flex-1">
            <DrawerTitle>알림</DrawerTitle>
            {unreadCount > 0 && (
              <DrawerDescription>
                <b className="text-[var(--fg-brand-strong)]">{unreadCount}</b>
                개의 새 알림
              </DrawerDescription>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              loading={markAllRead.isPending}
              onClick={() => markAllRead.mutate()}
              className="text-[var(--fg-brand-strong)] hover:bg-[var(--bg-brand-subtle)] hover:text-[var(--fg-brand-strong)]"
            >
              모두 읽음
            </Button>
          )}
        </DrawerHeader>
        <DrawerBody className="p-0">
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
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  )
}
