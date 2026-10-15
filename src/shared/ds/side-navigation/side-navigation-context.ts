import * as React from "react";

import { FOG_DEPTH, STORAGE_KEY, WIDE_QUERY } from "./side-navigation-variants";

/*
 * Side Navigation 의 문맥 · 훅 · 도우미 — 컴포넌트 파일은 컴포넌트만 내보낸다(빠른 새로 고침).
 */

// ── 폭 · 기억 ────────────────────────────────────────────────
export function readStored(): boolean | null {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === "true" ? true : v === "false" ? false : null;
  } catch {
    return null;
  }
}
export function writeStored(collapsed: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(collapsed));
  } catch {
    // 저장소를 쓰지 못하는 브라우저 — 기억 없이 쓴다
  }
}

/** 창 폭의 기본 — 1280 이상은 기억(손으로 접어 뒀으면 접힘), 미만은 접힘 */
export const widthDefault = (wide: boolean) =>
  wide ? readStored() === true : true;

export const isWideNow = () => window.matchMedia(WIDE_QUERY).matches;

export function useMedia(query: string, server: boolean) {
  return React.useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => server,
  );
}

export const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function mergeRefs<T>(...refs: (React.Ref<T> | undefined)[]) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as React.MutableRefObject<T | null>).current = node;
    }
  };
}

/** 누르는 순간 기준 길이 max(높이, 폭 ÷ 4, 24) 를 --press-basis 로(Button · List 와 같은 식) — 콘텐츠 층이 물려받는다 */
export function measurePress(el: HTMLElement) {
  el.style.setProperty(
    "--press-basis",
    String(Math.max(el.offsetHeight, el.offsetWidth / 4, 24)),
  );
}
export const isPressKey = (e: React.KeyboardEvent) =>
  e.key === " " || e.key === "Enter";
/** 새 탭 · 새 창으로 여는 누르기 — 이동이 아니다 */
export const isModifiedClick = (e: React.MouseEvent) =>
  e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;

// ── 문맥 ─────────────────────────────────────────────────────
export type RootContextValue = {
  /** 접힘(목표) — 항목의 자리 · 펼침 메뉴 */
  collapsed: boolean;
  /** 이름을 보이지 않게(sr-only) — 접히기 시작할 때부터 다 펴질 때까지 */
  labelsHidden: boolean;
  toggle: () => void;
  navId: string;
  /** 펼침 메뉴를 그릴 자리 — 사이드바(nav) 자신 */
  portal: HTMLElement | null;
  /** 지금 열린 펼침 메뉴 — 한 번에 하나 */
  activeFlyout: string | null;
  setActiveFlyout: (id: string | null) => void;
};
export const RootContext = React.createContext<RootContextValue | null>(null);

export function useRoot(name: string) {
  const ctx = React.useContext(RootContext);
  if (!ctx) throw new Error(`${name} 는 SideNavigation 안에 둔다.`);
  return ctx;
}

export type ContentContextValue = { onNavigate?: () => void };
export const ContentContext = React.createContext<ContentContextValue>({});

// 하위 항목이 어디에 그려지는가 — 부모 아래 목록(펼침 · 서랍) · 펼침 메뉴(접힘)
export type SubPlacement =
  { kind: "list" } | { kind: "flyout"; close: () => void };
export const SubPlacementContext = React.createContext<SubPlacement>({
  kind: "list",
});

// ── 내용 아래 끝 흐림 ────────────────────────────────────────
// gradient-fade-mask(방향 없는 위 → 아래 토큰)를 아래에서 위로 붙여 내용 상자에 건다(사이드바의 제 안개)
export function useBottomFog(
  ref: React.RefObject<HTMLElement | null>,
  enabled: boolean,
) {
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    const token = getComputedStyle(el)
      .getPropertyValue("--gradient-fade-mask")
      .trim();
    if (!/^linear-gradient\(\s*(#|rgb|hsl|transparent)/i.test(token)) return;
    const mask = {
      image: `linear-gradient(#000, #000), ${token.replace(/^linear-gradient\(/, "linear-gradient(to top, ")}`,
      size: `100% calc(100% - ${FOG_DEPTH}), 100% ${FOG_DEPTH}`,
      position: "0 0, 0 100%",
      repeat: "no-repeat",
    };
    for (const [p, v] of Object.entries(mask)) {
      el.style.setProperty(`mask-${p}`, v);
      el.style.setProperty(`-webkit-mask-${p}`, v);
    }
    return () => {
      for (const p of Object.keys(mask)) {
        el.style.removeProperty(`mask-${p}`);
        el.style.removeProperty(`-webkit-mask-${p}`);
      }
    };
  }, [ref, enabled]);
}
