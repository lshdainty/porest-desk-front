import {
  Bell,
  Bookmark,
  CalendarCog,
  Download,
  Eye,
  Monitor,
  Palette,
  PiggyBank,
  Repeat,
  ShieldCheck,
  BookOpen,
  Tag,
  Tags,
  User,
  CreditCard,
  FilePen,
  NotebookTabs,
} from "lucide-react";
import { config } from "@/shared/config";

export type SectionId =
  | "categories"
  | "accounts"
  | "budget"
  | "goals"
  | "recurring"
  | "presets"
  | "calendar-share"
  | "calendar-labels"
  | "todo-tags"
  | "memo-tags"
  | "appearance"
  | "notifications"
  | "data"
  | "account"
  | "privacy"
  | "guide"
  | "hide-amounts"
  | "devices";

export interface SectionDef {
  id: SectionId;
  labelKey: string;
  icon: React.ComponentType<{
    size?: number;
    strokeWidth?: number;
    color?: string;
  }>;
  descKey: string;
  /**
   * 값이 있으면 내부 섹션을 여는 대신 이 주소를 새 탭으로 연다.
   * 처리방침은 계정 단위 문서라 SSO 에 한 벌만 두고 여기서는 가리키기만 한다.
   */
  externalUrl?: string;
  /**
   * 목록(데스크톱 nav · 모바일 메뉴)에 내보내지 않는 섹션 — 다른 화면에서만 들어온다.
   * 금액 가리기는 계정 > 보안 아래 있어 설정 목록에 두 번 나오면 안 된다.
   */
  hidden?: boolean;
  /**
   * 되돌아갈 자리 — 목록이 아니라 다른 섹션에서 들어오는 화면용.
   * 없으면 메뉴로 나간다. 계정 > 보안에서 들어온 화면이 메뉴로 튀면 한 단계를 건너뛴다.
   */
  parent?: SectionId;
}

export const SECTIONS: SectionDef[] = [
  {
    id: "categories",
    labelKey: "sections.categories.label",
    icon: Tag,
    descKey: "sections.categories.desc",
  },
  {
    id: "accounts",
    labelKey: "sections.accounts.label",
    icon: CreditCard,
    descKey: "sections.accounts.desc",
  },
  {
    id: "budget",
    labelKey: "sections.budget.label",
    icon: FilePen,
    descKey: "sections.budget.desc",
  },
  {
    id: "goals",
    labelKey: "sections.goals.label",
    icon: PiggyBank,
    descKey: "sections.goals.desc",
  },
  {
    id: "recurring",
    labelKey: "sections.recurring.label",
    icon: Repeat,
    descKey: "sections.recurring.desc",
  },
  {
    id: "presets",
    labelKey: "sections.presets.label",
    icon: Bookmark,
    descKey: "sections.presets.desc",
  },
  {
    id: "calendar-share",
    labelKey: "sections.calendarShare.label",
    icon: CalendarCog,
    descKey: "sections.calendarShare.desc",
  },
  {
    id: "calendar-labels",
    labelKey: "sections.calendarLabels.label",
    icon: Tag,
    descKey: "sections.calendarLabels.desc",
  },
  {
    id: "todo-tags",
    labelKey: "sections.todoTags.label",
    icon: Tags,
    descKey: "sections.todoTags.desc",
  },
  {
    id: "memo-tags",
    labelKey: "sections.memoTags.label",
    icon: NotebookTabs,
    descKey: "sections.memoTags.desc",
  },
  {
    id: "appearance",
    labelKey: "sections.appearance.label",
    icon: Palette,
    descKey: "sections.appearance.desc",
  },
  {
    id: "notifications",
    labelKey: "sections.notifications.label",
    icon: Bell,
    descKey: "sections.notifications.desc",
  },
  {
    id: "data",
    labelKey: "sections.data.label",
    icon: Download,
    descKey: "sections.data.desc",
  },
  {
    id: "account",
    labelKey: "sections.account.label",
    icon: User,
    descKey: "sections.account.desc",
  },
  // 설명서(porest-desk-guide)는 desk 와 같은 호스트의 /guide/ 에 떠 있다 — 상대 경로라 dev·prod 모두 맞다.
  {
    id: "guide",
    labelKey: "sections.guide.label",
    icon: BookOpen,
    descKey: "sections.guide.desc",
    externalUrl: "/guide/",
  },
  {
    id: "privacy",
    labelKey: "sections.privacy.label",
    icon: ShieldCheck,
    descKey: "sections.privacy.desc",
    externalUrl: `${config.ssoUrl}/privacy`,
  },
  // 계정 > 보안에서 들어오는 화면(화면의 눈 버튼도 여기로 온다). 목록에는 안 나온다.
  {
    id: "hide-amounts",
    labelKey: "hideAmounts.label",
    icon: Eye,
    descKey: "hideAmounts.desc",
    hidden: true,
  },
  // 계정 > 보안에서 들어온다. 목록에는 안 나온다.
  {
    id: "devices",
    labelKey: "sections.devices.label",
    icon: Monitor,
    descKey: "sections.devices.desc",
    hidden: true,
    parent: "account",
  },
];

