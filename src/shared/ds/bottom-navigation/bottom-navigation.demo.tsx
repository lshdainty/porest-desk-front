import { useState, type FocusEvent, type ReactNode } from "react";
import { CalendarDays, ClipboardList, House, Menu } from "lucide-react";

import { DemoBlock, DemoRow, Specimen } from "@/shared/ds/catalog/DemoKit";

import {
  BottomNavigation,
  BottomNavigationAddButton,
  BottomNavigationItem,
} from "./bottom-navigation";
import { BOTTOM_NAVIGATION_INSET } from "./bottom-navigation-variants";

const noop = () => {};
const stay = (e: { preventDefault: () => void }) => e.preventDefault();

type Tab = "home" | "ledger" | "calendar" | "more";

// 정적 견본은 compact 를 제어한다 — 아니면 카탈로그 페이지를 스크롤할 때마다(검사기가 견본으로 스크롤한다) 모든 바가 줄어든다.
// 폰 화면 — fixed 인 바를 이 칸 안에 가둔다(transform 이 fixed 의 기준이 된다). 안전 영역은 크로미움에서 0 이다
const Screen = ({
  children,
  width = 360,
  height = 200,
  boxRef,
}: {
  children: ReactNode;
  width?: number;
  height?: number;
  boxRef?: (node: HTMLDivElement | null) => void;
}) => (
  <div
    ref={boxRef}
    className="relative shrink-0 overflow-hidden rounded-r3 border border-stroke-neutral-subtle bg-bg-layer-basement"
    style={{ width, height, transform: "translateZ(0)" }}
  >
    {children}
  </div>
);

// 바 뒤로 지나가는 내용 — 짙은 카드 · 브랜드 카드가 뒤로 와도 라벨 대비가 그대로여야 한다(바탕이 불투명하다)
const Behind = () => (
  <div className="flex flex-col gap-x2 p-x4">
    <div className="h-14 rounded-r3 bg-bg-neutral-inverted" />
    <div className="h-14 rounded-r3 bg-bg-brand-solid" />
    <div className="h-14 rounded-r3 bg-bg-layer-default" />
  </div>
);

// 검사기가 견본 뿌리(바)에 준 키보드 포커스를 첫 칸으로 넘긴다 — 바는 초점을 받지 않는다(컴포넌트는 그대로다)
const passFocus = {
  tabIndex: -1,
  onFocus: (e: FocusEvent<HTMLElement>) => {
    if (e.target !== e.currentTarget) return;
    e.currentTarget.querySelector<HTMLElement>("a")?.focus({
      preventScroll: true,
    });
  },
};

const Items = ({ tab, notify = [] }: { tab: Tab; notify?: Tab[] }) => (
  <>
    <BottomNavigationItem
      href="#home"
      icon={<House />}
      label="홈"
      current={tab === "home"}
      notification={notify.includes("home")}
      onClick={stay}
      onReselect={noop}
    />
    <BottomNavigationItem
      href="#ledger"
      icon={<ClipboardList />}
      label="가계부"
      current={tab === "ledger"}
      notification={notify.includes("ledger")}
      onClick={stay}
      onReselect={noop}
    />
    {/* 탭이 아니라 이 화면의 추가 — 이름은 화면마다 */}
    <BottomNavigationAddButton
      aria-label={tab === "calendar" ? "일정 추가" : "거래 추가"}
      onClick={noop}
    />
    <BottomNavigationItem
      href="#calendar"
      icon={<CalendarDays />}
      label="캘린더"
      current={tab === "calendar"}
      onClick={stay}
      onReselect={noop}
    />
    <BottomNavigationItem
      href="#more"
      icon={<Menu />}
      label="전체"
      current={tab === "more"}
      onClick={stay}
      onReselect={noop}
    />
  </>
);

const SIZES = ["regular", "compact"] as const;
type Size = (typeof SIZES)[number];
const SIZE_LABEL: Record<Size, string> = {
  regular: "펼침 66",
  compact: "줄어듦 48 — 라벨은 보이지 않고 이름은 남는다",
};

// 크기 × 고름 — "다른 탭" 견본은 지금 탭이 캘린더(첫 칸 홈이 안 고른 칸), "지금 탭" 견본은 홈이 지금 탭이다
const SizesDemo = () => (
  <DemoBlock title="바 — 펼침 66(좌우 14) · 줄어듦 48(좌우 36) × 지금 탭 · 다른 탭. 바탕은 불투명하다(뒤로 짙은 카드가 지나가도 라벨 대비가 그대로)">
    {SIZES.map((size) => (
      <DemoRow key={size} label={SIZE_LABEL[size]}>
        {(["unselected", "selected"] as const).map((selected) => (
          <Screen key={selected}>
            <Behind />
            <Specimen spec="bottom-navigation" combo={{ size, selected }}>
              <BottomNavigation
                compact={size === "compact"}
                aria-label={`주 메뉴 — ${selected}`}
              >
                <Items tab={selected === "selected" ? "home" : "calendar"} />
              </BottomNavigation>
            </Specimen>
          </Screen>
        ))}
      </DemoRow>
    ))}
  </DemoBlock>
);

