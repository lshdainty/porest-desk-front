import { useState, type FocusEvent, type ReactNode } from "react";

import { DemoBlock, DemoRow, Specimen } from "@/shared/ds/catalog/DemoKit";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  type CollapsibleLayout,
  type CollapsibleSurface,
} from "./collapsible";

const SURFACES = ["default", "card", "warning"] as const;
const OPEN = ["collapsed", "expanded"] as const;
const DESCRIPTION = ["none", "shown"] as const;
const LAYOUTS = ["text", "rows"] as const;
// 검사기가 올리고 · 누르고 · 탭해서 재는 상태와, 그대로 그리는 상태
const STATES = [
  "enabled",
  "hovered",
  "pressed",
  "focused",
  "disabled",
] as const;

const TITLE: Record<CollapsibleSurface, string> = {
  default: "내역 분할 6개",
  card: "상세 검색 조건",
  warning: "빠르게 맞추기",
};
const DESC: Record<CollapsibleSurface, string> = {
  default: "합계 −123,456,789원",
  card: "2개 필터 적용 중",
  warning: "3,456,789원 모자라요",
};

// 검사기가 견본 뿌리에 준 키보드 포커스를 트리거로 넘긴다 — 뿌리는 초점을 받지 않는다(List 데모의 passFocus 와 같은 방법, 컴포넌트는 그대로다)
const passFocus = (selector: string) => ({
  tabIndex: -1,
  onFocus: (e: FocusEvent<HTMLElement>) => {
    if (e.target !== e.currentTarget) return;
    e.currentTarget
      .querySelector<HTMLElement>(selector)
      ?.focus({ preventScroll: true });
  },
});

const Rows = () => (
  <ul className="m-0 flex list-none flex-col p-0">
    {["식비 · 50,000원", "교통 · 30,000원", "기타 · 43,456,789원"].map((t) => (
      <li key={t} className="py-x3 text-t5 text-fg-neutral">
        {t}
      </li>
    ))}
  </ul>
);

type SampleProps = {
  surface: CollapsibleSurface;
  open?: (typeof OPEN)[number];
  description?: (typeof DESCRIPTION)[number];
  layout?: CollapsibleLayout;
  state?: (typeof STATES)[number];
};

