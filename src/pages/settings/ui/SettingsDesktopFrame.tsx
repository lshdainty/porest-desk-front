import { useId } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/shared/ds/card";
import { SideNavigationItem } from "@/shared/ds/side-navigation";
import {
  MENU_GROUPS,
  SECTIONS,
  type SectionDef,
  type SectionId,
} from "../model/sections";
import { isPlainClick, settingsHref } from "../model/plain-click";
import { SettingsContent } from "./SettingsContent";

interface Props {
  section: SectionId | "menu";
  activeSection: SectionDef | null;
  /** 목록 줄을 눌렀다 — 기록을 남기고(push) 그 섹션으로 간다 */
  onSelect: (id: SectionId) => void;
  renderBody: (mobile: boolean) => React.ReactNode;
}

/**
 * 데스크톱(1280 이상) 두 칸 틀(I-16 19 ~ 30) — 가운데 1040 상자 안에 왼쪽 220 목록 · 24 · 오른쪽 본문 칸.
 * 목록 이름 "설정" 은 제목 태그가 아니다(화면 제목 h1 은 고른 항목 이름 하나 — 오른쪽 본문 칸).
 * 768 ~ 1279 는 두 칸을 걷고 한 단계 들어가는 `SettingsTabletFrame` 이다.
 */
export const SettingsDesktopFrame = ({
  section,
  activeSection,
  onSelect,
  renderBody,
}: Props) => {
  const { t } = useTranslation("settings");
  const listNameId = useId();
  // 목록에 있는 섹션이 아닌 숨은 구역(기기 · 금액 가리기 …)은 목록 대신 "‹ {부모}" 가 돌아가는 길이다
  const parent = activeSection?.parent
    ? SECTIONS.find((s) => s.id === activeSection.parent)
    : null;
  return (
    <div
      data-slot="settings-desktop"
      className="px-[var(--layout-margin)] pb-screen-bottom pt-nav-to-title"
    >
      <div className="mx-auto grid w-full max-w-[var(--layout-max-medium)] grid-cols-[220px_minmax(0,1fr)] items-start gap-[var(--layout-gutter)]">
        <div className="min-w-0">
          <p
            id={listNameId}
            className="mb-x2 ml-x3_5 mt-x1_5 text-t5 font-bold text-fg-neutral"
          >
            {t("page.title")}
          </p>
          <Card className="p-x2">
            <nav aria-labelledby={listNameId}>
              <ul className="m-0 flex list-none flex-col p-0">
                {MENU_GROUPS.map((group, gi) => (
                  <GroupItems
                    key={group.labelKey}
                    divider={gi > 0}
                    sections={group.sectionIds
                      .map((id) => SECTIONS.find((s) => s.id === id))
                      .filter((s): s is SectionDef => s !== undefined)}
                    section={section}
                    activeSection={activeSection}
                    onSelect={onSelect}
                  />
                ))}
              </ul>
            </nav>
          </Card>
        </div>
        <div className="min-w-0">
          {activeSection && (
            <SettingsContent
              activeSection={activeSection}
              back={
                parent
                  ? {
                      to: settingsHref(parent.id),
                      label: t(parent.labelKey),
                    }
                  : null
              }
              renderBody={renderBody}
            />
          )}
        </div>
      </div>
    </div>
  );
};

function GroupItems({
  divider,
  sections,
  section,
  activeSection,
  onSelect,
}: {
  divider: boolean;
  sections: SectionDef[];
  section: SectionId | "menu";
  activeSection: SectionDef | null;
  onSelect: (id: SectionId) => void;
}) {
  const { t } = useTranslation("settings");
  const { t: tc } = useTranslation("common");
  const newTab = tc("newTab");
  return (
    <>
      {divider && (
        // 묶음 사이 선만 — 이름은 두지 않는다(Q2-C). 접힌 사이드바 groupDivider 와 같은 값(1px · 위아래 8 · 좌우 8)
        <li
          aria-hidden
          className="mx-x2 my-x2 h-px list-none bg-stroke-neutral-subtle"
        />
      )}
      {sections.map((s) => {
        const Icon = s.icon;
        const label = t(s.labelKey);
        if (s.externalUrl) {
          return (
            <SideNavigationItem
              key={s.id}
              href={s.externalUrl}
              icon={<Icon />}
              label={label}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${label} (${newTab})`}
            />
          );
        }
        // 지금 항목 — 목록에 없는 숨은 구역은 부모가 켜진다(S6)
        const current = section === s.id || activeSection?.parent === s.id;
        return (
          <SideNavigationItem
            key={s.id}
            href={settingsHref(s.id)}
            icon={<Icon />}
            label={label}
            current={current}
            onClick={(e) => {
              if (!isPlainClick(e)) return;
              e.preventDefault();
              onSelect(s.id);
            }}
          />
        );
      })}
    </>
  );
}
