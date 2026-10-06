import type { ReactNode } from "react";

/**
 * 카탈로그 데모를 짜는 부품 — 개발 전용(/dev/ds).
 *
 * Specimen 은 견본 하나에 조합 · 상태를 data-* 로 단다. scripts/check-ds-spec.mjs 가 이것을 찾아
 * 스펙 값(src/shared/ds/spec/<이름>.json)을 풀고 크로미움에서 잰 값과 맞춘다. 틀은 상자가 없어
 * (display: contents) 안의 컴포넌트가 놓인 자리 그대로 그려진다 — 첫 요소가 컴포넌트여야 한다.
 * 상태가 hovered · pressed · focused 면 검사기가 실제로 올리고 · 누르고 · 탭해서 잰다.
 */
export const Specimen = ({
  spec,
  combo,
  state = "enabled",
  children,
}: {
  spec: string;
  combo: Record<string, string>;
  state?: string;
  children: ReactNode;
}) => (
  <div
    className="contents"
    data-spec={spec}
    data-combo={JSON.stringify(combo)}
    data-state={state}
  >
    {children}
  </div>
);

/** 데모 한 구역 — 작은 제목 아래 내용 */
export const DemoBlock = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <div className="flex flex-col gap-x3">
    <p className="text-t3 font-bold text-fg-neutral-muted">{title}</p>
    {children}
  </div>
);

/** 데모 한 줄 — 왼쪽 이름표 + 견본들. 좁으면 견본끼리 줄을 바꾼다(이름표 아래로 흘러가지 않게) */
export const DemoRow = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) => (
  <div className="flex items-start gap-x3">
    <span className="w-28 shrink-0 pt-x2 text-t2 text-fg-neutral-subtle">
      {label}
    </span>
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x3">
      {children}
    </div>
  </div>
);