// 견본 하나 — 놓인 면 × 펼침 × 설명 × 펼친 내용 × 상태. 경고 상자는 화면이 그린다(상자 + 경고 글 한 줄 + 맨 아래 줄이 Collapsible),
// 검사기는 상자(box)를 뿌리로 올리고 누른다 — 상자의 가운데는 트리거 위쪽 경계라 경고 글을 한 줄로 두어 트리거에 닿게 한다
const Sample = ({
  surface,
  open = "collapsed",
  description = "none",
  layout = "text",
  state = "enabled",
}: SampleProps) => {
  const collapsible = (
    <Collapsible
      surface={surface}
      defaultOpen={open === "expanded"}
      disabled={state === "disabled"}
    >
      <CollapsibleTrigger
        title={TITLE[surface]}
        description={description === "shown" ? DESC[surface] : undefined}
      />
      <CollapsibleContent layout={layout}>
        {layout === "rows" ? (
          <Rows />
        ) : (
          <p className="m-0 text-t5 text-fg-neutral-muted">
            조건을 고르면 목록이 바로 걸러져요.
          </p>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
  const focus =
    state === "focused" ? "[data-slot=collapsible-trigger]" : undefined;
  let root: ReactNode;
  if (surface === "warning") {
    root = (
      <div
        data-slot="collapsible-box"
        className="w-[390px] max-w-full overflow-hidden rounded-r3 border border-solid border-stroke-warning-weak bg-bg-warning-weak"
        {...(focus ? passFocus(focus) : {})}
      >
        <div className="px-x4 pb-x3 pt-x3_5 text-t5 text-fg-warning">
          분할 합계가 3,456,789원 모자라요
        </div>
        {collapsible}
      </div>
    );
  } else {
    root = (
      <div
        className={
          surface === "card"
            ? "w-[390px] max-w-full bg-bg-layer-basement p-x4"
            : "w-[390px] max-w-full bg-bg-layer-default"
        }
        {...(focus ? passFocus(focus) : {})}
      >
        {collapsible}
      </div>
    );
  }
  return (
    <Specimen
      spec="collapsible"
      combo={{ surface, open, description, layout }}
      state={state}
    >
      {root}
    </Specimen>
  );
};

const ControlledExample = () => {
  const [open, setOpen] = useState(false);
  return (
    <div className="w-[390px] max-w-full bg-bg-layer-default">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger
          title="내역 분할 6개"
          description="합계 −123,456,789원"
        />
        <CollapsibleContent layout="rows">
          <Rows />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

// 가장 나쁜 값 — 긴 이름 · 긴 설명이 줄을 바꿔 다 보이고, 펼친 중에 내용이 늘어난다
const WorstExample = () => {
  const [count, setCount] = useState(3);
  return (
    <div className="w-[390px] max-w-full bg-bg-layer-default">
      <Collapsible defaultOpen>
        <CollapsibleTrigger
          title="연회비 · 카드 발급 후 첫 달 실적 기준으로 산정하며 전월 이용 실적이 기준에 못 미치면 청구 할인이 적용되지 않을 수 있습니다"
          description="합계 −123,456,789,012원 · 12개 필터 적용 중 · 기간 2026-01-01 ~ 2026-12-31"
        />
        <CollapsibleContent layout="rows">
          <ul className="m-0 flex list-none flex-col p-0">
            {Array.from({ length: count }, (_, i) => (
              <li key={i} className="py-x3 text-t5 text-fg-neutral">
                분할 {i + 1} · 12,345원
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="text-t3 text-fg-brand"
            onClick={() => setCount((c) => c + 5)}
          >
            줄 늘리기
          </button>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

/** 카탈로그(/dev/ds) — 놓인 면(흰 면 · 카드 · 경고 상자) × 펼침 × 설명 × 펼친 내용, 상태, 쥐고 다루는 펼침, 가장 나쁜 값 */
export const CollapsibleDemo = () => (
  <div className="flex flex-col gap-x8">
    <DemoBlock title="놓인 면 × 펼침 × 설명 × 펼친 내용 — 접힘 54 · 설명 있으면 74, 줄 목록은 아래 8(카드는 24)">
      {SURFACES.map((surface) =>
        OPEN.map((open) => (
          <DemoRow key={`${surface}-${open}`} label={`${surface} · ${open}`}>
            {DESCRIPTION.map((description) =>
              LAYOUTS.map((layout) => (
                <Sample
                  key={`${description}-${layout}`}
                  surface={surface}
                  open={open}
                  description={description}
                  layout={layout}
                />
              )),
            )}
          </DemoRow>
        )),
      )}
    </DemoBlock>

    <DemoBlock title="상태 — 올림 · 누름 · 키보드 포커스는 직접 해 본다(검사기는 실제로 올리고 누르고 탭한다). 막힘은 전용 색(흐리게 하지 않는다)">
      {SURFACES.map((surface) => (
        <DemoRow key={surface} label={surface}>
          {STATES.map((state) => (
            <Sample key={state} surface={surface} state={state} />
          ))}
          <Sample surface={surface} open="expanded" state="disabled" />
        </DemoRow>
      ))}
    </DemoBlock>

    <DemoBlock title="쥐고 다루는 펼침(open · onOpenChange)">
      <ControlledExample />
    </DemoBlock>

    <DemoBlock title="가장 나쁜 값 — 긴 이름 · 긴 설명은 줄을 바꿔 다 보이고, 펼친 채 내용이 늘어나도 트리거는 그 자리">
      <WorstExample />
    </DemoBlock>
  </div>
);
