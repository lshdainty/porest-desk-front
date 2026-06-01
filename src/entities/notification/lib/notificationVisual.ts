/**
 * 알림 type 별 비주얼(아이콘 + tone 색) 공용 매핑 — notif-pop 디자인 SoT 미러.
 *
 * 데스크탑 팝오버(NotificationsPopover)와 모바일 페이지(NotificationsPage)가
 * 동일한 type별 tone 아이콘(34x34, radius 10)을 쓰도록 단일 source.
 * 매핑은 디자인 SoT(dialogs.jsx NotificationsPopover toneStyle)와 정합:
 * - BUDGET_ALERT  → AlertTriangle / warning(subtle·fg)
 * - TODO_REMINDER → ListChecks    / brand(subtle·strong)
 * - EVENT_REMINDER→ CalendarClock  / info(subtle·fg)
 * - SYSTEM(기본)  → Bell           / sunken·secondary
 */
import { AlertTriangle, Bell, CalendarClock, ListChecks } from 'lucide-react'
import type { NotificationType } from '../model/types'

export interface NotificationVisual {
  /** lucide 아이콘 컴포넌트. */
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>
  /** 아이콘 칩 배경 토큰. */
  bg: string
  /** 아이콘 전경(글자) 색 토큰. */
  fg: string
}

/** 알림 type → { Icon, bg, fg } tone 비주얼 매핑. */
export function notificationVisual(type: NotificationType): NotificationVisual {
  switch (type) {
    case 'BUDGET_ALERT':
      return { Icon: AlertTriangle, bg: 'var(--status-warning-subtle)', fg: 'var(--status-warning-fg)' }
    case 'TODO_REMINDER':
      return { Icon: ListChecks, bg: 'var(--bg-brand-subtle)', fg: 'var(--fg-brand-strong)' }
    case 'EVENT_REMINDER':
      return { Icon: CalendarClock, bg: 'var(--status-info-subtle)', fg: 'var(--status-info-fg)' }
    default:
      return { Icon: Bell, bg: 'var(--bg-sunken)', fg: 'var(--fg-secondary)' }
  }
}
