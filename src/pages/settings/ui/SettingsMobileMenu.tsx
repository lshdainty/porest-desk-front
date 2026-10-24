import { useTranslation } from "react-i18next";
import { ChevronRight } from "lucide-react";
import { Avatar } from "@/shared/ds/avatar";
import {
  List,
  ListButtonItem,
  ListHeader,
  ListLinkItem,
} from "@/shared/ds/list";
import { Skeleton } from "@/shared/ds/skeleton";
import {
  TopNavigation,
  TopNavigationBackButton,
  TopNavigationTitle,
} from "@/shared/ds/top-navigation";
import { useCurrentUser } from "@/features/user";
import {
  MENU_GROUPS,
  SECTIONS,
  type SectionDef,
  type SectionId,
} from "../model/sections";

/**
 * 설정 메뉴(폰) — 흰 면 하나(I-12 1-B). 상단 바(← 설정) → 계정 줄 → 묶음 일곱(목록 제목 + 줄) → 끝 여백.
 * 띠 없이 목록 제목(boldSolid) + 위 16 으로 묶음을 가른다. 줄 앞 아이콘 22 는 데스크톱 왼쪽 목록과 같은 표(SECTIONS)다.
 */
export function SettingsMobileMenu({
  changeSection,
  openSection,
  goBack,
}: {
  changeSection: (id: SectionId | "menu") => void;
  /** 메뉴 항목 클릭 — 외부 링크 항목은 새 탭으로 열린다 */
  openSection: (s: SectionDef) => void;
  /** ← — 들어온 화면으로(History), 앞 화면이 없으면 전체로 */
  goBack: () => void;
}) {
  const { t } = useTranslation("settings");
  const { t: tCommon } = useTranslation("common");
  const { data: user, isLoading } = useCurrentUser();

  return (
    <>
      <TopNavigation type="standard">
        <TopNavigationBackButton fallbackHref="/desk/more" onClick={goBack} />
        <TopNavigationTitle>{t("page.title")}</TopNavigationTitle>
      </TopNavigation>
      {/* 흰 면 하나 — 화면 아래 끝까지(셸 바닥은 회색이라 이 면이 직접 채운다). 끝 여백 24 + 안전 영역은 면 안 */}
      <div className="flex-1 bg-bg-layer-default pb-[calc(var(--spacing-x6)+env(safe-area-inset-bottom))]">
        {/* 계정 줄 — 받는 동안은 Skeleton 줄 하나, 정보가 없거나 실패면 줄을 숨긴다 */}
        {isLoading ? (
          <AccountRowSkeleton />
        ) : user ? (
          <List>
            <ListButtonItem
              prefix={<Avatar name={user.userName} size={42} />}
              title={user.userName || t("account.defaultName")}
              detail={user.userEmail}
              suffix={<ChevronRight aria-hidden />}
              onClick={() => changeSection("account")}
            />
          </List>
        ) : null}

        {MENU_GROUPS.map((group) => {
          const groupSections = group.sectionIds
            .map((id) => SECTIONS.find((s) => s.id === id))
            .filter((s): s is SectionDef => s !== undefined);
          const headId = `settings-group-${group.labelKey}`;

          return (
            <section key={group.labelKey}>
              <ListHeader id={headId} variant="boldSolid" className="mt-x4">
                {t(group.labelKey)}
              </ListHeader>
              <List aria-labelledby={headId}>
                {groupSections.map((s) => {
                  const Icon = s.icon;
                  return s.externalUrl ? (
                    <ListLinkItem
                      key={s.id}
                      href={s.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      prefix={<Icon />}
                      title={
                        <>
                          {t(s.labelKey)}
                          <span className="sr-only">
                            {" "}
                            ({tCommon("newTab")})
                          </span>
                        </>
                      }
                      suffix={<ChevronRight aria-hidden />}
                    />
                  ) : (
                    <ListButtonItem
                      key={s.id}
                      prefix={<Icon />}
                      title={t(s.labelKey)}
                      suffix={<ChevronRight aria-hidden />}
                      onClick={() => openSection(s)}
                    />
                  );
                })}
              </List>
            </section>
          );
        })}
      </div>
    </>
  );
}

/** 계정 줄 자리 — 원 42 + 제목 · 설명 막대(줄 값 그대로: 위아래 12 · 좌우 24 · 앞 붙이개 뒤 12) */
function AccountRowSkeleton() {
  return (
    <div
      aria-hidden
      data-account-skeleton
      className="flex items-center gap-x3 px-global-gutter py-x3"
    >
      <Skeleton radius="full" className="size-[42px] shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col gap-x0_5">
        <Skeleton radius="4" text="t5" className="w-2/5" />
        <Skeleton radius="4" text="t3" className="w-1/4" />
      </div>
    </div>
  );
}
