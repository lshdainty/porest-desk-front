import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, Settings } from "lucide-react";
import {
  TopNavigation,
  TopNavigationActions,
  TopNavigationIconButton,
  TopNavigationPrimaryButton,
} from "@/shared/ds/top-navigation";
import { NotificationsMenu } from "@/widgets/notification-manage";

/**
 * 데스크톱(768 이상) 머리 — 왼쪽은 비우고(제목은 본문 맨 위 ScreenTitle, 사이드바 접기는 사이드바 머리로 갔다)
 * 오른쪽에 "내역 추가" 주 버튼 + 알림 · 설정. 검색칸 · 테마 토글 · 금액 가리기 눈은 걷었다(17-3c — 폰 카드의 눈은 그대로).
 * 알림은 1280 이상 Popover · 미만 Bottom Sheet(NotificationsMenu). `<header>` 는 `<main>` 밖이다(banner).
 */
export function DesktopHeader({ onOpenAdd }: { onOpenAdd: () => void }) {
  const { t } = useTranslation("layout");
  const navigate = useNavigate();

  return (
    <TopNavigation type="desktop">
      <TopNavigationActions>
        <TopNavigationPrimaryButton onClick={onOpenAdd}>
          <Plus />
          {t("addRecord")}
        </TopNavigationPrimaryButton>
        <NotificationsMenu
          onGoSettings={() => navigate("/desk/settings?section=notifications")}
        />
        <TopNavigationIconButton
          aria-label={t("settings")}
          onClick={() => navigate("/desk/settings")}
        >
          <Settings />
        </TopNavigationIconButton>
      </TopNavigationActions>
    </TopNavigation>
  );
}
