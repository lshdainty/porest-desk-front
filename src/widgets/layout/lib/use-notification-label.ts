import { useTranslation } from "react-i18next";

/** 벨의 이름 — 점이 있으면 "알림, 새 알림 있음" / "Notifications, new notifications"(점만으로 알리지 않는다). 데스크톱 벨(NotificationsMenu)과 같은 번역 문구 */
export function useNotificationLabel(hasUnread: boolean) {
  const { t } = useTranslation("layout");
  return hasUnread ? t("notificationsUnread") : t("notifications");
}
