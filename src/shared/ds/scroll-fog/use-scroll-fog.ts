import * as React from "react";

/*
 * Porest Scroll Fog — 흐림을 거는 훅. 수치 원본은 porest-design specs/components/scroll-fog.yaml
 * (값은 src/shared/ds/spec/scroll-fog.json). 컴포넌트는 scroll-fog.tsx 다(컴포넌트 파일은 컴포넌트만 내보낸다 — 빠른 새로 고침).
 *
 *   useScrollFog  다른 부품의 스크롤 상자에 같은 흐림을 건다 — Dialog · Bottom Sheet · Popover 본문(scrollFog), Chip 의 가로 줄,
 *                 Chip Tabs 목록. 여백 · 스크롤 여유는 그 부품이 둔다
 *
 * 마스크 — gradient-fade-mask(알파 0 → 1, 16단계, v104)를 흐린 쪽마다 깊이만큼의 층에 둔다. 토큰은 방향이 없는(위 → 아래)
 *   그라디언트라 쪽마다 방향(to bottom · to top · to right · to left)을 붙여 쓰고, 두 흐림 사이는 불투명한 층으로 채운다 — CSS 변수
 *   하나에는 방향을 붙일 수 없어 처음 그릴 때(레이아웃 효과) 토큰 값을 읽어 이 상자의 mask-* 로 넣는다. 층의 크기는 상자에 대한
 *   비율이라 상자 크기가 바뀌어도 다시 재지 않는다. 토큰이 없으면 흐리지 않는다(개발 중에 알린다).
 */

export type ScrollFogUse = "box" | "row" | "overlayBody" | "page";
type FogAxis = "x" | "y";

// 흐림 깊이(scroll-fog.yaml) — 시작 쪽(위 · 왼쪽) · 끝 쪽(아래 · 오른쪽)
const DEPTH: Record<ScrollFogUse, { start: string; end: string }> = {
  box: { start: "20px", end: "20px" },
  row: { start: "20px", end: "20px" },
  overlayBody: { start: "20px", end: "80px" },
  page: { start: "20px", end: "80px" },
};

// 방향 없이 적힌(위 → 아래) 그라디언트 토큰에 방향을 붙인다
const withDirection = (token: string, direction: string) =>
  token.replace(/^linear-gradient\(/, `linear-gradient(${direction}, `);
// 불투명한 층 — 두 흐림 사이
const SOLID = "linear-gradient(#000, #000)";

// 한 축의 마스크 — 시작 쪽 흐림(투명 → 불투명) · 가운데 불투명 · 끝 쪽 흐림(불투명 → 투명). 층은 겹치지 않는다
function fogMask(token: string, axis: FogAxis, start: string, end: string) {
  if (axis === "y") {
    return {
      image: `${withDirection(token, "to bottom")}, ${SOLID}, ${withDirection(token, "to top")}`,
      size: `100% ${start}, 100% calc(100% - ${start} - ${end}), 100% ${end}`,
      position: `0 0, 0 ${start}, 0 100%`,
    };
  }
  return {
    image: `${withDirection(token, "to right")}, ${SOLID}, ${withDirection(token, "to left")}`,
    size: `${start} 100%, calc(100% - ${start} - ${end}) 100%, ${end} 100%`,
    position: `0 0, ${start} 0, 100% 0`,
  };
}

const MASK_PROPERTIES = ["image", "size", "position", "repeat"] as const;

// box 의 축 — 가로로만 스크롤하는 상자(overflow-x auto · scroll, overflow-y 는 아님)면 좌우, 아니면 위아래
function axisOf(el: HTMLElement, use: ScrollFogUse): FogAxis {
  if (use === "row") return "x";
  if (use !== "box") return "y";
  const style = getComputedStyle(el);
  const scrolls = (v: string) => v === "auto" || v === "scroll";
  return scrolls(style.overflowX) && !scrolls(style.overflowY) ? "x" : "y";
}

const useIsoLayoutEffect =
  typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;
let warnedNoToken = false;

// 스크롤 상자에 흐림을 건다(use 가 null 이면 걸지 않는다). 축은 상자에 data-fog-axis 로 남긴다 — 여백 · 스크롤 여유가 따른다.
// rerunKey 가 바뀌면(상자의 overflow 를 바꾸는 className 등) 축을 다시 정한다
export function useScrollFog(
  ref: React.RefObject<HTMLElement | null>,
  use: ScrollFogUse | null,
  rerunKey?: unknown,
) {
  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el || !use) return;
    const token = getComputedStyle(el)
      .getPropertyValue("--gradient-fade-mask")
      .trim();
    // 방향 없이 색부터 시작하는 linear-gradient 여야 방향을 붙일 수 있다
    if (!/^linear-gradient\(\s*(#|rgb|hsl|transparent)/i.test(token)) {
      if (import.meta.env.DEV && !warnedNoToken) {
        warnedNoToken = true;
        console.warn(
          "[ScrollFog] 토큰 --gradient-fade-mask 를 읽지 못해 흐리지 않는다 — tokens.css 를 불러왔는지 본다.",
          el,
        );
      }
      return;
    }
    const axis = axisOf(el, use);
    const { start, end } = DEPTH[use];
    const mask = { ...fogMask(token, axis, start, end), repeat: "no-repeat" };
    el.setAttribute("data-fog-axis", axis);
    for (const p of MASK_PROPERTIES) {
      el.style.setProperty(`mask-${p}`, mask[p]);
      el.style.setProperty(`-webkit-mask-${p}`, mask[p]);
    }
    return () => {
      el.removeAttribute("data-fog-axis");
      for (const p of MASK_PROPERTIES) {
        el.style.removeProperty(`mask-${p}`);
        el.style.removeProperty(`-webkit-mask-${p}`);
      }
    };
  }, [ref, use, rerunKey]);
}
