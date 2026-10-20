import {
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type ReactNode,
} from "react";
import {
  Bell,
  CalendarDays,
  ClipboardList,
  LayoutGrid,
  Settings,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { DemoBlock, DemoRow, Specimen } from "@/shared/ds/catalog/DemoKit";

import {
  SideNavigation,
  SideNavigationContent,
  SideNavigationFooter,
  SideNavigationGroup,
  SideNavigationHeader,
} from "./side-navigation";
import {
  SideNavigationItem,
  SideNavigationSubItem,
} from "./side-navigation-item";

/*
 * 카탈로그(/dev/ds) — 768 이상에서만 보인다(사이드바는 768 미만에서 그려지지 않는다 — 폰은 Bottom Navigation · Side Panel).
 * 사이드바는 높이 전체(h-dvh)라 칸(Screen)에 가둔다 — 칸의 높이를 따르게 h-full 로 덮었다.
 */

// 링크는 견본 안에서 어디로도 가지 않는다 — 검사기가 눌렀다 떼면 클릭이 되어 주소가 바뀐다
const stay = (e: { preventDefault: () => void }) => e.preventDefault();

type Current = "none" | "current";

const Screen = ({
  children,
  width,
  height,
  boxRef,
}: {
  children: ReactNode;
  width: number;
  height?: number;
  boxRef?: React.Ref<HTMLDivElement>;
}) => (
  <div
    ref={boxRef}
    // transform 이 fixed(펼침 메뉴 · 말풍선)의 기준을 이 칸으로 가둔다
    className="relative shrink-0 overflow-hidden rounded-r3 border border-stroke-neutral-subtle bg-bg-layer-basement"
    style={{ width, height, transform: "translateZ(0)" }}
  >
    {children}
  </div>
);

// 검사기가 견본 뿌리(사이드바)에 준 키보드 포커스를 첫 단추로 넘긴다 — 사이드바는 초점을 받지 않는다(컴포넌트는 그대로다)
const passFocus = {
  tabIndex: -1,
  onFocus: (e: FocusEvent<HTMLElement>) => {
    if (e.target !== e.currentTarget) return;
    e.currentTarget.querySelector<HTMLElement>("a, button")?.focus({
      preventScroll: true,
    });
  },
};

const Mark = () => (
  <svg viewBox="0 0 24 24" aria-hidden>
    <rect width="24" height="24" rx="6" className="fill-bg-brand-solid" />
    <path
      d="M7 17V7h5a3 3 0 0 1 0 6H7"
      className="fill-none stroke-static-white"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const Logo = () => (
  <>
    <Mark />
    그루 담다
  </>
);

// 하위 항목은 SideNavigationItem 의 직접 자식이어야 한다(부모가 자식의 current 를 읽는다) — 컴포넌트로 감싸지 않고 배열로 돌려준다
const brokers = (current: Current = "none") => [
  <SideNavigationSubItem
    key="namu"
    href="#namu"
    label="나무증권"
    current={current === "current"}
    onClick={stay}
  />,
  <SideNavigationSubItem
    key="toss"
    href="#toss"
    label="토스증권"
    onClick={stay}
  />,
];

// 묶음 둘 · 하위가 있는 증권 · 바닥 — "지금 항목" 견본은 첫 항목(홈)이 지금 화면이다
const FullNav = ({
  collapsed,
  current,
}: {
  collapsed: boolean;
  current: Current;
}) => (
  <SideNavigation collapsed={collapsed} className="h-full">
    <SideNavigationHeader logo={<Logo />} />
    <SideNavigationContent>
      <SideNavigationGroup label="워크스페이스">
        <SideNavigationItem
          href="#home"
          icon={<LayoutGrid />}
          label="홈"
          current={current === "current"}
          onClick={stay}
        />
        <SideNavigationItem
          href="#assets"
          icon={<Wallet />}
          label="자산"
          onClick={stay}
        />
        <SideNavigationItem icon={<TrendingUp />} label="증권">
          {brokers()}
        </SideNavigationItem>
        <SideNavigationItem
          href="#ledger"
          icon={<ClipboardList />}
          label="가계부"
          onClick={stay}
        />
      </SideNavigationGroup>
      <SideNavigationGroup label="기록">
        <SideNavigationItem
          href="#calendar"
          icon={<CalendarDays />}
          label="캘린더"
          onClick={stay}
        />
      </SideNavigationGroup>
    </SideNavigationContent>
    <SideNavigationFooter>
      <div className="flex min-h-11 items-center gap-x3 px-x2 text-t4 text-fg-neutral-muted">
        <Settings className="size-5 shrink-0 text-fg-neutral-subtle" />
        {!collapsed && "설정"}
      </div>
    </SideNavigationFooter>
  </SideNavigation>
);

const MatrixDemo = () => (
  <DemoBlock title="펼침 240 · 접힘 56 × 지금 항목 — 머리(마크 · 이름 · 접기 버튼) · 묶음 · 항목 · 하위가 있는 증권 · 바닥. 접히면 이름이 사라지고 묶음 사이에 선">
    {(["expanded", "collapsed"] as const).map((collapsed) => (
      <DemoRow
        key={collapsed}
        label={collapsed === "expanded" ? "펼침 240" : "접힘 56"}
      >
        {(["none", "current"] as const).map((current) => (
          <Screen
            key={current}
            width={collapsed === "expanded" ? 240 : 56}
            height={400}
          >
            <Specimen spec="side-navigation" combo={{ collapsed, current }}>
              <FullNav
                collapsed={collapsed === "collapsed"}
                current={current}
              />
            </Specimen>
          </Screen>
        ))}
      </DemoRow>
    ))}
  </DemoBlock>
);

// 접힌 부모를 눌러 연 펼침 메뉴 — 눌러 붙든(pinned) 모양으로 늘 열어 둔다(마우스를 올려 여는 것은 200ms 뒤 · 떠나면 100ms 뒤 닫힌다).
// 바깥을 누르거나 Esc 로 닫히면 곧 다시 연다 — 검사기가 다른 견본을 누른 뒤에도 이 견본이 열려 있게
const KeepFlyoutOpen = ({ children }: { children: ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const open = () => {
      const button = ref.current?.querySelector<HTMLButtonElement>(
        "[data-slot=side-navigation-item][data-parent]",
      );
      // detail 1 — 마우스로 누른 것(초점을 첫 줄로 옮기지 않는다)
      if (button && button.getAttribute("aria-expanded") !== "true")
        button.dispatchEvent(
          new MouseEvent("click", { bubbles: true, detail: 1 }),
        );
    };
    const first = window.setTimeout(open, 0);
    const timer = window.setInterval(open, 600);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, []);
  return <div ref={ref}>{children}</div>;
};

const FlyoutDemo = () => (
  <DemoBlock title="접힌 사이드바 — 하위가 있는 항목은 오른쪽에 펼침 메뉴(Menu 표면 · 폭 200 · 줄 44 · 지금 화면 줄은 지금 항목 바탕). 하위가 없는 항목은 마우스를 올리면 이름 말풍선">
    <DemoRow label="펼침 메뉴">
      {(["none", "current"] as const).map((current) => (
        <KeepFlyoutOpen key={current}>
          <Screen width={340} height={200}>
            <Specimen
              spec="side-navigation"
              combo={{ collapsed: "collapsed", current }}
            >
              <SideNavigation collapsed className="h-full">
                <SideNavigationContent>
                  <SideNavigationGroup>
                    <SideNavigationItem icon={<TrendingUp />} label="증권">
                      {brokers(current)}
                    </SideNavigationItem>
                    <SideNavigationItem
                      href="#assets"
                      icon={<Wallet />}
                      label="자산"
                      onClick={stay}
                    />
                  </SideNavigationGroup>
                </SideNavigationContent>
              </SideNavigation>
            </Specimen>
          </Screen>
        </KeepFlyoutOpen>
      ))}
    </DemoRow>
  </DemoBlock>
);

const STATES = [
  "enabled",
  "hovered",
  "pressed",
  "focused",
  "open",
  "disabled",
] as const;
type State = (typeof STATES)[number];

// 항목 하나(또는 접기 버튼 하나)만 있는 작은 사이드바 — 가운데가 그 단추라 검사기가 올리고 누를 수 있다. 실제 화면의 사이드바가 아니라 상태를 재는 견본이다
const ItemStateNav = ({
  collapsed,
  current,
  state,
}: {
  collapsed: boolean;
  current: Current;
  state: State;
}) => (
  <Specimen
    spec="side-navigation"
    combo={{ collapsed: collapsed ? "collapsed" : "expanded", current }}
    state={state}
  >
    <SideNavigation
      collapsed={collapsed}
      className="h-auto"
      {...(state === "focused" ? passFocus : {})}
    >
      <SideNavigationContent>
        <SideNavigationGroup>
          <SideNavigationItem
            href="#home"
            icon={<LayoutGrid />}
            label="홈"
            current={current === "current"}
            disabled={state === "disabled"}
            onClick={stay}
          />
          {/* 펼침 — 홈(첫 항목) 아래에 하위가 펼쳐진 부모를 둔다. 하위가 지금이어도 펼친 부모는 지금 항목이 아니다 */}
          {state === "open" && !collapsed && (
            <SideNavigationItem icon={<TrendingUp />} label="증권" defaultOpen>
              {brokers()}
            </SideNavigationItem>
          )}
        </SideNavigationGroup>
      </SideNavigationContent>
    </SideNavigation>
  </Specimen>
);

const TriggerStateNav = ({ state }: { state: State }) => (
  <Specimen
    spec="side-navigation"
    combo={{ collapsed: "collapsed", current: "none" }}
    state={state}
  >
    <SideNavigation
      collapsed
      className="h-auto"
      {...(state === "focused" ? passFocus : {})}
    >
      <SideNavigationHeader logo={<Logo />} />
    </SideNavigation>
  </Specimen>
);

const StatesDemo = () => (
  <DemoBlock title="상태 — 기본 · 호버(누름과 같은 바탕, 지금 항목은 그대로) · 누름(바탕 + 아이콘 · 이름 2px 축소) · 포커스(안쪽 링) · 펼침(꺾쇠 위로) · 막힘(fg-disabled)">
    {(
      [
        { collapsed: false, current: "none" },
        { collapsed: false, current: "current" },
        { collapsed: true, current: "none" },
        { collapsed: true, current: "current" },
      ] as const
    ).map(({ collapsed, current }) => (
      <DemoRow
        key={`${collapsed}-${current}`}
        label={`${collapsed ? "접힘" : "펼침"} · ${current === "current" ? "지금 항목" : "다른 항목"}`}
      >
        {STATES.filter((s) => s !== "open" || !collapsed).map((state) => (
          <div key={state} className="flex flex-col items-center gap-x1">
            <Screen width={collapsed ? 56 : 240}>
              <ItemStateNav
                collapsed={collapsed}
                current={current}
                state={state}
              />
            </Screen>
            <span className="text-t1 text-fg-neutral-subtle">{state}</span>
          </div>
        ))}
      </DemoRow>
    ))}
    <DemoRow label="접기 버튼">
      {(["enabled", "hovered", "pressed", "focused"] as const).map((state) => (
        <div key={state} className="flex flex-col items-center gap-x1">
          <Screen width={56}>
            <TriggerStateNav state={state} />
          </Screen>
          <span className="text-t1 text-fg-neutral-subtle">{state}</span>
        </div>
      ))}
    </DemoRow>
  </DemoBlock>
);

// 직접 접고 펴기 — 머리의 접기 버튼. 폭이 200ms 로 바뀌고 이름은 접히기 시작할 때 사라지고 다 펴진 뒤 나타난다
const LiveDemo = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [current, setCurrent] = useState("home");
  const item = (id: string, label: string, icon: ReactNode) => (
    <SideNavigationItem
      href={`#${id}`}
      icon={icon}
      label={label}
      current={current === id}
      onClick={(e) => {
        e.preventDefault();
        setCurrent(id);
      }}
    />
  );
  return (
    <DemoBlock title="직접 접고 펴기 — 접기 버튼(이름 사이드바) · 항목을 누르면 지금 항목이 옮겨 간다 · 하위가 지금이면 부모가 저절로 펼쳐진다. 접으면 말풍선 · 펼침 메뉴">
      <DemoRow label="접기 · 펴기">
        <Screen width={520} height={400}>
          <SideNavigation
            collapsed={collapsed}
            onCollapsedChange={setCollapsed}
            className="h-full"
          >
            <SideNavigationHeader logo={<Logo />} />
            <SideNavigationContent>
              <SideNavigationGroup label="워크스페이스">
                {item("home", "홈", <LayoutGrid />)}
                {item("assets", "자산", <Wallet />)}
                <SideNavigationItem icon={<TrendingUp />} label="증권">
                  <SideNavigationSubItem
                    href="#namu"
                    label="나무증권"
                    current={current === "namu"}
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrent("namu");
                    }}
                  />
                  <SideNavigationSubItem
                    href="#toss"
                    label="토스증권"
                    current={current === "toss"}
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrent("toss");
                    }}
                  />
                </SideNavigationItem>
              </SideNavigationGroup>
              <SideNavigationGroup label="기록">
                {item("calendar", "캘린더", <CalendarDays />)}
              </SideNavigationGroup>
            </SideNavigationContent>
          </SideNavigation>
        </Screen>
      </DemoRow>
    </DemoBlock>
  );
};

