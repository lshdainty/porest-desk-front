import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Bell, Plus, Settings } from "lucide-react";
import {
  TopNavigation,
  TopNavigationActions,
  TopNavigationIconButton,
  TopNavigationPrimaryButton,
} from "@/shared/ds/top-navigation";
import { useWideSurface } from "@/shared/ds/overlay";
import { useUnreadCount } from "@/features/notification";
import {
  NotificationsPopover,
  NotificationsSheet,
} from "@/widgets/notification-manage";
import { useNotificationLabel } from "../lib/use-notification-label";

/**
 * 데스크톱(768 이상) 머리 — 왼쪽은 비우고(제목은 본문 맨 위 ScreenTitle, 사이드바 접기는 사이드바 머리로 갔다)
 * 오른쪽에 "내역 추가" 주 버튼 + 알림 · 설정. 검색칸 · 테마 토글 · 금액 가리기 눈은 걷었다(17-3c — 폰 카드의 눈은 그대로)(model/shell.ts 임시 선택 3).
 * `<header>` 는 `<main>` 밖이다(banner).
 */
export function DesktopHeader({ onOpenAdd }: { onOpenAdd: () => void }) {
  const { t } = useTranslation("layout");
  const navigate = useNavigate();
  const { data: unreadCount = 0 } = useUnreadCount();
  const hasUnread = unreadCount > 0;
  const notificationLabel = useNotificationLabel(hasUnread);
  const [notifOpen, setNotifOpen] = useState(false);
  // 알림은 1280 이상이면 Popover, 그 아래(768~1279)는 Bottom Sheet(Q-017 17-3b)
  const wide = useWideSurface();

  return (
    <TopNavigation type="desktop">
      <TopNavigationActions>
        <TopNavigationPrimaryButton onClick={onOpenAdd}>
          <Plus />
          {t("addRecord")}
        </TopNavigationPrimaryButton>
        <TopNavigationIconButton
          aria-label={notificationLabel}
          aria-haspopup="dialog"
          aria-expanded={notifOpen}
          notification={hasUnread}
          onClick={() => setNotifOpen((v) => !v)}
        >
          <Bell />
        </TopNavigationIconButton>
        <TopNavigationIconButton
          aria-label={t("settings")}
          onClick={() => navigate("/desk/settings")}
        >
          <Settings />
        </TopNavigationIconButton>
      </TopNavigationActions>
      {notifOpen &&
        (wide ? (
          <NotificationsPopover
            onClose={() => setNotifOpen(false)}
            onGoSettings={() => navigate("/desk/settings")}
          />
        ) : (
          <NotificationsSheet
            onClose={() => setNotifOpen(false)}
            onGoSettings={() => navigate("/desk/settings")}
          />
        ))}
    </TopNavigation>
  );
}
