import type React from "react";
import {
  Calendar1,
  ChartPie,
  CreditCard,
  FilePen,
  FileText,
  LayoutDashboard,
  ReceiptText,
  SquareCheckBig,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

export interface NavItem {
  id: string;
  labelKey: string;
  icon: React.ComponentType<{
    size?: number;
    strokeWidth?: number;
    className?: string;
  }>;
  path: string;
}

// NAV 는 사이드바와 모바일 헤더가 함께 쓰는 상수라 컴포넌트 파일 밖에 둔다 —
// 컴포넌트 파일이 컴포넌트 아닌 것을 export 하면 Fast Refresh 가 그 파일의
// 상태를 매번 버린다(react-refresh/only-export-components).
// **하위 메뉴는 여기 담지 않는다.** 증권의 하위(증권사)는 연결 상태에 따라 사용자마다
// 달라지는 값이라 정적 상수에 못 들어가고, NAV 를 쓰는 다른 곳(모바일 헤더 제목)은
// 하위를 볼 일이 없다. 사이드바만 자기 자리에서 붙인다.
// label 은 layout ns i18n 키(labelKey) — 렌더 시 t(labelKey) 로 해석.
export const NAV: NavItem[] = [
  { id: "home", labelKey: "home", icon: LayoutDashboard, path: "/desk" },
  { id: "assets", labelKey: "asset", icon: Wallet, path: "/desk/asset" },
  { id: "stocks", labelKey: "stocks", icon: TrendingUp, path: "/desk/stocks" },
  { id: "tx", labelKey: "expense", icon: ReceiptText, path: "/desk/expense" },
  {
    id: "stats",
    labelKey: "statsAnalysis",
    icon: ChartPie,
    path: "/desk/stats",
  },
  { id: "budget", labelKey: "budget", icon: FilePen, path: "/desk/budget" },
  {
    id: "calendar",
    labelKey: "calendar",
    icon: Calendar1,
    path: "/desk/calendar",
  },
  { id: "todo", labelKey: "todoNav", icon: SquareCheckBig, path: "/desk/todo" },
  { id: "dutch", labelKey: "dutchPay", icon: Users, path: "/desk/dutch-pay" },
  { id: "memo", labelKey: "memo", icon: FileText, path: "/desk/memo" },
  {
    id: "card-benefit",
    labelKey: "cardBenefit",
    icon: CreditCard,
    path: "/desk/card-benefit",
  },
];
