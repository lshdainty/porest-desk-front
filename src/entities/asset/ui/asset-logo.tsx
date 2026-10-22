import { useState, type CSSProperties } from "react";
import { avatarHue, avatarInitial } from "@/shared/ds/avatar";
import { getBrandColor } from "@/shared/lib/groo/bank-colors";
import type { Asset } from "../model/types";

type AssetLogoInput = Pick<Asset, "assetName" | "institution" | "color"> &
  Partial<Pick<Asset, "cardCatalog">>;

/**
 * 자산 식별 타일 — 카드 정식 이미지가 있으면 그 이미지, 없으면 첫 글자 모노그램 + 브랜드색 배경.
 * 자산 목록·관리·상세·생성/수정 미리보기에서 동일하게 사용하는 단일 표현.
 *
 * 카드 이미지는 카탈로그(외부 URL)라 깨질 수 있어, 로드에 실패하면 모노그램으로 되돌린다.
 * 색: 기관 색 표(기관 이름으로만 — 자산 이름 · 저장된 asset.color 로 찾지 않는다) → 없으면 자산 이름의 Avatar 이름 색.
 * 글자색은 기관 색 표의 글자색(밝은 면은 짙은 글자) → 기본 흰색.
 */
export function AssetLogo({
  asset,
  size = 40,
  style,
}: {
  asset: AssetLogoInput;
  size?: number;
  style?: CSSProperties;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const imgUrl = asset.cardCatalog?.imgUrl;

  if (imgUrl && !imgFailed) {
    return (
      <img
        src={imgUrl}
        alt=""
        onError={() => setImgFailed(true)}
        style={{
          width: size,
          height: size,
          borderRadius: "var(--radius-tile)",
          objectFit: "cover",
          flexShrink: 0,
          ...style,
        }}
      />
    );
  }

  // 이름 하나 — 기관 이름(비면 자산 이름). 첫 글자 · 표 찾기 · 이름 색이 모두 이 이름에서 나온다(logo-tile.md).
  // 저장된 색(asset.color)은 읽지 않는다(값은 그대로 둔다). 이름이 비면 글자 없이 회색(logo-tile.yaml initial)
  const name = asset.institution?.trim() || asset.assetName?.trim() || "";
  const label = avatarInitial(name);
  // 기관 색 표는 기관 이름으로만 찾는다 — 기관이 없으면 사용자가 지은 자산 이름은 표를 보지 않는다(logo-tile.md)
  const brand = asset.institution?.trim()
    ? getBrandColor(asset.institution)
    : undefined;
  const bg = brand?.bg ?? `var(--color-chart-${avatarHue(name)})`;
  const fg = brand
    ? (brand.fg ?? "var(--color-static-white)")
    : "var(--color-fg-neutral-inverted)";
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: "var(--radius-tile)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize:
          size <= 32
            ? "var(--text-caption)"
            : size >= 48
              ? "var(--text-body-lg)"
              : "var(--text-body-sm)",
        fontWeight: "800",
        letterSpacing: "-0.022em",
        flexShrink: 0,
        background: bg,
        color: fg,
        ...style,
      }}
    >
      {label}
    </span>
  );
}
