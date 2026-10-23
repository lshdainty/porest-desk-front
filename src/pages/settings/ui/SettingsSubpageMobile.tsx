import { useTranslation } from "react-i18next";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/shared/ui/button";
import type { SectionDef, SectionId } from "../model/sections";

interface Props {
  section: SectionId | "menu";
  activeSection: SectionDef | null;
  changeSection: (next: SectionId | "menu") => void;
  catReorder: boolean;
  setCatReorder: (fn: (v: boolean) => boolean) => void;
  body: React.ReactNode;
}

/** 폰 하위 화면 껍데기 — 고정 덮개 + 손 머리 + 본문 상자 */
export const SettingsSubpageMobile = ({
  activeSection,
  changeSection,
  section,
  catReorder,
  setCatReorder,
  body,
}: Props) => {
  const { t } = useTranslation("settings");
  const { t: tCat } = useTranslation("category");
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: "var(--z-modal)",
        // 카드 다이어트 — 서브페이지도 surface 배경 위 플랫 콘텐츠 (design .m-subpage).
        background: "var(--bg-surface)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: "12px 8px",
          background: "var(--bg-surface)",
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          aria-label={t("common:back")}
          onClick={() => changeSection(activeSection?.parent ?? "menu")}
          style={{
            border: 0,
            background: "transparent",
            padding: 6,
            display: "inline-flex",
            cursor: "pointer",
            color: "var(--fg-primary)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <ChevronLeft size={22} />
        </button>
        <h2
          style={{
            flex: 1,
            margin: 0,
            fontSize: "var(--text-title-md)",
            fontWeight: "600",
            letterSpacing: "-0.012em",
          }}
        >
          {activeSection ? t(activeSection.labelKey) : ""}
        </h2>
        {/* 카테고리 순서 편집 토글 — 디자인 m-subhead__action-btn ('편집'↔'완료') */}
        {section === "categories" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCatReorder((v) => !v)}
            // 편집 글씨 흰색(fg-primary) — 앱 PButton ghost(fgPrimary) 정합. brand(파랑) 아님.
            style={{
              color: "var(--fg-primary)",
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {catReorder ? tCat("reorderDone") : tCat("reorderEdit")}
          </Button>
        )}
      </div>
      {/* 모바일 섹션 본문 스크롤 — scrollbar 숨김(스크롤 기능 유지). 데스크톱/태블릿은 별도 분기라 무관. */}
      {/* 앱 설정 계열 화면(ListView x20/x24) 정합 — 상하 24 / 좌우 20 */}
      <div
        className="scrollbar-hide"
        style={{
          padding: "var(--spacing-xl)",
          flex: 1,
          overflowY: "auto",
          minHeight: 0,
        }}
      >
        {body}
      </div>
    </div>
  );
};
