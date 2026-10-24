export interface NavItem {
  labelKey: string;
  path: string;
  descKey: string;
}

export interface NavGroup {
  labelKey: string;
  items: NavItem[];
}

// K뱅크 톤 전체 메뉴 — 카드·아이콘·설명 행 없이 그룹 라벨 + 2열 텍스트 링크
// (design chrome.jsx MoreScreen SoT — 모바일 카드 다이어트).
export const GROUPS: NavGroup[] = [
  {
    labelKey: "group.money",
    items: [
      {
        labelKey: "item.expense",
        path: "/desk/expense",
        descKey: "desc.expense",
      },
      { labelKey: "item.asset", path: "/desk/asset", descKey: "desc.asset" },
      { labelKey: "item.stocks", path: "/desk/stocks", descKey: "desc.stocks" },
      { labelKey: "item.budget", path: "/desk/budget", descKey: "desc.budget" },
      {
        labelKey: "item.savingGoal",
        path: "/desk/settings?section=goals",
        descKey: "desc.savingGoal",
      },
      { labelKey: "item.stats", path: "/desk/stats", descKey: "desc.stats" },
      {
        labelKey: "item.recurring",
        path: "/desk/settings?section=recurring",
        descKey: "desc.recurring",
      },
      {
        labelKey: "item.accounts",
        path: "/desk/settings?section=accounts",
        descKey: "desc.accounts",
      },
    ],
  },
  {
    labelKey: "group.daily",
    items: [
      {
        labelKey: "item.calendar",
        path: "/desk/calendar",
        descKey: "desc.calendar",
      },
      { labelKey: "item.todo", path: "/desk/todo", descKey: "desc.todo" },
      { labelKey: "item.memo", path: "/desk/memo", descKey: "desc.memo" },
      {
        labelKey: "item.dutchPay",
        path: "/desk/dutch-pay",
        descKey: "desc.dutchPay",
      },
      {
        labelKey: "item.cardBenefit",
        path: "/desk/card-benefit",
        descKey: "desc.cardBenefit",
      },
    ],
  },
  {
    labelKey: "group.personal",
    items: [
      {
        labelKey: "item.categories",
        path: "/desk/settings?section=categories",
        descKey: "desc.categories",
      },
      {
        labelKey: "item.presets",
        path: "/desk/settings?section=presets",
        descKey: "desc.presets",
      },
      {
        labelKey: "item.appearance",
        path: "/desk/settings?section=appearance",
        descKey: "desc.appearance",
      },
    ],
  },
  {
    labelKey: "group.system",
    items: [
      {
        labelKey: "item.settings",
        path: "/desk/settings",
        descKey: "desc.settings",
      },
      // 알림 '목록' 이 아니라 알림 '설정' 이다 — 설명이 푸시·방해 금지를 말하고 있고,
      // 목록은 헤더의 종 아이콘이 이미 연다. 앱 더보기도 설정으로 간다.
      {
        labelKey: "item.notifications",
        path: "/desk/settings?section=notifications",
        descKey: "desc.notifications",
      },
      {
        labelKey: "item.dataExport",
        path: "/desk/settings?section=data",
        descKey: "desc.dataExport",
      },
      {
        labelKey: "item.account",
        path: "/desk/settings?section=account",
        descKey: "desc.account",
      },
      // 앱 받기 — 로그인 밖 공개 페이지라 경로에 /desk 가 없다.
      {
        labelKey: "item.appDownload",
        path: "/download",
        descKey: "desc.appDownload",
      },
    ],
  },
];
