import { useTranslation } from "react-i18next";
import { useTheme } from "@/shared/ui/theme-context";
import { ManagerHead, ManagerShell } from "@/shared/ui/groo/manager-layout";
import { PageHead } from "@/shared/ui/groo/page-head";
import {
  NEEDS_DESKTOP_HEAD,
  SECTIONS,
  type SectionDef,
  type SectionId,
} from "../model/sections";

interface Props {
  section: SectionId | "menu";
  activeSection: SectionDef | null;
  openSection: (s: SectionDef) => void;
  renderBody: (mobile: boolean) => React.ReactNode;
}

/** 데스크톱 · 태블릿 틀 — 맨 위 PageHead + 왼쪽 목록 + 본문 */
export const SettingsDesktopFrame = ({
  section,
  activeSection,
  openSection,
  renderBody,
}: Props) => {
  const { t } = useTranslation("settings");
  const { resolvedTheme } = useTheme();
  return (
    <div style={{ padding: 0 }}>
      <PageHead
        title={t("page.title")}
        description={t("page.subtitle")}
        style={{ padding: "20px 32px 0", margin: 0, maxWidth: 1320 }}
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "220px 1fr",
          gap: 24,
          padding: "20px 32px",
          maxWidth: 1320,
          alignItems: "start",
        }}
      >
        <aside
          style={{
            position: "sticky",
            top: 0,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            padding: 8,
            background: "var(--bg-surface)",
            boxShadow: "var(--shadow-sm)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          {SECTIONS.filter((s) => !s.hidden).map((s) => {
            const IconComp = s.icon;
            // 목록에 없는 숨은 칸(기기 …)에서는 부모 칸("계정")이 켜진다(I-12 35)
            const active = section === s.id || activeSection?.parent === s.id;
            // inactive 는 회색(fg-secondary) 그대로 유지. 선택 탭만 다크에서 brand light variant 로.
            // DESIGN.desk.md: 어두운 표면 위 브랜드 텍스트·아이콘 = primary-light(#5fa0e5) — spec 정합.
            const dark = resolvedTheme === "dark";
            const navColor = active
              ? dark
                ? "var(--color-fg-brand)"
                : "var(--fg-brand-strong)"
              : "var(--fg-secondary)";
            return (
              <button
                key={s.id}
                aria-current={active ? "page" : undefined}
                onClick={() => openSection(s)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 12px",
                  border: 0,
                  // 설정 nav 한정: 다크에선 배경 틴트도 primary-light(#5fa0e5) 15% mix — 텍스트와 같은 light 톤.
                  // (라이트는 글로벌 bg-brand-subtle = primary 8% 유지.)
                  background: active
                    ? dark
                      ? "var(--color-bg-brand-weak)"
                      : "var(--bg-brand-subtle)"
                    : "transparent",
                  color: navColor,
                  borderRadius: "var(--radius-md)",
                  fontSize: "var(--text-label-sm)",
                  fontWeight: active ? 600 : 500,
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: "inherit",
                }}
              >
                <IconComp size={16} strokeWidth={1.9} />
                <span>{t(s.labelKey)}</span>
              </button>
            );
          })}
        </aside>
        <div style={{ minWidth: 0 }}>
          {activeSection && NEEDS_DESKTOP_HEAD.includes(activeSection.id) ? (
            <ManagerShell>
              <ManagerHead
                title={t(activeSection.labelKey)}
                description={t(activeSection.descKey)}
              />
              {renderBody(false)}
            </ManagerShell>
          ) : (
            renderBody(false)
          )}
        </div>
      </div>
    </div>
  );
};
