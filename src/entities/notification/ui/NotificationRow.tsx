import type { ReactNode } from 'react'
import { notificationVisual } from '../lib/notificationVisual'
import { relativeTime } from '../lib/relativeTime'
import type { Notification } from '../model/types'

/**
 * 알림 행 — Popover·Page 공용 single source(SoT 정합).
 *
 * 슬롯: 아이콘(34x34 tone) / 텍스트(제목+unread dot, 설명 2줄) / 상대시간(우측 상단) /
 *       trailing(선택 — Page 삭제 버튼 등).
 * unread 시각(좌측 엣지바·배경·dot)은 .notif-row.unread CSS 로 처리.
 */
export function NotificationRow({
  notification,
  onClick,
  trailing,
}: {
  notification: Notification
  onClick?: () => void
  /** 행 우측 끝 추가 액션(Page 삭제 버튼). 미지정 시 SoT(Popover) 3슬롯 그대로. */
  trailing?: ReactNode
}) {
  const { Icon, bg, fg } = notificationVisual(notification.notificationType)
  return (
    <div
      className={`notif-row ${notification.isRead ? '' : 'unread'}`}
      onClick={onClick}
    >
      <span className="notif-row__icon" style={{ background: bg, color: fg }}>
        <Icon size={16} strokeWidth={1.9} />
      </span>
      <div className="notif-row__text">
        <div className="notif-row__title">
          {notification.title}
          {!notification.isRead && <span className="notif-row__dot" />}
        </div>
        <div className="notif-row__desc">{notification.message}</div>
      </div>
      <div className="notif-row__time">{relativeTime(notification.createAt)}</div>
      {trailing}
    </div>
  )
}