const WorstDemo = () => (
  <DemoBlock title="가장 나쁜 값 — 알림 점 두 칸(최대) · 가장 좁은 폰 320 · 넓은 화면(480 으로 가운데) · 이름이 화면마다 다른 +">
    <DemoRow label="알림 점 · 320">
      <Screen width={320}>
        <Behind />
        <BottomNavigation compact={false} aria-label="주 메뉴 — 알림">
          <Items tab="home" notify={["ledger", "more"]} />
        </BottomNavigation>
      </Screen>
      <Screen width={320}>
        <Behind />
        <BottomNavigation compact aria-label="주 메뉴 — 알림 · 줄어듦">
          <Items tab="ledger" notify={["home", "more"]} />
        </BottomNavigation>
      </Screen>
    </DemoRow>
    <DemoRow label="넓은 화면 600">
      <Screen width={600}>
        <Behind />
        <BottomNavigation compact={false} aria-label="주 메뉴 — 넓은 화면">
          <Items tab="more" />
        </BottomNavigation>
      </Screen>
    </DemoRow>
  </DemoBlock>
);

// 직접 스크롤 — 아래로 20 이상 스크롤하면 줄어들고, 위로 28 이상이거나 맨 위 40 안이면 펴진다. 바를 누르면 펴진다
const ScrollDemo = () => {
  const [box, setBox] = useState<HTMLElement | null>(null);
  const [compact, setCompact] = useState(false);
  return (
    <DemoBlock
      title={`직접 스크롤 — 아래로 내리면 줄어들고 위로 올리면 펴진다(지금 ${compact ? "줄어듦" : "펼침"}) · 본문 아래 여백 = 바의 아래 자리 + 66 + 24`}
    >
      <DemoRow label="스크롤 상자">
        <Screen height={300}>
          <div
            ref={setBox}
            className="h-full overflow-y-auto"
            style={{ paddingBottom: BOTTOM_NAVIGATION_INSET }}
          >
            {Array.from({ length: 16 }, (_, i) => (
              <div
                key={i}
                className="mx-x4 mt-x2 rounded-r3 bg-bg-layer-default p-x4 text-t4 text-fg-neutral"
              >
                거래 {i + 1} · {(i + 1) * 3_700}원
              </div>
            ))}
          </div>
          <BottomNavigation
            scrollRoot={box}
            onCompactChange={setCompact}
            aria-label="주 메뉴 — 직접 스크롤"
          >
            <Items tab="ledger" />
          </BottomNavigation>
        </Screen>
      </DemoRow>
    </DemoBlock>
  );
};

const STATES = ["enabled", "pressed", "focused"] as const;

// 누름 — 바 가운데(+)를 누른다. 포커스 — 첫 칸에 키보드 포커스. 칸은 2px 축소만(색 그대로), + 는 누름 색
const StatesDemo = () => (
  <DemoBlock title="상태 — 기본 · 누름(가운데 +: 누름 색 + 2px 축소) · 키보드 포커스(칸 안쪽 링). 호버 모양은 없다">
    {SIZES.map((size) => (
      <DemoRow key={size} label={size === "regular" ? "펼침" : "줄어듦"}>
        {STATES.map((state) => (
          <div key={state} className="flex flex-col items-center gap-x1">
            <Screen width={320} height={120}>
              <Specimen
                spec="bottom-navigation"
                combo={{ size, selected: "unselected" }}
                state={state}
              >
                <BottomNavigation
                  compact={size === "compact"}
                  aria-label={`주 메뉴 — ${size} ${state}`}
                  {...(state === "focused" ? passFocus : {})}
                >
                  <Items tab="calendar" />
                </BottomNavigation>
              </Specimen>
            </Screen>
            <span className="text-t1 text-fg-neutral-subtle">{state}</span>
          </div>
        ))}
      </DemoRow>
    ))}
  </DemoBlock>
);

/** 카탈로그(/dev/ds) — 크기 × 고름 · 가장 나쁜 값 · 직접 스크롤 · 상태 */
export const BottomNavigationDemo = () => (
  <div className="flex flex-col gap-x8">
    <SizesDemo />
    <WorstDemo />
    <ScrollDemo />
    <StatesDemo />
  </div>
);
