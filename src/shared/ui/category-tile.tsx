import * as React from "react"

import { renderIcon } from "@/shared/lib"

/**
 * 카테고리 타일 — `FilterDialog`/`AddTxSheet`/`PresetEditDialog`/`BudgetEditDialog`
 * 등에서 5×N 그리드의 한 칸으로 쓰는 공통 카드.
 *
 * - radius `var(--radius-tile)` (=12px, = --radius-lg) — 양쪽 (카드/내부 아이콘 박스) 동일.
 * - active 시: 브랜드 subtle 배경 + 브랜드 보더 + 라벨 강조.
 * - 색은 카테고리 정의 색을 oklch alpha 로 soft-bg 처리.
 */
export interface CategoryTileProps {
  name: string
  /** 카테고리 정의 색 (`oklch(...)` 또는 hex). 없으면 brand. */
  color?: string
  /** lucide icon 이름 또는 fallback 한 글자. */
  icon?: string | null
  active: boolean
  onClick: () => void
}

export function CategoryTile({
  name,
  color = "var(--bg-brand)",
  icon,
  active,
  onClick,
}: CategoryTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        padding: "10px 4px",
        background: active ? "var(--bg-brand-subtle)" : "transparent",
        border: active
          ? "1px solid var(--border-brand)"
          : "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-tile)",
        cursor: "pointer",
        fontFamily: "inherit",
      }}
    >
      <span
        style={{
          width: 32,
          height: 32,
          borderRadius: "var(--radius-tile)",
          // 18% color-mix — 다크모드에서도 자연스럽게 채도 유지.
          background: `color-mix(in oklch, ${color} 18%, transparent)`,
          color,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {renderIcon(icon, name.charAt(0), 18)}
      </span>
      <span
        style={{
          fontSize: 'var(--text-badge)',
          fontWeight: active ? 700 : 500,
          color: active ? "var(--fg-brand-strong)" : "var(--fg-secondary)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          maxWidth: "100%",
        }}
      >
        {name}
      </span>
    </button>
  )
}

/** 5×N 카테고리 그리드 컨테이너 — 자식으로 `<CategoryTile>` 넘김. */
export function CategoryGrid({
  children,
  columns = 5,
  gap = 6,
}: {
  children: React.ReactNode
  columns?: number
  gap?: number
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap,
      }}
    >
      {children}
    </div>
  )
}