// 가장 나쁜 값 — 긴 이름은 줄을 바꾼다(말줄임 없음) · 항목이 넘치면 내용만 스크롤(머리 아래 선 · 아래 끝 흐림) · 막힌 항목 · 긴 묶음 이름
const NAMES = [
  "아주 긴 항목 이름이 줄을 바꾸는 경우를 보는 항목",
  "홈",
  "신용카드 결제 예정 내역 전체 보기",
  "자산",
  "가계부",
  "예산",
  "통계",
  "캘린더",
  "할 일",
  "더치페이",
  "설정",
];
const WorstDemo = () => {
  const box = useRef<HTMLDivElement>(null);
  // 스크롤한 모양 — 머리 아래 선이 나타난다
  useEffect(() => {
    const content = box.current?.querySelector<HTMLElement>(
      "[data-slot=side-navigation-content]",
    );
    if (content) content.scrollTop = 60;
  }, []);
  return (
    <DemoBlock title="가장 나쁜 값 — 긴 이름 줄바꿈 · 항목이 넘쳐 스크롤(머리 아래 선 · 아래 끝 흐림 24) · 막힌 항목 · 긴 묶음 이름">
      <DemoRow label="넘침 · 긴 이름">
        <Screen width={240} height={360} boxRef={box}>
          <SideNavigation collapsed={false} className="h-full">
            <SideNavigationHeader logo={<Logo />} />
            <SideNavigationContent>
              <SideNavigationGroup label="워크스페이스 전체 메뉴 이름이 아주 긴 묶음">
                {NAMES.map((name, i) => (
                  <SideNavigationItem
                    key={name}
                    href={`#n${i}`}
                    icon={<Bell />}
                    label={name}
                    current={i === 1}
                    disabled={i === 3}
                    onClick={stay}
                  />
                ))}
              </SideNavigationGroup>
            </SideNavigationContent>
          </SideNavigation>
        </Screen>
        <Screen width={56} height={360}>
          <SideNavigation collapsed className="h-full">
            <SideNavigationHeader logo={<Logo />} />
            <SideNavigationContent>
              <SideNavigationGroup label="워크스페이스">
                {NAMES.slice(0, 5).map((name, i) => (
                  <SideNavigationItem
                    key={name}
                    href={`#c${i}`}
                    icon={<Bell />}
                    label={name}
                    current={i === 1}
                    onClick={stay}
                  />
                ))}
              </SideNavigationGroup>
              <SideNavigationGroup label="기록">
                <SideNavigationItem
                  href="#c9"
                  icon={<CalendarDays />}
                  label="캘린더"
                  onClick={stay}
                />
              </SideNavigationGroup>
            </SideNavigationContent>
          </SideNavigation>
        </Screen>
      </DemoRow>
    </DemoBlock>
  );
};

/** 카탈로그(/dev/ds) — 펼침 · 접힘 × 지금 항목 · 접힌 펼침 메뉴 · 상태 · 직접 접고 펴기 · 가장 나쁜 값 */
export const SideNavigationDemo = () => (
  <div className="flex flex-col gap-x8">
    <MatrixDemo />
    <FlyoutDemo />
    <StatesDemo />
    <LiveDemo />
    <WorstDemo />
  </div>
);
