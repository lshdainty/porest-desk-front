import { ScreenBands } from "@/shared/ui/groo/screen-bands";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Input } from "@/shared/ui/input";
import { Search, SearchX } from "lucide-react";
import { useMoreGroups } from "../model/use-more-groups";

/** 폰 전체 메뉴 — 검색칸 · 묶음마다 화면 폭 흰 띠(I-01 결정 4B), 그룹 라벨 + 2열 텍스트 링크 */
export const MoreMobile = () => {
  const navigate = useNavigate();
  const { t } = useTranslation("more");
  const [query, setQuery] = useState("");
  const filtered = useMoreGroups(query);

  return (
    <ScreenBands list>
      {/* 검색바 */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 5,
          background: "var(--bg-surface)",
          // 폰은 띠 안 — 앱 검색 띠와 같이 위 8 · 아래 12
          padding: "var(--spacing-x2) var(--spacing-x6) var(--spacing-x3)",
        }}
      >
        {/* 아이콘 세로 중앙 기준은 input 높이 — sticky wrapper의 paddingBottom에 안 끌리도록 분리 */}
        <div className="relative">
          <Search
            size={16}
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--fg-tertiary)",
              pointerEvents: "none",
            }}
          />
          <Input
            search
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("search")}
            className="w-full pl-9"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div
          style={{
            padding: "60px 0",
            textAlign: "center",
            color: "var(--fg-tertiary)",
          }}
        >
          <SearchX size={28} style={{ display: "inline-block" }} />
          <div
            style={{
              fontSize: "var(--text-label-sm)",
              fontWeight: 600,
              marginTop: 8,
            }}
          >
            {t("noResults")}
          </div>
        </div>
      ) : (
        filtered.map((group) => (
          <div key={group.labelKey}>
            <div
              style={{
                fontSize: "var(--text-body-lg)",
                fontWeight: 700,
                color: "var(--fg-primary)",
                letterSpacing: "-0.01em",
                padding: "10px 0 2px",
              }}
            >
              {t(group.labelKey)}
            </div>
            {/* K뱅크 스타일 — 카드 없이 2열 텍스트 링크 */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                padding: "6px 0 4px",
                columnGap: 16,
              }}
            >
              {group.items.map((item) => (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => navigate(item.path)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "13px 0",
                    background: "transparent",
                    border: 0,
                    cursor: "pointer",
                    textAlign: "left",
                    fontSize: "var(--text-body-md)",
                    fontWeight: 500,
                    letterSpacing: "-0.01em",
                    color: "var(--fg-primary)",
                    fontFamily: "inherit",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
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
                  {t(item.labelKey)}
                </button>
              ))}
            </div>
          </div>
        ))
      )}
    </ScreenBands>
  );
};
