import * as React from "react";

/*
 * Groo Scroll Fog — 흐림을 거는 훅. 수치 원본은 groo-design specs/components/scroll-fog.yaml
 * (값은 src/shared/ds/spec/scroll-fog.json). 컴포넌트는 scroll-fog.tsx 다(컴포넌트 파일은 컴포넌트만 내보낸다 — 빠른 새로 고침).
 *
 *   useScrollFog  다른 부품의 스크롤 상자에 같은 흐림을 건다 — Dialog · Bottom Sheet · Popover 본문(scrollFog), Chip 의 가로 줄,
 *                 Chip Tabs 목록. 여백 · 스크롤 여유는 그 부품이 둔다
 *
 * 마스크 — gradient-fade-mask(알파 0 → 1, 16단계, v104)를 흐린 쪽마다 상자 전체 크기의 층 하나로 깔고 겹친 층을 곱한다
 *   (mask-composite: intersect — scroll-fog.yaml fog.mask · SEED Scroll Fog 와 같다). 토큰은 방향이 없는(위 → 아래) 그라디언트라 쪽마다
 *   방향(to bottom · to top · to right · to left)을 붙이고, 퍼센트 단계를 그 쪽 깊이의 몫(calc(깊이 × 비율))으로 바꿔 깊이 안에서
 *   불투명에 닿게 한다 — 가운데는 두 층 모두 불투명이라 그대로 보인다. CSS 변수 하나에는 방향을 붙일 수 없어 처음 그릴 때(레이아웃 효과)
 *   토큰 값을 읽어 이 상자의 mask-* 로 넣는다. 층이 상자 전체 크기라 상자 크기가 바뀌어도 다시 재지 않는다. 토큰이 없으면 흐리지 않는다
 *   (개발 중에 알린다). 2026-10-08 까지는 처음 · 끝 흐림과 가운데 불투명 층을 겹치지 않게 이어 붙였다 — 상자가 두 깊이의 합보다 낮으면
 *   두 흐림이 겹친 자리에서 더해져(add) 덜 흐렸고, YAML 설명과도 달랐다.
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
// 꽉 찬 층 — 흐리지 않는 쪽(깊이 0). 곱해도 아무것도 가리지 않는다
const SOLID = "linear-gradient(#000, #000)";

// 한 축의 마스크 — 흐린 쪽마다 상자 전체 크기의 층 하나(시작 쪽은 투명 → 불투명, 끝 쪽은 반대 방향). 단계는 그 쪽 깊이의 몫이라
// 깊이 안에서 불투명에 닿는다. 두 층은 COMPOSITE 로 곱한다
function fogMask(token: string, axis: FogAxis, start: string, end: string) {
  const from = axis === "y" ? "to bottom" : "to right";
  const to = axis === "y" ? "to top" : "to left";
  const layers = [start, end].map((depth, i) =>
    parseFloat(depth) > 0
      ? withDirection(
          token.replace(
            /(\d+(?:\.\d+)?)%/g,
            (_m, p) => `calc(${depth} * ${Number(p) / 100})`,
          ),
          i === 0 ? from : to,
        )
      : SOLID,
  );
  return {
    image: layers.join(", "),
    size: "100% 100%, 100% 100%",
    position: "0 0, 0 0",
  };
}

const MASK_PROPERTIES = ["image", "size", "position", "repeat"] as const;
// 겹친 층을 곱한다 — 두 층을 모두 지나야 보인다. -webkit-mask-composite 는 옛 이름만 받는다(source-in 이 intersect 와 같은 셈)
const COMPOSITE = {
  "mask-composite": "intersect",
  "-webkit-mask-composite": "source-in",
} as const;

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
    for (const [p, v] of Object.entries(COMPOSITE)) el.style.setProperty(p, v);
    return () => {
      el.removeAttribute("data-fog-axis");
      for (const p of MASK_PROPERTIES) {
        el.style.removeProperty(`mask-${p}`);
        el.style.removeProperty(`-webkit-mask-${p}`);
      }
      for (const p of Object.keys(COMPOSITE)) el.style.removeProperty(p);
    };
  }, [ref, use, rerunKey]);
}
