import { useState, type ReactNode } from "react";
import { Archive, Pencil, Pin, Trash2 } from "lucide-react";

import { Avatar } from "@/shared/ds/avatar";
import { DemoBlock, DemoRow, Specimen } from "@/shared/ds/catalog/DemoKit";

import {
  SwipeActionCell,
  SwipeActions,
  SwipeActionsProvider,
  type SwipeAction,
} from "./swipe-actions";
import { swipeTrayWidth } from "./swipe-actions-variants";

const KINDS = ["neutral", "primary", "destructive"] as const;
const STATES = [
  "enabled",
  "hovered",
  "pressed",
  "focused",
  "disabled",
] as const;

const LABEL: Record<
  (typeof KINDS)[number],
  { label: string; icon: ReactNode }
> = {
  neutral: { label: "고정", icon: <Pin /> },
  primary: { label: "수정", icon: <Pencil /> },
  destructive: { label: "삭제", icon: <Trash2 /> },
};

const noop = () => {};

const pin: SwipeAction = {
  kind: "neutral",
  label: "고정",
  icon: <Pin />,
  onSelect: noop,
};
const edit: SwipeAction = {
  kind: "primary",
  label: "수정",
  icon: <Pencil />,
  onSelect: noop,
};
const del: SwipeAction = {
  kind: "destructive",
  label: "삭제",
  icon: <Trash2 />,
  onSelect: noop,
};

// 줄 — 높이 56 이상(스펙: 칸은 줄을 따르되 56 보다 낮으면 56). 줄의 모양은 이 컴포넌트가 정하지 않는다
const Row = ({ title, meta }: { title: string; meta: string }) => (
  <div className="flex min-h-16 items-center gap-x3 px-x6 py-x3">
    <Avatar size={36} name={title} />
    <div className="flex min-w-0 flex-1 flex-col">
      <span className="truncate text-t5 font-medium text-fg-neutral">
        {title}
      </span>
      <span className="truncate text-t3 text-fg-neutral-subtle">{meta}</span>
    </div>
  </div>
);

const Phone = ({ children }: { children: ReactNode }) => (
  <div className="w-[360px] max-w-full overflow-hidden rounded-r3 border border-stroke-neutral-weak bg-bg-layer-default">
    {children}
  </div>
);

// 열린 모습 — 트레이가 드러난 자리를 손으로 그린다(밀어 열면 이 모습이다 — 줄이 트레이 폭만큼 물러난다)
const OpenPreview = ({ actions }: { actions: SwipeAction[] }) => {
  const tray = swipeTrayWidth(actions.length);
  return (
    <Phone>
      <div className="relative overflow-hidden">
        <div className="absolute inset-y-0 end-0 flex">
          {[...actions].reverse().map((action, i) => (
            <SwipeActionCell
              key={action.label}
              action={action}
              index={i}
              rowLabel="스타벅스"
            />
          ))}
        </div>
        <div
          className="relative bg-bg-layer-default"
          style={{ transform: `translateX(-${tray}px)` }}
        >
          <Row title="스타벅스" meta="식비 · 오늘" />
        </div>
      </div>
    </Phone>
  );
};

/** 카탈로그(/dev/ds) — 종류 3 × 상태 5(동작 칸 하나), 크기(칸 폭 · 트레이 폭), 열린 모습, 직접 밀어 보기(터치), 줄 끝 ⋮, RTL */
export const SwipeActionsDemo = () => {
  const [picked, setPicked] = useState("—");
  const act = (label: string): SwipeAction[] =>
    [pin, edit, del].map((a) => ({
      ...a,
      onSelect: () => setPicked(`${a.label}: ${label}`),
    }));
  return (
    <div className="flex flex-col gap-x8">
      <DemoBlock title="종류 × 상태 — 동작 칸 하나(배지 36 · 아이콘 18 · 라벨 12 / 700). 색은 배지만, 호버 · 누름은 밝기 88%, 막히면 전용 색">
        {KINDS.map((kind) => (
          <DemoRow key={kind} label={kind}>
            {STATES.map((state) => (
              <div
                key={state}
                className="flex flex-col items-center gap-x1 rounded-r2 bg-bg-layer-default"
              >
                <Specimen
                  spec="swipe-actions"
                  combo={{ kind, size: "default" }}
                  state={state}
                >
                  <SwipeActionCell
                    action={{
                      kind,
                      label: LABEL[kind].label,
                      icon: LABEL[kind].icon,
                      disabled: state === "disabled",
                      onSelect: noop,
                    }}
                    index={0}
                    rowLabel="스타벅스"
                  />
                </Specimen>
                <span className="pb-x1 text-t1 text-fg-neutral-subtle">
                  {state}
                </span>
              </div>
            ))}
          </DemoRow>
        ))}
      </DemoBlock>

      <DemoBlock title="크기 — 첫 칸 앞 20 · 칸 사이 12 · 마지막 칸은 화면 끝, 트레이 56 · 104 · 152. 열린 모습(삭제는 가장 안쪽)">
        <DemoRow label="동작 1개">
          <OpenPreview actions={[del]} />
        </DemoRow>
        <DemoRow label="동작 2개">
          <OpenPreview actions={[edit, del]} />
        </DemoRow>
        <DemoRow label="동작 3개">
          <OpenPreview actions={[pin, edit, del]} />
        </DemoRow>
        <DemoRow label="막힌 동작 · 보관">
          <OpenPreview
            actions={[
              {
                kind: "neutral",
                label: "보관",
                icon: <Archive />,
                disabled: true,
                onSelect: noop,
              },
              edit,
              del,
            ]}
          />
        </DemoRow>
      </DemoBlock>

      <DemoBlock title="직접 밀어 보기 — 폰 화면(터치)에서 줄을 왼쪽으로 밀어 본다. 한 번에 한 줄 · 스크롤하면 닫힘 · 끝까지 밀어도 실행하지 않음">
        <SwipeActionsProvider>
          <Phone>
            {["스타벅스", "쿠팡", "지하철"].map((title) => {
              const actions = act(title);
              return (
                <SwipeActions key={title} actions={actions} rowLabel={title}>
                  <div className="flex items-center">
                    <div className="min-w-0 flex-1">
                      <Row title={title} meta="식비 · 오늘" />
                    </div>
                  </div>
                </SwipeActions>
              );
            })}
          </Phone>
        </SwipeActionsProvider>
        <p className="text-t3 text-fg-neutral-muted">
          마지막으로 고른 동작 — {picked}
        </p>
      </DemoBlock>

      <DemoBlock title="RTL — 미는 방향이 뒤집힌다(오른쪽으로 밀고 트레이는 왼쪽에서 나온다). 동작 차례는 그대로">
        <div dir="rtl">
          <SwipeActionsProvider>
            <Phone>
              <SwipeActions actions={act("스타벅스")} rowLabel="스타벅스">
                <Row title="스타벅스" meta="식비 · 오늘" />
              </SwipeActions>
            </Phone>
          </SwipeActionsProvider>
        </div>
      </DemoBlock>

      <DemoBlock title="768 이상 — enabled={false} 로 줄만 그린다(트레이 없음)">
        <Phone>
          <SwipeActions actions={act("스타벅스")} enabled={false}>
            <div className="flex items-center">
              <div className="min-w-0 flex-1">
                <Row title="스타벅스" meta="식비 · 오늘" />
              </div>
            </div>
          </SwipeActions>
        </Phone>
      </DemoBlock>
    </div>
  );
};
