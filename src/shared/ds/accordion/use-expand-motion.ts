import * as React from "react";

/*
 * 펼치고 접는 모션 — groo-design recipes/shadcn/components/ui/accordion.tsx 의 useExpandMotion.
 * Accordion · Collapsible · List 의 하위 줄(ListParentItem)이 모두 이 훅 하나를 쓴다("Accordion 과 같다", list.yaml motion).
 * Tree View 는 HR 전용이라 이 레포에 없다.
 *
 * 높이 300ms motion-ease-easing(motion-duration-d6), 모션 줄이기면 높이를 움직이지 않고 150ms(d3) 서서히 나타나고 사라진다.
 * 접힌 뒤에는 hidden 이다(그리지 않는다 · 보조 기술도 읽지 않는다). 안의 자식은 그대로 두어 칸의 값 · aria-controls 가 이어진다.
 * 움직이는 도중에 다시 누르면 지금 높이 · 투명도에서 되돌아간다. 처음 그릴 때는 움직이지 않는다.
 * ref 는 펼치고 접는 요소(바깥 감싸개 — 여백은 안쪽 요소에)에 단다.
 */
const useIsoLayoutEffect =
  typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

// 토큰의 시간 — "300ms" · "0.3s" 를 ms 로. 읽지 못하면 기본값
function tokenMs(style: CSSStyleDeclaration, name: string, fallback: number) {
  const raw = style.getPropertyValue(name).trim();
  const n = parseFloat(raw);
  if (!Number.isFinite(n)) return fallback;
  return raw.endsWith("ms") ? n : raw.endsWith("s") ? n * 1000 : n;
}

const reducedMotion = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function useExpandMotion<T extends HTMLElement = HTMLDivElement>(
  open: boolean,
) {
  const ref = React.useRef<T>(null);
  const [present, setPresent] = React.useState(open);
  // 펼치면 바로 그린다 — 움직임은 그린 뒤(레이아웃 효과)에 시작한다
  if (open && !present) setPresent(true);
  const prevOpen = React.useRef(open);
  const running = React.useRef<Animation | null>(null);
  const generation = React.useRef(0);

  useIsoLayoutEffect(() => {
    if (prevOpen.current === open) return;
    prevOpen.current = open;
    const el = ref.current;
    if (!el) return;
    const token = ++generation.current;
    const previous = running.current;
    // 움직이는 중이면 지금 모습에서 이어 간다 — 멈추기 전에 읽는다
    const fromHeight = el.getBoundingClientRect().height;
    const fromOpacity = Number(getComputedStyle(el).opacity);
    previous?.cancel();
    running.current = null;
    el.style.removeProperty("overflow");
    // 접힌 뒤 바로 다시 펼친 경우 — 아래 onfinish 가 단 hidden 을 걷는다(React 가 아직 그리지 않았을 수 있다)
    if (open) el.hidden = false;
    if (typeof el.animate !== "function") {
      if (!open) setPresent(false);
      return;
    }
    const style = getComputedStyle(el);
    const easing =
      style.getPropertyValue("--motion-ease-easing").trim() || "ease";
    let animation: Animation;
    if (reducedMotion()) {
      const start = previous ? fromOpacity : open ? 0 : 1;
      animation = el.animate([{ opacity: start }, { opacity: open ? 1 : 0 }], {
        duration: tokenMs(style, "--motion-duration-d3", 150),
        easing,
      });
    } else {
      // 펼칠 때는 내용 전체 높이까지, 접을 때는 0 까지. 움직이는 동안만 넘친 것을 자른다
      const start = previous ? fromHeight : open ? 0 : fromHeight;
      const end = open ? el.scrollHeight : 0;
      el.style.overflow = "hidden";
      animation = el.animate(
        [{ height: `${start}px` }, { height: `${end}px` }],
        {
          duration: tokenMs(style, "--motion-duration-d6", 300),
          easing,
        },
      );
    }
    running.current = animation;
    animation.onfinish = () => {
      if (generation.current !== token) return;
      running.current = null;
      el.style.removeProperty("overflow");
      if (open) return;
      // 접힘이 끝난 그 화면에서 바로 숨긴다 — React 가 다시 그릴 때까지 다 펼친 높이가 한 번 비치지 않게
      el.hidden = true;
      setPresent(false);
    };
  }, [open]);

  React.useEffect(
    () => () => {
      running.current?.cancel();
    },
    [],
  );

  return { ref, hidden: !present };
}
