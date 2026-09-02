import type { ReactNode } from "react";
import { Spinner } from "@/shared/ui/spinner";
import { notificationVisual } from "../lib/notificationVisual";
import { relativeTime } from "../lib/relativeTime";
import type { Notification } from "../model/types";

/**
 * 알림 행 — Popover·Page 공용 single source(SoT 정합).
 *
 * 슬롯: 아이콘(34x34 tone) / 텍스트(제목+unread dot, 설명 2줄) / 상대시간(우측 상단) /
 *       trailing(선택 — Page 삭제 버튼 등).
 * unread 시각(좌측 엣지바·배경·dot)은 .notif-row.unread CSS 로 처리.
 */
export function NotificationRow({
  notification,
  now,
  onClick,
  trailing,
  pending,
}: {
  notification: Notification;
  /**
   * 상대시각의 기준점 — 호출부에서 `useNow()` 로 받아 내린다.
   *
   * 기본값을 주지 않는다. 기본값이 있으면 안 넘긴 호출부가 조용히 다른 기준을 쓰게
   * 되는데, 그래서 같은 알림이 벨과 알림 페이지에서 서로 다른 문구로 보였다.
   * 필수로 두면 새 호출부가 생겨도 컴파일이 먼저 붙잡는다.
   */
  now: number;
  onClick?: () => void;
  /** 행 우측 끝 추가 액션(Page 삭제 버튼). 미지정 시 SoT(Popover) 3슬롯 그대로. */
  trailing?: ReactNode;
  /** 읽음 처리 요청 진행 중 — 안 읽음 점 자리에 스피너, 클릭 잠금. */
  pending?: boolean;
}) {
  const { Icon, bg, fg } = notificationVisual(notification.notificationType);
  return (
    <div
      className={`notif-row ${notification.isRead ? "" : "unread"}`}
      aria-busy={pending || undefined}
      onClick={pending ? undefined : onClick}
    >
      <span className="notif-row__icon" style={{ background: bg, color: fg }}>
        <Icon size={16} strokeWidth={1.9} />
      </span>
      <div className="notif-row__text">
        <div className="notif-row__title">
          {notification.title}
          {pending ? (
            <Spinner size="sm" />
          ) : (
            !notification.isRead && <span className="notif-row__dot" />
          )}
        </div>
        <div className="notif-row__desc">{notification.message}</div>
      </div>
      <div className="notif-row__time">
        {relativeTime(notification.createAt, now)}
      </div>
      {trailing}
    </div>
  );
}
