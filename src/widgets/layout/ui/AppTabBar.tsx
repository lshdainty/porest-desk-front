import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Calendar1, Home, Menu, ReceiptText } from "lucide-react";
import {
  BottomNavigation,
  BottomNavigationAddButton,
  BottomNavigationItem,
} from "@/shared/ds/bottom-navigation";
import { SnackbarAvoidOverlap } from "@/shared/ds/snackbar";
import { useLinkClick } from "../lib/use-link-click";
import {
  isAllTab,
  isCalendarTab,
  isExpenseTab,
  isHomeTab,
} from "../model/shell";

/**
 * 모바일 하단 탭 바 — 홈 · 가계부 · + · 캘린더 · 전체. 다섯 칸이 어느 화면에서나 같다(옛 money 모드는 없다 —
 * 가계부 · 자산 · 통계 · 예산은 모두 "가계부" 가 현재이고 화면 위 Line Tabs 가 넷을 나눈다).
 *
 * 칸은 `<a href>` 라 라우터로 옮기도록 onClick 을 넘기고, 지금 탭을 다시 누르면(onReselect) 그 탭의 첫 화면으로
 * replace 하며 맨 위로 스크롤한다(같은 주소를 쌓지 않는다).
 */
export function AppTabBar({
  onAdd,
  addLabel,
}: {
  onAdd: () => void;
  /**
   * `+` 의 접근성 라벨 — **부모가 `onAdd` 와 짝지어 넘긴다**(`fabFor`).
   *
   * 여기서 `t("addTransaction")` 로 박아 두면 캘린더처럼 다른 것을 여는 화면에서
   * 낭독기·자동화가 속는다(QA #159). 무엇을 여는지 아는 쪽이 이름도 짓는다.
   */
  addLabel: string;
}) {
  const { t } = useTranslation("layout");
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const link = useLinkClick();

  const tab = (
    href: string,
    label: string,
    icon: React.ReactNode,
    current: boolean,
  ) => (
    <BottomNavigationItem
      href={href}
      label={label}
      icon={icon}
      current={current}
      onClick={link(href)}
      onReselect={({ scrollToTop }) => {
        navigate(href, { replace: true });
        scrollToTop();
      }}
    />
  );

  return (
    <SnackbarAvoidOverlap>
      <BottomNavigation>
        {tab("/desk", t("home"), <Home />, isHomeTab(pathname))}
        {tab(
          "/desk/expense",
          t("expense"),
          <ReceiptText />,
          isExpenseTab(pathname),
        )}
        <BottomNavigationAddButton aria-label={addLabel} onClick={onAdd} />
        {tab(
          "/desk/calendar",
          t("calendar"),
          <Calendar1 />,
          isCalendarTab(pathname),
        )}
        {tab("/desk/more", t("all"), <Menu />, isAllTab(pathname))}
      </BottomNavigation>
    </SnackbarAvoidOverlap>
  );
}
