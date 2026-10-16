import { Search } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PageHead } from "@/shared/ui/groo/page-head";

/**
 * 검색 페이지 — 단계적 구현 (TODO: 키워드/카테고리/금액/날짜 통합 검색).
 * 현재는 placeholder. Flutter SearchScreen 미러는 v0.7 에서.
 */
export function SearchPage() {
  const { t } = useTranslation("common");
  const { t: tl } = useTranslation("layout");
  const { mobile } = useOutletContext<{ mobile: boolean }>();
  return (
    <div
      className="m-scroll"
      style={{
        padding: "24px 24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        color: "var(--fg-tertiary)",
      }}
    >
      {!mobile && <PageHead title={tl("search")} />}
      <Search size={32} strokeWidth={1.5} />
      <div style={{ fontSize: "var(--text-body-sm)", fontWeight: "500" }}>
        {t("searchComingSoon")}
      </div>
      <div
        style={{ fontSize: "var(--text-caption)", color: "var(--fg-tertiary)" }}
      >
        {t("searchComingSoonDesc")}
      </div>
    </div>
  );
}
