import { useState } from "react";

import { DemoBlock, DemoRow, Specimen } from "@/shared/ds/catalog/DemoKit";

import {
  ChipTabsList,
  ChipTabsTrigger,
  Tabs,
  TabsContent,
  TabsList,
  TabsSwipeArea,
  TabsTrigger,
} from "./tabs";

const LAYOUTS = ["fill", "hug"] as const;
const SIZES = ["small", "medium"] as const;
const SELECTED = ["unselected", "selected"] as const;

// 견본은 탭 셋 — 검사기가 재는 탭은 가운데 탭("이번 주")이다. 검사기는 목록 가운데를 올리고 · 누르고(Fill 은 가운데 탭이 눌린다),
// 목록에 포커스를 주면 Radix 가 고른 탭으로 넘기므로 포커스 견본은 가운데 탭을 고른 것만 둔다(라디오 · 탭은 고른 탭에만 Tab 이 선다)
const MIDDLE = "week";
const VALUE = { unselected: "today", selected: MIDDLE } as const;

type LineState = "enabled" | "pressed" | "focused" | "disabled";
const LINE_STATES: readonly LineState[] = [
  "enabled",
  "pressed",
  "focused",
  "disabled",
];

const LineSpecimen = ({
  layout,
  size,
  selected,
  state,
  notification = false,
}: {
  layout: (typeof LAYOUTS)[number];
  size: (typeof SIZES)[number];
  selected: (typeof SELECTED)[number];
  state: LineState;
  notification?: boolean;
}) => (
  <div className="w-full max-w-[312px]">
    <Tabs defaultValue={VALUE[selected]}>
      <Specimen spec="tabs" combo={{ layout, size, selected }} state={state}>
        <TabsList layout={layout} size={size} aria-label="할 일 보기">
          <TabsTrigger value="today">오늘</TabsTrigger>
          <TabsTrigger
            value={MIDDLE}
            disabled={state === "disabled"}
            notification={notification}
          >
            이번 주
          </TabsTrigger>
          <TabsTrigger value="all">전체</TabsTrigger>
        </TabsList>
      </Specimen>
    </Tabs>
  </div>
);

const ChipSpecimen = ({
  variant,
  size,
  notification = false,
}: {
  variant: "solid" | "outline";
  size: "medium" | "large";
  notification?: boolean;
}) => (
  <div className="w-[360px] bg-bg-layer-default">
    <Tabs defaultValue="holding">
      <Specimen spec="chip-tabs" combo={{ variant, size }}>
        <ChipTabsList variant={variant} size={size} aria-label="증권 보기">
          <ChipTabsTrigger value="holding">보유</ChipTabsTrigger>
          <ChipTabsTrigger value="watch" notification={notification}>
            관심
          </ChipTabsTrigger>
          <ChipTabsTrigger value="discover">발견</ChipTabsTrigger>
        </ChipTabsList>
      </Specimen>
    </Tabs>
  </div>
);

// value 는 글이 아니라 바뀌지 않는 id 다(빈칸이 있으면 탭 · 내용 칸의 id 연결이 깨진다)
const MANY = [
  { id: "category", label: "카테고리" },
  { id: "trend", label: "추이" },
  { id: "compare", label: "비교" },
  { id: "budget", label: "예산" },
  { id: "fixed", label: "고정 지출" },
  { id: "subscription", label: "구독" },
  { id: "installment", label: "할부" },
  { id: "settle", label: "정산" },
];

