import { Moon, Sparkle, Sparkles, Star, type LucideIcon } from "lucide-react";

/**
 * 하늘 바탕 그라디언트(01-033 C) — 고정 남색이 아니라 역할 색이다. 라이트에서 짙은 하늘, 다크에서는 밝은 하늘(사용자가 대가로 받아들인 모습).
 * 위 왼쪽 `bg-neutral-inverted` → 아래 오른쪽 `-pressed`, 가운데는 두 색의 중간(앱 `skyGradient(three: true)` 와 같다).
 * 하늘 위 글 · 아이콘은 `text-fg-neutral-inverted` 하나다 — 불투명도로 흐리지 않는다(장식 점 · 선 · 달빛만 투명도를 쓴다).
 */
export const SKY_BG =
  "bg-[linear-gradient(160deg,var(--color-bg-neutral-inverted)_0%,color-mix(in_srgb,var(--color-bg-neutral-inverted),var(--color-bg-neutral-inverted-pressed))_55%,var(--color-bg-neutral-inverted-pressed)_100%)]";

/** 오늘 진행 단계 아이콘 — 별빛 0 달 · 1 반짝 · 3 반짝이 · 5 별. */
const STAGES: { min: number; Icon: LucideIcon }[] = [
  { min: 0, Icon: Moon },
  { min: 1, Icon: Sparkle },
  { min: 3, Icon: Sparkles },
  { min: 5, Icon: Star },
];

export function stageIconOf(points: number): LucideIcon {
  let icon: LucideIcon = Moon;
  for (const stage of STAGES) if (points >= stage.min) icon = stage.Icon;
  return icon;
}
