import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import { List } from "@/shared/ds/list";
import { PageHead } from "@/shared/ui/groo/page-head";
import { Button } from "@/shared/ui/button";
import { Skeleton as SkeletonBase } from "@/shared/ui/skeleton";
import { MobileBackHeader } from "@/shared/ui/groo/mobile-back-header";
import {
  NotificationMoreMenu,
  useMarkAllRead,
  useMarkRead,
  useNotifications,
  useUnreadCount,
} from "@/features/notification";
import { useNow } from "@/shared/hooks";
import { NotificationRow } from "@/entities/notification";
import type { Notification } from "@/entities/notification";

type OutletCtx = { onAddTx: () => void; mobile: boolean };

/** 알림 목록 skeleton — 타일(40) + 제목+메시지 + 시간 행 × 6. */
function NotificationsPageSkeleton() {
  return (
    <div className="py-x1">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          aria-hidden
          className="flex items-start gap-x3 px-global-gutter py-x3"
        >
          <SkeletonBase className="size-10 shrink-0 rounded-md" />
          <div className="min-w-0 flex-1">
            <SkeletonBase
              className={`mb-1 h-4 ${i % 3 === 0 ? "w-36" : i % 3 === 1 ? "w-28" : "w-40"}`}
            />
            <SkeletonBase className="h-3 w-48" />
          </div>
          <SkeletonBase className="mt-0.5 h-3 w-8 shrink-0" />
        </div>
      ))}
    </div>
  );
}

/**
 * 알림 페이지 — 데스크탑 NotificationsPopover(SoT) 의 풀페이지 미러.
 *
 * 행 구성·tone 매핑·unread 시각·상대시간·footer 는 Popover 와 공용
 * (`@/entities/notification` NotificationRow / relativeTime / notificationVisual).
 * 줄마다 × 를 달지 않는다(W4, 2026-10-21) — 팝오버 · 시트와 같은 SEED List 줄이다(타일 40 · 제목 16/400 · 안 읽은 줄만 버튼).
 * 지우기는 줄 끝 ⋮ → 삭제 → 확인창이다(2026-10-22 알림 지우기 결정 B — 팝오버 · 시트 · 이 화면 셋이 같다).
 * 차이: 풀페이지라 dialog 박스·backdrop 없음, unreadCount 는 별도 useUnreadCount 쿼리.
 */
export function NotificationsPage() {
  const { t } = useTranslation("notification");
  const navigate = useNavigate();
  const { mobile } = useOutletContext<OutletCtx>();
  // 상대시각 기준점 — 벨(NotificationBell)과 **같은 훅**을 쓴다. 기준이 갈리면 같은
  // 알림이 여기선 "2시간 전", 벨에선 "방금" 으로 보인다(실제로 그랬다).
  const now = useNow();
  const { data: notifications = [], isLoading } = useNotifications();
  const { data: unreadCount = 0 } = useUnreadCount();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  const handleClick = (n: Notification) => {
    if (!n.isRead) markRead.mutate(n.rowId);
  };

  const markAllButton =
    unreadCount > 0 ? (
      <Button
        variant="ghost"
        size="sm"
        loading={markAllRead.isPending}
        onClick={() => markAllRead.mutate()}
        className="text-[var(--fg-primary)] hover:bg-[var(--bg-brand-subtle)] hover:text-[var(--fg-primary)]"
      >
        {t("markAllRead")}
      </Button>
    ) : null;

  // 본문 — 데스크탑/모바일 공용. unread 서브 바는 본문 상단(SoT 헤더 서브 위치 참고).
  let body: ReactNode;
  if (isLoading) {
    body = <NotificationsPageSkeleton />;
  } else if (notifications.length === 0) {
    body = (
      <div className="px-5 py-10 text-center text-sm text-[var(--fg-tertiary)]">
        {t("popover.empty")}
      </div>
    );
  } else {
    body = (
      <List aria-label={t("title")}>
        {notifications.map((n) => (
          <NotificationRow
            key={n.rowId}
            notification={n}
            pending={markRead.pendingIds.has(n.rowId)}
            now={now}
            onClick={() => handleClick(n)}
            menu={<NotificationMoreMenu notification={n} />}
          />
        ))}
      </List>
    );
  }

  // unread 카운터 서브 바 — 본문 상단. 모바일은 '모두 읽음'을 헤더로 옮기므로 카운터만 표시.
  const unreadSub =
    !isLoading && unreadCount > 0 ? (
      <div
        style={{
          padding: mobile ? "12px 24px 8px" : "12px 20px 8px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          color: "var(--fg-secondary)",
          fontSize: "var(--text-label-sm)",
        }}
      >
        <span>
          <Trans
            t={t}
            i18nKey="popover.unread"
            values={{ count: unreadCount }}
            components={{
              b: (
                <b
                  style={{ color: "var(--fg-brand-strong)", fontWeight: "700" }}
                />
              ),
            }}
          />
        </span>
      </div>
    ) : null;

  const footer = (
    <div
      style={{
        padding: "10px 14px",
        // 바닥에 고정되므로 홈 인디케이터에 가리지 않게 인셋을 보상한다
        // (앱은 SafeArea(top: false) 가 같은 일을 한다).
        paddingBottom: mobile
          ? "calc(10px + env(safe-area-inset-bottom))"
          : undefined,
        borderTop: "1px solid var(--border-subtle)",
        /* 앱 footer(bg-page-dark) 정합 — sunken(input,더밝음) 대신 canvas */
        background: "var(--bg-canvas)",
      }}
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => navigate("/desk/settings?section=notifications")}
        className="w-full justify-center gap-1 text-[var(--fg-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--fg-primary)]"
      >
        {t("prefs.title")} <ChevronRight size={12} />
      </Button>
    </div>
  );

  // ── 모바일 — 풀스크린(← 헤더 + 우측 '모두 읽음'). 가운데 목록만 스크롤. ──────────
  //
  // 바깥을 통째로 m-scroll(flex:1 + overflow-y:auto) 로 두면 footer 까지 같이
  // 흘러가 목록 끝에 붙어 버린다 — 주석은 "footer 고정" 인데 실제로는 안 그랬다.
  // 그래서 바깥은 flex column 으로 두고 **목록에만** m-scroll 을 준다.
  if (mobile) {
    return (
      <>
        <MobileBackHeader title={t("title")} trailing={markAllButton} />
        <div className="notif-mobile">
          {unreadSub}
          <div className="m-scroll notif-mobile__body" style={{ padding: 0 }}>
            {body}
          </div>
          {footer}
        </div>
      </>
    );
  }

  // ── 데스크탑 ────────────────────────────────────────────────────────────────
  return (
    <div className="m-scroll" style={{ padding: 0 }}>
      <div className="px-[var(--layout-margin)] pt-nav-to-title">
        <PageHead title={t("title")} actions={markAllButton} />
      </div>
      {unreadSub}
      {body}
      {footer}
    </div>
  );
}
