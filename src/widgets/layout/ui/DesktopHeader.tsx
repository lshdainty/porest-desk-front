import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Bell, Eye, EyeOff, Plus, Settings } from "lucide-react";
import {
  TopNavigation,
  TopNavigationActions,
  TopNavigationIconButton,
  TopNavigationPrimaryButton,
} from "@/shared/ds/top-navigation";
import { useHideAmounts } from "@/shared/lib/groo/hide-amounts-core";
import { useOpenHideAmountsSettings } from "@/shared/lib/groo/hide-amounts-nav";
import { useUnreadCount } from "@/features/notification";
import { NotificationsPopover } from "@/widgets/notification-manage";
import { useNotificationLabel } from "../lib/use-notification-label";

/**
 * 데스크톱(768 이상) 머리 — 왼쪽은 비우고(제목은 본문 맨 위 ScreenTitle, 사이드바 접기는 사이드바 머리로 갔다)
 * 오른쪽에 "내역 추가" 주 버튼 + 금액 가리기 · 알림 · 설정. 검색칸 · 테마 토글은 걷었다(model/shell.ts 임시 선택 3).
 * `<header>` 는 `<main>` 밖이다(banner).
 */
export function DesktopHeader({ onOpenAdd }: { onOpenAdd: () => void }) {
  const { t } = useTranslation("layout");
  const navigate = useNavigate();
  const hidden = useHideAmounts();
  const { data: unreadCount = 0 } = useUnreadCount();
  const hasUnread = unreadCount > 0;
  const notificationLabel = useNotificationLabel(hasUnread);
  const [notifOpen, setNotifOpen] = useState(false);
  // 여기서 바로 가리지 않는다 — 가릴 카드를 고르는 설정으로 보낸다(어느 화면인지 특정할 수 없어 전체 목록).
  const handleHideToggle = useOpenHideAmountsSettings();

  return (
    <TopNavigation type="desktop">
      <TopNavigationActions>
        <TopNavigationPrimaryButton onClick={onOpenAdd}>
          <Plus />
          {t("addRecord")}
        </TopNavigationPrimaryButton>
        {/* 켜고 끄는 단추 — 이름은 고정, 지금 상태는 aria-pressed 와 아이콘(가렸으면 eye-off)이 말한다 */}
        <TopNavigationIconButton
          aria-label={t("hideAmounts")}
          aria-pressed={hidden}
          onClick={handleHideToggle}
        >
          {hidden ? <EyeOff /> : <Eye />}
        </TopNavigationIconButton>
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
      {notifOpen && (
        <NotificationsPopover
          onClose={() => setNotifOpen(false)}
          onGoSettings={() => navigate("/desk/settings")}
        />
      )}
    </TopNavigation>
  );
}
