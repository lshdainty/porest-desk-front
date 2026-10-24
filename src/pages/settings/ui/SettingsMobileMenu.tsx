import { useTranslation } from "react-i18next";
import { ChevronRight } from "lucide-react";
import { ScreenBands } from "@/shared/ui/groo/screen-bands";
import { MobileBackHeader } from "@/shared/ui/groo/mobile-back-header";
import { useCurrentUser } from "@/features/user";
import {
  MENU_GROUPS,
  SECTIONS,
  type SectionDef,
  type SectionId,
} from "../model/sections";

// ─── 모바일 메뉴 뷰 ────────────────────────────────────────────
export function SettingsMobileMenu({
  changeSection,
  openSection,
}: {
  changeSection: (id: SectionId | "menu") => void;
  /** 메뉴 항목 클릭 — 외부 링크 항목은 새 탭으로 열린다 */
  openSection: (s: SectionDef) => void;
}) {
  const { t } = useTranslation("settings");
  const { data: user } = useCurrentUser();

  return (
    <>
      {/* 풀스크린 페이지 — 앱처럼 ← 설정 헤더, 뒤로가면 '전체' */}
      <MobileBackHeader title={t("page.title")} />
      <ScreenBands list>
        {/* 내 정보 — 이름 헤더 행 하나가 첫 띠(design MobileSettingsList). 버튼의 인라인 바탕 · 여백이 띠 규칙을 덮지 않게 한 겹 감싼다 */}
        <div>
          <button
            onClick={() => changeSection("account")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              width: "100%",
              padding: "10px 0",
              background: "transparent",
              border: 0,
              cursor: "pointer",
              textAlign: "left",
              fontFamily: "inherit",
            }}
          >
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: "50%",
                background: "var(--bg-brand)",
                color: "var(--fg-on-brand)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 17,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {user?.userName ? user.userName.charAt(0) : "?"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 17,
                  fontWeight: 800,
                  color: "var(--fg-primary)",
                  letterSpacing: "-0.015em",
                }}
              >
                {user?.userName ?? t("account.defaultName")}
              </div>
              <div
                style={{
                  fontSize: "var(--text-label-sm)",
                  color: "var(--fg-tertiary)",
                  marginTop: 2,
                }}
              >
                {t("account.profileMeta")}
              </div>
            </div>
            <ChevronRight
              size={18}
              style={{ color: "var(--fg-tertiary)", flexShrink: 0 }}
            />
          </button>
        </div>

        {/* 그룹 — 묶음마다 화면 폭 흰 띠(I-01 결정 4B), 라벨 + 텍스트 행(터치 dim) */}
        {MENU_GROUPS.map((group) => {
          const groupSections = group.sectionIds
            .map((id) => SECTIONS.find((s) => s.id === id))
            .filter((s): s is SectionDef => s !== undefined);

          return (
            <div key={group.labelKey}>
              <div
                style={{
                  fontSize: "var(--text-body-lg)",
                  fontWeight: 700,
                  color: "var(--fg-primary)",
                  letterSpacing: "-0.01em",
                  padding: "10px 0 4px",
                }}
              >
                {t(group.labelKey)}
              </div>
              <div>
                {groupSections.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => openSection(s)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "13px 0",
                      background: "transparent",
                      border: 0,
                      cursor: "pointer",
                      textAlign: "left",
                      fontFamily: "inherit",
                    }}
                    onTouchStart={(e) => {
                      e.currentTarget.style.opacity = "0.55";
                    }}
                    onTouchEnd={(e) => {
                      e.currentTarget.style.opacity = "1";
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = "0.7";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = "1";
                    }}
                  >
                    <span
                      style={{
                        flex: 1,
                        fontSize: "var(--text-body-md)",
                        fontWeight: 500,
                        color: "var(--fg-primary)",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {t(s.labelKey)}
                    </span>
                    <ChevronRight
                      size={15}
                      style={{ color: "var(--fg-tertiary)", flexShrink: 0 }}
                    />
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </ScreenBands>
    </>
  );
}
