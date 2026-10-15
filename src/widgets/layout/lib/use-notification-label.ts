import { useTranslation } from "react-i18next";

/** 벨의 이름 — 점이 있으면 "알림, 새 알림"(점만으로 알리지 않는다). 새 번역 키 없이 기존 두 키를 잇는다 */
export function useNotificationLabel(hasUnread: boolean) {
  const { t } = useTranslation(["layout", "notification"]);
  return hasUnread
    ? `${t("layout:notifications")}, ${t("notification:newNotification")}`
    : t("layout:notifications");
}
