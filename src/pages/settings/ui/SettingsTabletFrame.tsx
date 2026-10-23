import { ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardHeader, CardTitle } from "@/shared/ds/card";
import { List, ListLinkItem } from "@/shared/ds/list";
import { PageHead } from "@/shared/ui/groo/page-head";
import {
  MENU_GROUPS,
  SECTIONS,
  type SectionDef,
  type SectionId,
} from "../model/sections";
import { isPlainClick, settingsHref } from "../model/plain-click";
import { SettingsContent } from "./SettingsContent";

interface Props {
  activeSection: SectionDef | null;
  /** 메뉴 페이지의 줄을 눌렀다 — 기록을 남기고(push) 그 섹션 페이지로 들어간다 */
  onSelect: (id: SectionId) => void;
  renderBody: (mobile: boolean) => React.ReactNode;
}

/**
 * 태블릿(768 ~ 1279) 한 단계 틀(I-16 31 ~ 33 · Q3-B) — 두 칸을 걷고, 섹션이 없는 주소는 설정 메뉴 페이지,
 * `?section=` 은 "‹ 설정" 으로 돌아가는 하위 페이지(왼쪽 목록 없음)다. 상자는 가운데 720(layout-max-low).
 */
export const SettingsTabletFrame = ({
  activeSection,
  onSelect,
  renderBody,
}: Props) => {
  const { t } = useTranslation("settings");
  const parent = activeSection?.parent
    ? SECTIONS.find((s) => s.id === activeSection.parent)
    : null;
  return (
    <div
      data-slot="settings-tablet"
      className="px-[var(--layout-margin)] pb-screen-bottom pt-nav-to-title"
    >
      <div className="mx-auto w-full max-w-[var(--layout-max-low)]">
        {activeSection ? (
          <SettingsContent
            activeSection={activeSection}
            back={
              parent
                ? { to: settingsHref(parent.id), label: t(parent.labelKey) }
                : { to: "/desk/settings", label: t("page.title") }
            }
            renderBody={renderBody}
          />
        ) : (
          <SettingsMenuPage onSelect={onSelect} />
        )}
      </div>
    </div>
  );
};

/** 설정 메뉴 페이지 — 제목 줄 h1 "설정" → 24 → 묶음마다 카드(사이 8) */
function SettingsMenuPage({ onSelect }: { onSelect: (id: SectionId) => void }) {
  const { t } = useTranslation("settings");
  const { t: tc } = useTranslation("common");
  return (
    <>
      <PageHead
        title={t("page.title")}
        description={t("page.subtitle")}
        style={{ marginBottom: "var(--spacing-x6)" }}
      />
      <div className="flex flex-col gap-x2">
        {MENU_GROUPS.map((group) => {
          const titleId = `settings-group-${group.labelKey}`;
          const sections = group.sectionIds
            .map((id) => SECTIONS.find((s) => s.id === id))
            .filter((s): s is SectionDef => s !== undefined);
          return (
            <Card key={group.labelKey} body="list">
              <CardHeader>
                <CardTitle id={titleId}>{t(group.labelKey)}</CardTitle>
              </CardHeader>
              <List aria-labelledby={titleId}>
                {sections.map((s) => {
                  const Icon = s.icon;
                  const label = t(s.labelKey);
                  const external = s.externalUrl;
                  return (
                    <ListLinkItem
                      key={s.id}
                      href={external ?? settingsHref(s.id)}
                      target={external ? "_blank" : undefined}
                      rel={external ? "noopener noreferrer" : undefined}
                      prefix={<Icon />}
                      title={
                        external ? (
                          <>
                            {label}
                            <span className="sr-only"> ({tc("newTab")})</span>
                          </>
                        ) : (
                          label
                        )
                      }
                      suffix={<ChevronRight aria-hidden />}
                      onClick={
                        external
                          ? undefined
                          : (e) => {
                              if (!isPlainClick(e)) return;
                              e.preventDefault();
                              onSelect(s.id);
                            }
                      }
                    />
                  );
                })}
              </List>
            </Card>
          );
        })}
      </div>
    </>
  );
}
