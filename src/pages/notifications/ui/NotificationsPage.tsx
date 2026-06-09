import type { ReactNode } from 'react'
import { ChevronRight, X } from 'lucide-react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { Button } from '@/shared/ui/button'
import { Skeleton as SkeletonBase } from '@/shared/ui/skeleton'
import { MobileBackHeader } from '@/shared/ui/porest/mobile-back-header'
import {
  useDeleteNotification,
  useMarkAllRead,
  useMarkRead,
  useNotifications,
  useUnreadCount,
} from '@/features/notification'
import { NotificationRow } from '@/entities/notification'
import type { Notification } from '@/entities/notification'

type OutletCtx = { onAddTx: () => void; mobile: boolean }

/** 알림 목록 skeleton — icon(34x34) + 제목+메시지 + 시간 + 삭제버튼 행 × 6. */
function NotificationsPageSkeleton() {
  return (
    <div style={{ padding: '4px 0' }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="notif-row" style={{ pointerEvents: 'none' }}>
          <SkeletonBase className="h-8 w-8 rounded-md shrink-0 notif-row__icon" />
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

/**
 * 알림 페이지 — 데스크탑 NotificationsPopover(SoT) 의 풀페이지 미러.
 *
 * 행 구성·tone 매핑·unread 시각·상대시간·footer 는 Popover 와 공용
 * (`@/entities/notification` NotificationRow / relativeTime / notificationVisual).
 * 차이: 풀페이지라 dialog 박스·backdrop 없음, 행 끝에 삭제(X) 버튼(Page 전용 기능 보존),
 *       unreadCount 는 별도 useUnreadCount 쿼리.
 */
export function NotificationsPage() {
  const navigate = useNavigate()
  const { mobile } = useOutletContext<OutletCtx>()
  const { data: notifications = [], isLoading } = useNotifications()
  const { data: unreadCount = 0 } = useUnreadCount()
  const markRead = useMarkRead()
  const markAllRead = useMarkAllRead()
  const deleteNotif = useDeleteNotification()

  const handleClick = (n: Notification) => {
    if (!n.isRead) markRead.mutate(n.rowId)
  }

  const markAllButton =
    unreadCount > 0 ? (
      <Button
        variant="ghost"
        size="sm"
        loading={markAllRead.isPending}
        onClick={() => markAllRead.mutate()}
        className="text-[var(--fg-brand-strong)] hover:bg-[var(--bg-brand-subtle)] hover:text-[var(--fg-brand-strong)]"
      >
        모두 읽음
      </Button>
    ) : null

  // 본문 — 데스크탑/모바일 공용. unread 서브 바는 본문 상단(SoT 헤더 서브 위치 참고).
  let body: ReactNode
  if (isLoading) {
    body = <NotificationsPageSkeleton />
  } else if (notifications.length === 0) {
    body = (
      <div className="px-5 py-10 text-center text-sm text-[var(--fg-tertiary)]">
        아직 알림이 없어요
      </div>
    )
  } else {
    body = (
      <div style={{ padding: '4px 0' }}>
        {notifications.map(n => (
          <NotificationRow
            key={n.rowId}
            notification={n}
            onClick={() => handleClick(n)}
            trailing={
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
            }
          />
        ))}
      </div>
    )
  }

  // unread 카운터 서브 바 — 본문 상단. 모바일은 '모두 읽음'을 헤더로 옮기므로 카운터만 표시.
  const unreadSub =
    !isLoading && unreadCount > 0 ? (
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
        <span>
          읽지 않은 알림{' '}
          <b style={{ color: 'var(--fg-brand-strong)', fontWeight: '700' }}>{unreadCount}</b>개
        </span>
        {!mobile && <div className="ml-auto">{markAllButton}</div>}
      </div>
    ) : null

  const footer = (
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
        onClick={() => navigate('/desk/settings?section=notifications')}
        className="w-full justify-center gap-1 text-[var(--fg-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--fg-primary)]"
      >
        알림 설정 <ChevronRight size={12} />
      </Button>
    </div>
  )

  // ── 모바일 — 풀스크린(← 헤더 + 우측 '모두 읽음'). 본문 스크롤 후 footer 고정. ──────────
  if (mobile) {
    return (
      <>
        <MobileBackHeader title="알림" trailing={markAllButton} />
        <div className="m-scroll" style={{ padding: 0 }}>
          {unreadSub}
          {body}
          {footer}
        </div>
      </>
    )
  }

  // ── 데스크탑 ────────────────────────────────────────────────────────────────
  return (
    <div className="m-scroll" style={{ padding: 0 }}>
      {unreadSub}
      {body}
      {footer}
    </div>
  )
}
