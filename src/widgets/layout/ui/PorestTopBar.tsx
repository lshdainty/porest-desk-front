import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Bell, Eye, EyeOff, Plus, Search, Settings } from "lucide-react";
import { useHideAmounts } from "@/shared/lib/porest/hide-amounts-core";
import { useOpenHideAmountsSettings } from "@/shared/lib/porest/hide-amounts-nav";
import { useUnreadCount } from "@/features/notification";
import { NotificationsPopover } from "@/widgets/notification-manage";
import { SidebarTrigger } from "@/shared/ui/sidebar";
import { Button } from "@/shared/ui/button";
import { ModeToggle } from "@/shared/ui/mode-toggle";

export function PorestTopBar({ onOpenAdd }: { onOpenAdd: () => void }) {
  const { t } = useTranslation("layout");
  const navigate = useNavigate();
  const hidden = useHideAmounts();
  const { data: unreadCount = 0 } = useUnreadCount();
  const [notifOpen, setNotifOpen] = useState(false);
  // 여기서 바로 가리지 않는다 — 가릴 카드를 고르는 설정으로 보낸다(어느 화면인지 특정할 수 없어 전체 목록).
  const handleHideToggle = useOpenHideAmountsSettings();

  return (
    <header className="top">
      <SidebarTrigger className="h-8 w-8" />
      {/* 통합 검색은 아직 없다 — 종전엔 쳐도 아무 일이 안 일어나 고장으로 보였다(QA #49).
          readOnly + 누르면 준비 중 화면으로, 모바일 헤더의 검색 버튼과 같은 자리로 보낸다. */}
      <div
        className="top__search"
        onClick={() => navigate("/desk/search")}
        style={{ cursor: "pointer" }}
      >
        <Search size={15} />
        <input
          readOnly
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchPlaceholder")}
          onKeyDown={(e) => {
            if (e.key === "Enter") navigate("/desk/search");
          }}
          style={{ cursor: "pointer" }}
        />
      </div>
      <div className="top__actions">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleHideToggle}
          title={hidden ? t("showAmounts") : t("hideAmounts")}
          aria-label={hidden ? t("showAmounts") : t("hideAmounts")}
        >
          {hidden ? <EyeOff size={18} /> : <Eye size={18} />}
        </Button>
        <ModeToggle />
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("notifications")}
          onClick={() => setNotifOpen((v) => !v)}
          className="relative"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span
              aria-hidden
              className="absolute top-1.5 right-1.5 h-[7px] w-[7px] rounded-full border-2 border-[var(--bg-surface)] bg-[var(--fg-expense)]"
            />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("settings")}
          onClick={() => navigate("/desk/settings")}
        >
          <Settings size={18} />
        </Button>
        <Button size="sm" style={{ marginLeft: 6 }} onClick={onOpenAdd}>
          <Plus size={14} strokeWidth={2.4} />
          {t("addRecord")}
        </Button>
      </div>
      {notifOpen && (
        <NotificationsPopover
          onClose={() => setNotifOpen(false)}
          onGoSettings={() => navigate("/desk/settings")}
        />
      )}
    </header>
  );
}
