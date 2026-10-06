import { DemoBlock, DemoRow, Specimen } from "@/shared/ds/catalog/DemoKit";

import { SegmentedControl, SegmentedControlItem } from "./segmented-control";

// 견본은 칸 셋 — 검사기가 재는 칸은 가운데 칸("이번 주")이다. 검사기는 트랙 가운데를 올리고 · 누르고, 트랙에 포커스를 주면
// Radix 가 고른 칸으로 옮긴다. 고름 축은 가운데 칸을 고르는지로 정한다
const MIDDLE = "week";
const VALUE = { unselected: "today", selected: MIDDLE } as const;
const SELECTED = ["unselected", "selected"] as const;
// 검사기가 올리고 · 누르고 · 탭해서 재는 상태와, 그대로 그리는 상태.
// 포커스는 고른 칸에만 — 라디오 묶음이라 Tab 은 고른 칸에 서고, 화살표는 옮기며 고른다(안 고른 칸에 키보드 포커스가 서지 않는다)
const STATES = [
  "enabled",
  "hovered",
  "pressed",
  "focused",
  "disabled",
] as const;

const TodoView = ({
  value,
  disabled = false,
  notification = false,
}: {
  value: string;
  disabled?: boolean;
  notification?: boolean;
}) => (
  <SegmentedControl aria-label="할 일 보기" defaultValue={value}>
    <SegmentedControlItem value="today">오늘</SegmentedControlItem>
    <SegmentedControlItem
      value={MIDDLE}
      disabled={disabled}
      notification={notification}
    >
      이번 주
    </SegmentedControlItem>
    <SegmentedControlItem value="all">전체</SegmentedControlItem>
  </SegmentedControl>
);

/** 카탈로그(/dev/ds) — 고름 × 상태(올림 · 누름 · 포커스 · 비활성), 알림 점, 칸 수 2 ~ 4 · 긴 글 · 트랙 전체 막힘 */
export const SegmentedControlDemo = () => (
  <div className="flex flex-col gap-x8">
    <DemoBlock title="상태 × 고름 — 가운데 칸(이번 주)을 잰다. 올림 · 누름 · 키보드 포커스는 직접 해 본다(검사기는 실제로 올리고 누르고 탭한다)">
      {STATES.map((state) => (
        <DemoRow key={state} label={state}>
          {SELECTED.filter(
            (selected) => state !== "focused" || selected === "selected",
          ).map((selected) => (
            <div key={selected} className="w-full max-w-[312px]">
              <Specimen
                spec="segmented-control"
                combo={{ selected }}
                state={state}
              >
                <TodoView
                  value={VALUE[selected]}
                  disabled={state === "disabled"}
                  notification={
                    selected === "unselected" && state !== "disabled"
                  }
                />
              </Specimen>
            </div>
          ))}
        </DemoRow>
      ))}
      <DemoRow label="disabled(트랙)">
        <div className="w-full max-w-[312px]">
          <Specimen
            spec="segmented-control"
            combo={{ selected: "selected" }}
            state="disabled"
          >
            <SegmentedControl
              aria-label="할 일 보기"
              defaultValue={MIDDLE}
              disabled
            >
              <SegmentedControlItem value="today">오늘</SegmentedControlItem>
              <SegmentedControlItem value={MIDDLE}>
                이번 주
              </SegmentedControlItem>
              <SegmentedControlItem value="all">전체</SegmentedControlItem>
            </SegmentedControl>
          </Specimen>
        </div>
      </DemoRow>
    </DemoBlock>

    <DemoBlock title="칸 수 2 ~ 4 — 칸이 트랙 폭을 똑같이 나눈다(폰 콘텐츠 폭 312)">
      <DemoRow label="2">
        <div className="w-full max-w-[312px]">
          <SegmentedControl aria-label="거래 보기" defaultValue="expense">
            <SegmentedControlItem value="expense">지출</SegmentedControlItem>
            <SegmentedControlItem value="income">수입</SegmentedControlItem>
          </SegmentedControl>
        </div>
      </DemoRow>
      <DemoRow label="4">
        <div className="w-full max-w-[312px]">
          <SegmentedControl aria-label="할 일 보기" defaultValue="today">
            <SegmentedControlItem value="today">오늘</SegmentedControlItem>
            <SegmentedControlItem value="week">이번 주</SegmentedControlItem>
            <SegmentedControlItem value="all">전체</SegmentedControlItem>
            <SegmentedControlItem value="done" notification>
              완료
            </SegmentedControlItem>
          </SegmentedControl>
        </div>
      </DemoRow>
      <DemoRow label="긴 글">
        <div className="w-full max-w-[312px]">
          <SegmentedControl aria-label="프리셋 정렬" defaultValue="most">
            <SegmentedControlItem value="most">많이 쓴 순</SegmentedControlItem>
            <SegmentedControlItem value="recent">
              최근에 사용한 프리셋
            </SegmentedControlItem>
            <SegmentedControlItem value="name">이름순</SegmentedControlItem>
          </SegmentedControl>
        </div>
      </DemoRow>
    </DemoBlock>
  </div>
);