/**
 * 데스크톱 우측 패널 제목을 여기서 그려 주는 섹션.
 *
 * 나머지 섹션은 각자 `ManagerHead` 를 갖고 있는데(카테고리·계좌·예산·저축목표·
 * 캘린더 공유·캘린더 라벨·할일 태그·알림) 이 다섯은 없어서, 같은 자리에서 어떤
 * 섹션은 제목+설명으로 시작하고 어떤 섹션은 본문이 바로 시작했다. 좌측 nav 로 위치는
 * 알 수 있지만 패널 첫 줄의 리듬이 섹션마다 달랐다.
 *
 * 금액 가리기는 자기 뒤로가기 줄을 갖고 있어 제외한다.
 */
export const NEEDS_DESKTOP_HEAD: SectionId[] = [
  "recurring",
  "presets",
  "appearance",
  "data",
  "account",
  "devices",
];

/**
 * 폰 껍데기는 여백이 0 이고 본문이 제 좌우 24 를 갖는다(I-16 13 · S2). 아직 본문을 옮기지 않은 섹션은
 * 옛 껍데기의 사방 24 에 기대어 그려져 있어, 그 값 그대로를 여기서 임시로 둔다(설정 틀 I-16 — 본문 배치 전까지).
 * 본문 지시서(I-05 · I-08 · I-09 · I-10 · I-12 · I-14 · I-15 · I-17 · I-20)가 자기 섹션을 옮기며 이 목록에서 그 id 를 걷는다.
 * 금액 가리기는 제 껍데기를 직접 그려 여기 없다.
 */
export const TEMP_BODY_PADDING: SectionId[] = [
  "categories",
  "accounts",
  "budget",
  "goals",
  "recurring",
  "presets",
  "calendar-share",
  "calendar-labels",
  "todo-tags",
  "memo-tags",
  "appearance",
  "notifications",
  "data",
  "account",
  "devices",
];

// 외부 링크 항목은 열 내부 화면이 없으므로 URL 로 직접 접근 가능한 섹션에서 제외한다.
// hidden 섹션은 목록에만 안 보일 뿐 화면이 있어 ?section= 딥링크로 들어올 수 있다.
export const SECTION_IDS: SectionId[] = SECTIONS.filter(
  (s) => !s.externalUrl,
).map((s) => s.id);

// ─── 모바일 메뉴 그룹 정의 ─────────────────────────────────────
export interface GroupDef {
  labelKey: string;
  sectionIds: SectionId[];
}

export const MENU_GROUPS: GroupDef[] = [
  {
    labelKey: "groups.dataManage",
    sectionIds: [
      "categories",
      "accounts",
      "budget",
      "goals",
      "recurring",
      "presets",
    ],
  },
  {
    labelKey: "groups.tagsLabels",
    sectionIds: ["todo-tags", "memo-tags", "calendar-labels"],
  },
  {
    labelKey: "groups.share",
    sectionIds: ["calendar-share"],
  },
  {
    labelKey: "groups.appEnv",
    sectionIds: ["appearance", "notifications"],
  },
  {
    labelKey: "groups.data",
    sectionIds: ["data"],
  },
  {
    labelKey: "groups.account",
    sectionIds: ["account", "privacy"],
  },
  {
    labelKey: "groups.help",
    sectionIds: ["guide"],
  },
];
