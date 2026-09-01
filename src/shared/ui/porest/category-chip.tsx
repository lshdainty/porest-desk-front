import { getPaletteByColor } from "@/shared/lib/porest/chart-palette";
import { tileRadius } from "@/shared/lib";
import { Icon } from "./primitives";

/**
 * 카테고리 타일 — 색/아이콘 **문자열**만 받는다(거래를 모른다).
 * 지출 행·이체 행·상세·더치페이·반복거래가 같은 모양을 써야 해서 공용으로 둔다.
 */
export function CategoryChip({
  color,
  icon,
  size = "md",
}: {
  name?: string;
  color?: string | null;
  icon?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const dim = size === "sm" ? 32 : size === "lg" ? 48 : 40;
  const iconSize = size === "sm" ? 16 : size === "lg" ? 22 : 18;
  // hex / oklch / var 문자열을 모두 인식해 tint + 아이콘 색 조합 생성
  const palette = getPaletteByColor(color);
  return (
    <span
      style={{
        width: dim,
        height: dim,
        borderRadius: tileRadius(dim),
        background: palette.bg,
        color: palette.color,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Icon name={icon || "tag"} size={iconSize} strokeWidth={1.9} />
    </span>
  );
}
