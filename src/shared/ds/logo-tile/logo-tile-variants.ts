import type { AvatarHue } from "@/shared/ds/avatar";
import type { InstitutionText } from "@/shared/ds/institution-colors";

/*
 * Groo Logo Tile 의 모양 규칙 — 크기 · 면 · 판의 클래스. 컴포넌트는 logo-tile.tsx 다(컴포넌트 파일은 컴포넌트만 내보낸다).
 * 값의 출처는 groo-design specs/components/logo-tile.yaml(src/shared/ds/spec/logo-tile.json).
 */

export type LogoTileSize = 32 | 40 | 48;
export type LogoTileFace = "institution" | "name";
export type LogoTileImageType = "card" | "logo";

// 크기 — 타일 · 모서리(× 0.3) · 첫 글자(40%) · 카드 그림 폭(크기 − 8). Tailwind 는 소스의 글자 그대로를 읽으므로 크기마다 다 적는다
export const LOGO_TILE_SIZES: Record<
  LogoTileSize,
  { box: string; initial: string; card: number }
> = {
  32: { box: "size-[32px] rounded-r2_5", initial: "text-[13px]", card: 24 },
  40: { box: "size-[40px] rounded-r3", initial: "text-[16px]", card: 32 },
  48: { box: "size-[48px] rounded-r3_5", initial: "text-[19px]", card: 40 },
};

// 이름 색 — Avatar 와 같은 차트 10색(avatarHue)
export const HUE_BG: Record<AvatarHue, string> = {
  blue: "bg-chart-blue",
  green: "bg-chart-green",
  orange: "bg-chart-orange",
  violet: "bg-chart-violet",
  pink: "bg-chart-pink",
  indigo: "bg-chart-indigo",
  red: "bg-chart-red",
  yellow: "bg-chart-yellow",
  brown: "bg-chart-brown",
  gray: "bg-chart-gray",
};

// 기관 색 면의 글자색 — 표의 text
export const INSTITUTION_TEXT: Record<InstitutionText, string> = {
  white: "text-static-white",
  dark: "text-fg-neutral dark:text-fg-neutral-inverted",
};

// 타일 — 판 · 그림을 모서리로 자른다. ::after 가 안쪽 1px 투명 윤곽(면 · 판 · 그림 위, Image Frame 과 같다).
// 두께 · 색은 타일의 변수가 정하고 ::after 의 그림자가 그린다 — 검사기는 그림자를 읽지 못해 그 변수를 잰다
export const ROOT = [
  "relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden align-middle",
  "[--logo-tile-border-width:1px] [--logo-tile-border-color:var(--color-stroke-neutral-overlay)]",
  "after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:[box-shadow:inset_0_0_0_var(--logo-tile-border-width)_var(--logo-tile-border-color)] after:content-['']",
].join(" ");

// 면 + 첫 글자 — 700 · 줄 높이 1(px). 줄 높이는 크기의 글자 뒤에 붙인다 — tailwind-merge 는 뒤에 오는 글자 크기가 줄 높이를 지운다고 본다
export const INITIAL =
  "absolute inset-0 flex items-center justify-center font-sans font-bold uppercase";
export const LINE_HEIGHT_1 = "leading-none";

// 판 — 그림이 다 오기 전에는 보이지 않게(받기는 한다), 오면 첫 글자를 덮는다. 그림은 판 안쪽 4
export const PLATE = "absolute inset-0 flex items-center justify-center p-x1";
export const PLATE_BG: Record<LogoTileImageType, string> = {
  card: "bg-bg-neutral-weak",
  logo: "bg-static-white",
};
export const LOGO_IMAGE = "block size-full object-contain";
