import * as React from "react";

import { Specimen } from "@/shared/ds/catalog/DemoKit";

/*
 * 카탈로그 전용 — 겹침 표면(Alert Dialog · Bottom Sheet · Dialog)을 폰 · 창 크기의 무대 안에 연다.
 *
 * 표면은 화면(viewport)에 붙는(position: fixed) 모달이라 카탈로그에 그대로 두면 한 장만 열려 나머지를 가린다. 무대에 transform 을 걸면
 * fixed 의 기준이 화면이 아니라 무대가 되어 표면이 무대 안에 선다. 표면의 container 를 무대로 주고(다크 판의 색도 이 덕에 받는다),
 * modal={false} 로 초점 가둠 · 바깥 비활성 · 뒤 화면 숨김 · 스크롤 잠금을 끈다 — 여러 장을 한 화면에 동시에 열어 쟀다.
 *
 * 검사기(scripts/check-ds-spec.mjs)는 견본의 첫 요소를 올리고 · 누르고 · 초점을 준다. 그래서 첫 요소(root)를
 *   - 보통은 무대 전체로 두고(초점은 focusTarget 으로 넘긴다),
 *   - pressTarget 이 있으면(닫기 버튼 누름) 그 요소의 가운데에 놓인 작은 상자로 둔다. 무대는 그 상자 안에서 반대로 당겨 놓아 눈에는
 *     같은 자리로 보인다. 누르는 자리는 표면이 다 열린 뒤(모션이 끝난 뒤)의 요소 위치를 재서 맞춘다.
 */

export interface OverlayStageProps {
  spec: string;
  combo: Record<string, string>;
  state?: string;
  width: number;
  height: number;
  /** 누름 · 올림 상태에서 누를 요소(무대 안 선택자) — 닫기 버튼 */
  pressTarget?: string;
  /** 키보드 초점 상태에서 초점을 받을 요소(무대 안 선택자) */
  focusTarget?: string;
  /** 무대 안에서 한 번 할 일 — 본문을 스크롤해 두기 같은 것 */
  prepare?: (stage: HTMLElement) => void;
  /** 표면을 그린다 — container 로 무대를 준다 */
  children: (container: HTMLElement) => React.ReactNode;
}

const CLEAR = { width: 0, height: 0 };

export function OverlayStage({
  spec,
  combo,
  state = "enabled",
  width,
  height,
  pressTarget,
  focusTarget,
  prepare,
  children,
}: OverlayStageProps) {
  const [stage, setStage] = React.useState<HTMLDivElement | null>(null);
  const [anchor, setAnchor] = React.useState({ x: 0, y: 0, size: CLEAR });

  // 누를 요소의 자리 — 표면이 다 열릴 때까지 잠깐 지켜보고 맞춘다(모션 동안은 자리가 움직인다)
  React.useEffect(() => {
    if (!stage || !pressTarget) return;
    const place = () => {
      const target = stage.querySelector<HTMLElement>(pressTarget);
      if (!target) return;
      const s = stage.getBoundingClientRect();
      const t = target.getBoundingClientRect();
      const x = t.left - s.left;
      const y = t.top - s.top;
      setAnchor((a) =>
        Math.abs(a.x - x) < 0.5 &&
        Math.abs(a.y - y) < 0.5 &&
        a.size.width === t.width
          ? a
          : { x, y, size: { width: t.width, height: t.height } },
      );
    };
    const timer = window.setInterval(place, 100);
    const stop = window.setTimeout(() => window.clearInterval(timer), 2500);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(stop);
    };
  }, [stage, pressTarget]);

  React.useEffect(() => {
    if (!stage || !prepare) return;
    const timer = window.setTimeout(() => prepare(stage), 50);
    return () => window.clearTimeout(timer);
  }, [stage, prepare]);

  // 키보드 초점 — 검사기가 root 에 준 초점을 표면 안의 요소로 넘긴다
  const passFocus = (e: React.FocusEvent<HTMLElement>) => {
    if (state !== "focused" || e.target !== e.currentTarget || !focusTarget)
      return;
    stage?.querySelector<HTMLElement>(focusTarget)?.focus({
      preventScroll: true,
    });
  };

  const pressing = pressTarget != null && anchor.size.width > 0;
  const rootStyle: React.CSSProperties = pressing
    ? {
        left: anchor.x,
        top: anchor.y,
        width: anchor.size.width,
        height: anchor.size.height,
      }
    : { inset: 0 };
  const stageStyle: React.CSSProperties = pressing
    ? { left: -anchor.x, top: -anchor.y, width, height }
    : { inset: 0 };

  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-r2 border border-stroke-neutral-subtle bg-bg-layer-basement"
      style={{ width, height }}
    >
      <Specimen spec={spec} combo={combo} state={state}>
        <div
          className="absolute"
          style={rootStyle}
          tabIndex={state === "focused" ? -1 : undefined}
          onFocus={passFocus}
        >
          {/* transform — fixed 인 표면이 무대 안에 서게 한다 */}
          <div
            ref={setStage}
            className="absolute"
            style={{ ...stageStyle, transform: "translateZ(0)" }}
          >
            {stage ? children(stage) : null}
          </div>
        </div>
      </Specimen>
    </div>
  );
}