/** 카탈로그(/dev/ds) — Line(폭 × 크기 × 고름 × 상태 · 알림 점), Chip Tabs(변형 × 크기), 내용 칸 · 두 단 · 탭 8개 · 긴 글 · 밀어 넘기기 */
export const TabsDemo = () => {
  const [stat, setStat] = useState("category");
  const [broker, setBroker] = useState("namu");
  const [view, setView] = useState("holding");
  const [many, setMany] = useState("category");
  return (
    <div className="flex flex-col gap-x8">
      <DemoBlock title="Line — 폭 × 크기 × 고름 × 상태. 가운데 탭(이번 주)을 잰다. 호버 모양은 없다. 누름은 Fill 에서, 포커스는 고른 탭에서">
        {LAYOUTS.map((layout) =>
          SIZES.map((size) =>
            LINE_STATES.map((state) => (
              <DemoRow
                key={`${layout}-${size}-${state}`}
                label={`${layout} · ${size} · ${state}`}
              >
                {SELECTED.filter(
                  (selected) =>
                    (state !== "focused" || selected === "selected") &&
                    (state !== "pressed" || layout === "fill"),
                ).map((selected) => (
                  <LineSpecimen
                    key={selected}
                    layout={layout}
                    size={size}
                    selected={selected}
                    state={state}
                  />
                ))}
              </DemoRow>
            )),
          ),
        )}
      </DemoBlock>

      <DemoBlock title="Line — 알림 점(새 소식이 있는 탭 하나, 고르면 사라진다) · 목록 전체 막힘(고른 탭의 막대도 fg-disabled)">
        {LAYOUTS.map((layout) => (
          <DemoRow key={layout} label={`${layout} · 알림 점`}>
            <LineSpecimen
              layout={layout}
              size="small"
              selected="unselected"
              state="enabled"
              notification
            />
          </DemoRow>
        ))}
        <DemoRow label="목록 막힘">
          <div className="w-full max-w-[312px]">
            <Tabs defaultValue={MIDDLE}>
              <TabsList aria-label="할 일 보기" size="medium">
                <TabsTrigger value="today" disabled>
                  오늘
                </TabsTrigger>
                <TabsTrigger value={MIDDLE} disabled>
                  이번 주
                </TabsTrigger>
                <TabsTrigger value="all" disabled>
                  전체
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </DemoRow>
      </DemoBlock>

      <DemoBlock title="Chip Tabs — 변형(Solid · Outline) × 크기(medium 36 · large 40), 알림 점은 글 뒤 6. 칩 하나의 색 · 상태는 Chip 그대로">
        {(["solid", "outline"] as const).map((variant) =>
          (["medium", "large"] as const).map((size) => (
            <DemoRow key={`${variant}-${size}`} label={`${variant} · ${size}`}>
              <ChipSpecimen variant={variant} size={size} />
              <ChipSpecimen variant={variant} size={size} notification />
            </DemoRow>
          )),
        )}
      </DemoBlock>

      <DemoBlock title="내용 칸 — Fill 3개. ← → Home End 로 옮기면 바로 고른다. 다른 탭을 다녀와도 입력이 남는다">
        <div className="w-full max-w-[360px]">
          <Tabs value={stat} onValueChange={setStat}>
            <TabsList aria-label="통계">
              <TabsTrigger value="category">카테고리</TabsTrigger>
              <TabsTrigger value="trend">추이</TabsTrigger>
              <TabsTrigger value="compare">비교</TabsTrigger>
            </TabsList>
            <TabsContent value="category" className="p-x4">
              <input
                aria-label="메모"
                placeholder="카테고리 메모(탭을 다녀와도 남는다)"
                className="w-full rounded-r2 border border-stroke-neutral-weak p-x2 text-t4"
              />
            </TabsContent>
            <TabsContent value="trend" className="p-x4 text-t4">
              추이 내용
            </TabsContent>
            <TabsContent value="compare" className="p-x4 text-t4">
              비교 내용
            </TabsContent>
          </Tabs>
        </div>
      </DemoBlock>

      <DemoBlock title="두 단 — 1차 Line · 2차 Chip Tabs(화면에 필터 칩이 함께 있으면 2차도 Line)">
        <div className="w-full max-w-[360px]">
          <Tabs value={broker} onValueChange={setBroker}>
            <TabsList size="medium" aria-label="증권사">
              <TabsTrigger value="namu">나무증권</TabsTrigger>
              <TabsTrigger value="toss">토스증권</TabsTrigger>
            </TabsList>
            <TabsContent value="namu">
              <Tabs value={view} onValueChange={setView}>
                <ChipTabsList variant="solid" aria-label="나무증권 보기">
                  <ChipTabsTrigger value="holding">보유</ChipTabsTrigger>
                  <ChipTabsTrigger value="watch">관심</ChipTabsTrigger>
                  <ChipTabsTrigger value="discover" notification>
                    발견
                  </ChipTabsTrigger>
                </ChipTabsList>
                <TabsContent value="holding" className="p-x4 text-t4">
                  보유 종목
                </TabsContent>
                <TabsContent value="watch" className="p-x4 text-t4">
                  관심 종목
                </TabsContent>
                <TabsContent value="discover" className="p-x4 text-t4">
                  발견
                </TabsContent>
              </Tabs>
            </TabsContent>
            <TabsContent value="toss" className="p-x4 text-t4">
              토스증권 내용
            </TabsContent>
          </Tabs>
        </div>
      </DemoBlock>

      <DemoBlock title="가장 나쁜 값 — 탭 8개(Hug · 넘치면 가로 스크롤, 고른 탭이 밖이면 16 여유를 두고 드러낸다) · 넘치는 Fill(영어 긴 탭 넷 · 폰 360 — 칸을 나누지 않고 같은 모양으로 가로 스크롤) · 폰 360 · 긴 글 · Chip Tabs 12개">
        <div className="w-[360px]">
          <Tabs value={many} onValueChange={setMany}>
            <TabsList layout="hug" aria-label="통계 8개">
              {MANY.map(({ id, label }) => (
                <TabsTrigger key={id} value={id}>
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        <div className="w-[360px]">
          <Tabs defaultValue="a">
            <TabsList layout="hug" size="medium" aria-label="긴 글">
              <TabsTrigger value="a">신한카드 마이 포인트 플러스</TabsTrigger>
              <TabsTrigger value="b" notification>
                월 구독료와 정기 결제 모음
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="w-[360px]" data-demo="fill-overflow">
          <Tabs defaultValue="d">
            <TabsList aria-label="Brokerage accounts">
              <TabsTrigger value="a">Brokerage account</TabsTrigger>
              <TabsTrigger value="b">Retirement savings</TabsTrigger>
              <TabsTrigger value="c">Emergency fund</TabsTrigger>
              <TabsTrigger value="d">Education account</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="w-[360px] bg-bg-layer-default">
          <Tabs defaultValue="i0">
            <ChipTabsList aria-label="칩 탭 12개">
              {Array.from({ length: 12 }, (_, i) => (
                <ChipTabsTrigger key={i} value={`i${i}`}>
                  카테고리 {i + 1}
                </ChipTabsTrigger>
              ))}
            </ChipTabsList>
          </Tabs>
        </div>
      </DemoBlock>

      <DemoBlock title="밀어 넘기기 — 폰(거친 포인터)에서 화면 전체를 바꾸는 1차 탭만. 마우스에서는 넘기지 않는다">
        <div className="w-full max-w-[360px]">
          <Tabs defaultValue="category">
            <TabsList aria-label="통계 밀기">
              <TabsTrigger value="category">카테고리</TabsTrigger>
              <TabsTrigger value="trend">추이</TabsTrigger>
              <TabsTrigger value="compare">비교</TabsTrigger>
            </TabsList>
            <TabsSwipeArea>
              <TabsContent value="category" className="p-x4 text-t4">
                카테고리 — 옆으로 밀어 보세요
              </TabsContent>
              <TabsContent value="trend" className="p-x4 text-t4">
                추이
              </TabsContent>
              <TabsContent value="compare" className="p-x4 text-t4">
                비교
              </TabsContent>
            </TabsSwipeArea>
          </Tabs>
        </div>
      </DemoBlock>
    </div>
  );
};
