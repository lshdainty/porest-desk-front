import { useState, type ReactNode } from "react";
import { Plus, Share2, SquarePen } from "lucide-react";

import { Button } from "@/shared/ds/button";
import { DemoBlock, DemoRow, Specimen } from "@/shared/ds/catalog/DemoKit";

import { FloatingActionButton } from "./floating-action-button";

const noop = () => {};

// 폰 화면 — fixed 인 버튼을 이 칸 안에 가둔다(transform 이 fixed 의 기준이 된다). 안전 영역은 크로미움에서 0 이다
const Screen = ({
  children,
  width = 360,
  height = 220,
}: {
  children: ReactNode;
  width?: number;
  height?: number;
}) => (
  <div
    className="relative shrink-0 overflow-hidden rounded-r3 border border-stroke-neutral-subtle bg-bg-layer-basement"
    style={{ width, height, transform: "translateZ(0)" }}
  >
    {children}
  </div>
);

// 버튼 뒤로 지나가는 목록 — 스크롤해도 버튼은 그 자리에 있다. 마지막 줄이 가리지 않게 아래에 56 + 20 + 20 여백
const List = ({
  rows = 8,
  bottom = 96,
}: {
  rows?: number;
  bottom?: number;
}) => (
  <div
    className="h-full overflow-y-auto px-x4 pt-x4"
    style={{ paddingBottom: bottom }}
  >
    {Array.from({ length: rows }, (_, i) => (
      <div
        key={i}
        className="mb-x2 rounded-r3 bg-bg-layer-default p-x4 text-t4 text-fg-neutral"
      >
        할 일 {i + 1} · 오늘까지
      </div>
    ))}
  </div>
);

const STATES = ["enabled", "hovered", "pressed", "focused"] as const;

const StatesDemo = () => (
  <DemoBlock title="상태 — 기본 · 호버(누름과 같은 색, 축소 없음) · 누름(누름 색 + 2px 축소) · 포커스(원 바깥 링)">
    <DemoRow label="오른쪽 아래">
      {STATES.map((state) => (
        <div key={state} className="flex flex-col items-center gap-x1">
          <Screen width={140} height={110}>
            <Specimen spec="floating-action-button" combo={{}} state={state}>
              <FloatingActionButton
                icon={<Plus />}
                aria-label={`할 일 추가 — ${state}`}
                onClick={noop}
              />
            </Specimen>
          </Screen>
          <span className="text-t1 text-fg-neutral-subtle">{state}</span>
        </div>
      ))}
    </DemoRow>
  </DemoBlock>
);

const PlacementDemo = () => {
  const [count, setCount] = useState(0);
  return (
    <DemoBlock title="자리 — 화면 끝 · 아래에서 20 · 바닥 고정 버튼이 있으면 그 위 끝에서 20(offsetBottom) · 스크롤해도 그 자리 · 아이콘만 56, 화면에 하나">
      <DemoRow label="할 일">
        <Screen>
          <List />
          <FloatingActionButton
            icon={<Plus />}
            aria-label="할 일 추가"
            onClick={() => setCount((n) => n + 1)}
          />
        </Screen>
        <span className="self-center text-t3 text-fg-neutral-subtle">
          눌러 보기 · {count}번
        </span>
      </DemoRow>
      <DemoRow label="바닥 버튼 위">
        <Screen>
          <List bottom={170} />
          {/* 바닥에 고정된 버튼 — 높이 48 + 아래 16 = 64. 버튼은 그 위 끝에서 20 */}
          <div className="absolute inset-x-x4 bottom-x4">
            <Button size="large" variant="brandSolid" className="w-full">
              더치페이 보내기
            </Button>
          </div>
          <FloatingActionButton
            icon={<Share2 />}
            aria-label="더치페이 만들기"
            offsetBottom={64}
            onClick={noop}
          />
        </Screen>
      </DemoRow>
      <DemoRow label="좁은 폰 320">
        <Screen width={320} height={160}>
          <List rows={4} bottom={96} />
          <FloatingActionButton
            icon={<SquarePen />}
            aria-label="메모 쓰기"
            onClick={noop}
          />
        </Screen>
      </DemoRow>
    </DemoBlock>
  );
};

/** 카탈로그(/dev/ds) — 상태 · 자리(목록 위 · 바닥 버튼 위 · 좁은 폰) */
export const FloatingActionButtonDemo = () => (
  <div className="flex flex-col gap-x8">
    <StatesDemo />
    <PlacementDemo />
  </div>
);
