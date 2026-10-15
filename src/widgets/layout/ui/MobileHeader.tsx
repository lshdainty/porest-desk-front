import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Bell, Search } from "lucide-react";
import {
  TopNavigation,
  TopNavigationActions,
  TopNavigationIconButton,
  TopNavigationTitle,
} from "@/shared/ds/top-navigation";
import { useUnreadCount } from "@/features/notification";
import { useNotificationLabel } from "../lib/use-notification-label";
import { rootActionsFor, screenTitleKey } from "../model/shell";

/**
 * 모바일 root 머리 — 탭 바의 첫 화면(홈 · 가계부 · 캘린더 · 전체)의 큰 제목 + 오른쪽 아이콘.
 * 오른쪽은 홈 = 검색 + 알림, 그 밖 = 검색(model/shell.ts rootActionsFor). 알림 점은 안 읽은 알림이 있을 때만이고
 * 이름에도 "새 알림 있음" 을 넣는다(점만으로 알리지 않는다).
 * 테마 전환은 설정 > 표시 설정, 금액 가리기는 홈 · 자산 순자산 카드의 눈 버튼.
 */
export function MobileHeader() {
  const { t } = useTranslation("layout");
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { data: unreadCount = 0 } = useUnreadCount();
  const actions = rootActionsFor(pathname);
  const hasUnread = unreadCount > 0;
  const notificationLabel = useNotificationLabel(hasUnread);

  return (
    <TopNavigation type="root">
      <TopNavigationTitle>{t(screenTitleKey(pathname))}</TopNavigationTitle>
      <TopNavigationActions>
        {actions.includes("search") && (
          <TopNavigationIconButton
            aria-label={t("search")}
            onClick={() => navigate("/desk/search")}
          >
            <Search />
          </TopNavigationIconButton>
        )}
        {actions.includes("notifications") && (
          <TopNavigationIconButton
            aria-label={notificationLabel}
            notification={hasUnread}
            onClick={() => navigate("/desk/notifications")}
          >
            <Bell />
          </TopNavigationIconButton>
        )}
      </TopNavigationActions>
    </TopNavigation>
  );
}
