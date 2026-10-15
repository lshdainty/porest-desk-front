import * as React from "react";
import { PanelLeft } from "lucide-react";

import { cn } from "@/shared/lib/cn";

import {
  ContentContext,
  isWideNow,
  measurePress,
  mergeRefs,
  prefersReducedMotion,
  RootContext,
  type RootContextValue,
  useBottomFog,
  useMedia,
  useRoot,
  widthDefault,
  writeStored,
} from "./side-navigation-context";
import {
  CONTENT,
  DESKTOP_QUERY,
  FOOTER,
  GROUP_DIVIDER,
  GROUP_LABEL,
  HEADER,
  LOGO,
  ROOT,
  ROOT_COLLAPSED,
  ROOT_EXPANDED,
  TRIGGER,
  WIDE_QUERY,
} from "./side-navigation-variants";

/*
 * Porest Side Navigation — 구조는 SEED Side Navigation(2026-10-04). 수치 원본은 porest-design specs/components/side-navigation.yaml
 * (값은 src/shared/ds/spec/side-navigation.json). recipes/shadcn/components/ui/side-navigation.tsx 를 첫 판으로 가져왔다.
 * 옛 Sidebar(shadcn — 256 · 48 · 모바일 Sheet · 항목 32 · ⌘B · 쿠키 · floating · inset)를 대신한다. 항목 · 하위 항목은 side-navigation-item.tsx.
 *
 *   SideNavigation           데스크톱(768 이상)의 주 메뉴 — <nav aria-label="주 메뉴">. collapsed · defaultCollapsed · onCollapsedChange
 *                            (손으로 다룰 때). 둘 다 주지 않으면 창 폭(768 ~ 1279 접힘 56 · 1280 이상 펼침 240) + 손으로 접은 기억
 *                            (localStorage "porest:side-navigation-collapsed")으로 정한다. 768 미만에서는 그리지 않는다 — Desk 는
 *                            Bottom Navigation, HR 은 ☰ 로 여는 왼쪽 Side Panel 에 SideNavigationContent 를 담는다
 *   SideNavigationHeader     머리 — logo(마크 + 서비스 이름, 누르지 않는다)와 접기 버튼(이름 "사이드바" · aria-expanded · aria-controls)
 *   SideNavigationContent    내용 — 이 안에서만 스크롤, 위 끝에서 떨어지면 머리 아래 1px 선, 아래 끝 24 늘 흐림. onNavigate(항목을 눌러
 *                            이동할 때 — 서랍을 닫는다). SideNavigation 밖(서랍)에서 쓰면 스스로 <nav aria-label="주 메뉴"> 가 되고 펼친 모양 —
 *                            스크롤 · 흐림은 Side Panel 본문이 맡는다
 *   SideNavigationGroup      묶음 — label(있을 때만 — 목록 ul 의 aria-labelledby). 접히면 이름은 보이지 않게 남고 묶음 사이에 1px 선
 *   SideNavigationItem       항목 — 하위가 없으면 링크: href · icon · label · current(aria-current="page") · disabled. 자식으로 SideNavigationSubItem 을
 *                            주면 부모(버튼 — 펼치기만, 이동하지 않는다): aria-expanded · aria-controls, defaultOpen, 하위가 current 면 저절로 펼친다
 *   SideNavigationSubItem    하위 항목(링크) — href · label · current · disabled. 아이콘 없이 이름만
 *   SideNavigationFooter     바닥 — 계정 · 보조 링크. 비면 그리지 않는다
 *
 * 폭 — 기본은 창 폭으로 정하고, 창 폭이 1280 을 넘나들면 다시 정한다(처음 열 때도 본다 — SEED 코드는 넘나들 때만). 1280 이상에서
 *   손으로 접고 펴면 기억해 다음에도 그 모양으로 연다. 768 ~ 1279 에서 손으로 편 것은 기억하지 않는다(다시 열면 접힌 채).
 *   펼침 ↔ 접힘 200ms easing(폭) — 이름은 접히기 시작할 때 사라지고 다 펴진 뒤 나타난다. 모션 줄이기면 바로 바뀐다.
 * 접혔을 때 — 하위가 없는 항목은 마우스를 올리면 200ms 뒤(키보드 초점이면 바로) 오른쪽에 이름 말풍선(shared/ds/tooltip — Help Bubble 툴팁,
 *   이름과 같은 글이라 aria-describedby 로 잇지 않는다). 하위가 있는 항목은 아이콘 옆 8(위 끝 맞춤 · 화면 끝과 8)에 펼침 메뉴 —
 *   Menu 와 같은 표면(폭 200 · 모서리 20 · s3 · 위아래 8) · 맨 위에 부모 이름 · 줄 44 · 지금 화면 줄은 지금 항목과 같은 바탕.
 *   1280 미만이어도 Menu Sheet 로 바꾸지 않는다 — Menu 의 1280 규칙의 예외(사용자 결정 2026-10-08).
 *   펼침 메뉴는 마우스를 올리면 200ms 뒤 열리고(다른 펼침 메뉴가 열려 있으면 바로) 트리거 · 메뉴를 모두 떠나면 100ms 뒤 닫힌다(옮겨 가는
 *   동안 닫히지 않는다). 누르거나 Enter · Space 로 열고 닫는다 — 키보드로 열면 첫 줄로 초점, 마우스 · 터치로 열면 옮기지 않는다.
 *   마우스로 열린 메뉴를 누르면 닫지 않고 붙들어 둔다(다시 누르면 닫는다). 열린 동안 부모에서 Tab 은 메뉴의 첫 줄로, 첫 줄에서 Shift+Tab 은
 *   부모로, 마지막 줄에서 Tab 은 부모 다음 칸으로 나가며 닫는다. Esc 는 닫고 초점을 부모로, 바깥 누르기 · 바깥으로 간 초점은 닫는다.
 *   펼침 메뉴는 디스클로저다 — role="menu" 를 쓰지 않고 role="group" + aria-labelledby(부모). 사이드바(nav) 안에 그려 주 메뉴의 링크로 남는다.
 *   한 번에 하나만 열린다. 쌓임은 z-floating 200(L3), 모션은 Menu 와 같다(150ms enter 로 0.95 → 1 · 투명도, 100ms exit).
 *
 * 모양: 흰 면 bg-layer-default + 오른쪽 안쪽 1px stroke-neutral-subtle(그림자 없음), 화면 왼쪽 · 높이 전체(sticky) — 본문과 따로 스크롤.
 *   머리 64 · 안쪽 8, 마크 24 + 이름 t5 16 / 22 · 700(화면 끝에서 16). 접기 버튼 40 · 아이콘 18 fg-neutral-subtle · 모서리 8 · 누르는 영역 44,
 *   위 12 · 오른쪽 12(접히면 8 — 56 의 가운데).
 *   내용 위 8 · 좌우 8 · 아래 24, 묶음 사이 8(접히면 1px 선 · 위아래 8 · 좌우 8). 묶음 이름 t4 14 / 19 · 700 · fg-neutral-muted · 안쪽 6.
 *   항목 최소 44 · 좌우 8 · 아이콘 20 fg-neutral-subtle ↔ 이름 12 · 이름 t4 · 500 · fg-neutral-muted · 위아래 6 · 모서리 10 — 긴 이름은 단어 단위로
 *   줄을 바꾼다(말줄임 없음). 접히면 항목 40(좌우 10 — 아이콘이 화면 끝에서 18). 꺾쇠 16 fg-neutral-subtle(펼치면 위로 300ms).
 *   하위 항목 최소 44 · 이름이 부모 이름과 같은 자리(40)에서 시작, 펼침 · 접힘은 높이 · 투명도 300ms(motion-duration-d6 — Accordion 과 같다,
 *   2026-10-10). 모션 줄이기면 높이를 움직이지 않고 150ms 서서히 나타나고 사라지며 꺾쇠는 바로 돈다.
 *   지금 항목 bg-neutral-weak-pressed + 아이콘 · 이름 fg-neutral(굵기 500 그대로 — 사용자 결정 2026-10-08). 접혔을 때는 하위가 지금인 부모가
 *   지금 항목이다. 지금 항목은 마우스를 올리거나 눌러도 바탕이 그대로다(그보다 짙은 불투명 역할이 없다).
 * 상태: 호버(웹) · 누름 bg-layer-default-pressed, 누르면 아이콘 · 이름만 2px 거리 축소(바탕은 그대로 — 모션 줄이기면 하지 않는다).
 *   키보드 포커스에만 항목 안쪽 2px 링(모서리 10). 막힌 항목은 fg-disabled · 바탕 없음 · 누르지 못한다(aria-disabled, 링크 주소 없음).
 *   펼침 메뉴의 줄 — 마우스를 올리면 좌우 8 들인 알약 bg-layer-floating-pressed(모서리 12), 누르면 글만 축소, 키보드 포커스는 알약 자리의 안쪽 링.
 *
 * 레시피와 다른 자리 — ① 문맥 · 훅 · 도우미는 side-navigation-context.ts, 클래스 · 상수는 -variants.ts, 항목 · 펼침 메뉴는 side-navigation-item.tsx.
 * ② 손 메모이제이션을 걷었다(React Compiler). ③ effect 안의 동기 setState 를 풀었다(lint react-hooks/set-state-in-effect) —
 *   창 폭이 1280 을 넘나들면 손으로 정한 값을 버리는 것은 "넘나든 것을 렌더에서 알아채 비우기"로, 이름 숨김은 "접힘 || 아직 다 펴지지 않음" +
 *   타이머로 푼다. 그래서 창 폭이 바뀌어 기본으로 돌아갈 때 onCollapsedChange 는 부르지 않는다(손으로 접고 펴는 것만 알린다).
 * ④ 말풍선은 shared/ds/tooltip 을 쓴다(레시피의 components/ui/tooltip).
 */

// ── 사이드바 ─────────────────────────────────────────────────
export interface SideNavigationProps extends React.HTMLAttributes<HTMLElement> {
  /** 접힘 — 주면 제어한다 */
  collapsed?: boolean;
  /** 처음 접힘 — 주면 창 폭 · 기억을 쓰지 않는다 */
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

const SideNavigation = React.forwardRef<HTMLElement, SideNavigationProps>(
  (
    {
      collapsed: collapsedProp,
      defaultCollapsed,
      onCollapsedChange,
      id: idProp,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const desktop = useMedia(DESKTOP_QUERY, true);
    const wide = useMedia(WIDE_QUERY, true);
    const controlled = collapsedProp !== undefined;
    const auto = !controlled && defaultCollapsed === undefined;

    // 손으로 정한 값 — 창 폭이 1280 을 넘나들면 버리고 기본으로 돌아간다(처음 열 때도 폭을 본다). defaultCollapsed 면 그 값에서 시작한다
    const [manual, setManual] = React.useState<boolean | null>(
      defaultCollapsed ?? null,
    );
    const [prevWide, setPrevWide] = React.useState(wide);
    if (prevWide !== wide) {
      setPrevWide(wide);
      if (auto) setManual(null);
    }
    const collapsed = controlled
      ? collapsedProp
      : (manual ?? widthDefault(wide));

    const toggle = () => {
      const next = !collapsed;
      // 1280 이상에서 손으로 접고 편 것만 기억한다 — 768 ~ 1279 는 다시 열면 접힌 채
      if (auto && isWideNow()) writeStored(next);
      if (!controlled) setManual(next);
      onCollapsedChange?.(next);
    };

    // 이름 — 접히기 시작하면 바로 숨기고(collapsed), 펴질 때는 다 펴진 뒤(200ms) 보인다. 모션 줄이기면 바로
    const [labelsShown, setLabelsShown] = React.useState(!collapsed);
    React.useEffect(() => {
      const duration =
        collapsed || prefersReducedMotion()
          ? 0
          : parseFloat(
              getComputedStyle(document.documentElement).getPropertyValue(
                "--motion-duration-d4",
              ),
            ) || 200;
      const timer = window.setTimeout(
        () => setLabelsShown(!collapsed),
        duration,
      );
      return () => window.clearTimeout(timer);
    }, [collapsed]);
    const labelsHidden = collapsed || !labelsShown;

    const [activeFlyout, setActiveFlyout] = React.useState<string | null>(null);
    const [portal, setPortal] = React.useState<HTMLElement | null>(null);
    const autoId = React.useId();
    const navId = idProp ?? `side-navigation${autoId}`;

    // 768 미만에서는 없다 — 하단 탭 바(Desk) · ☰ 주 메뉴(HR)
    if (!desktop) return null;
    const value: RootContextValue = {
      collapsed,
      labelsHidden,
      toggle,
      navId,
      portal,
      // 펴지면 펼침 메뉴는 없다(접힌 부모의 펼침 메뉴가 사라지면서 이 값도 비운다)
      activeFlyout: collapsed ? activeFlyout : null,
      setActiveFlyout,
    };
    return (
      <RootContext.Provider value={value}>
        <nav
          ref={mergeRefs(ref, setPortal)}
          id={navId}
          aria-label="주 메뉴"
          data-slot="side-navigation"
          data-collapsed={collapsed || undefined}
          className={cn(
            ROOT,
            collapsed ? ROOT_COLLAPSED : ROOT_EXPANDED,
            className,
          )}
          {...props}
        >
          {children}
        </nav>
      </RootContext.Provider>
    );
  },
);
SideNavigation.displayName = "SideNavigation";

// ── 머리 ─────────────────────────────────────────────────────
export interface SideNavigationHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 서비스 마크(24) + 이름("Porest Desk" · "Porest HR") — 누르지 않는다(홈은 첫 항목) */
  logo?: React.ReactNode;
}

const SideNavigationHeader = React.forwardRef<
  HTMLDivElement,
  SideNavigationHeaderProps
>(({ logo, className, children, ...props }, ref) => {
  const root = useRoot("SideNavigationHeader");
  return (
    <div
      ref={ref}
      data-slot="side-navigation-header"
      className={cn(HEADER, className)}
      {...props}
    >
      {logo != null && (
        <div
          data-slot="side-navigation-logo"
          className={cn(LOGO, root.labelsHidden && "hidden")}
        >
          {logo}
        </div>
      )}
      {children}
      <button
        type="button"
        aria-label="사이드바"
        aria-expanded={!root.collapsed}
        aria-controls={root.navId}
        data-slot="side-navigation-trigger"
        className={cn(TRIGGER, root.collapsed ? "right-x2" : "right-x3")}
        onPointerDown={(e) => measurePress(e.currentTarget)}
        onClick={root.toggle}
      >
        <PanelLeft aria-hidden />
      </button>
    </div>
  );
});
SideNavigationHeader.displayName = "SideNavigationHeader";

// ── 내용 ─────────────────────────────────────────────────────
export interface SideNavigationContentProps extends React.HTMLAttributes<HTMLElement> {
  /** 항목을 눌러 이동할 때 — 주 메뉴 서랍(Side Panel)을 닫는다 */
  onNavigate?: () => void;
}

const SideNavigationContent = React.forwardRef<
  HTMLElement,
  SideNavigationContentProps
>(({ onNavigate, className, onScroll, children, ...props }, ref) => {
  const root = React.useContext(RootContext);
  const own = React.useRef<HTMLElement | null>(null);
  useBottomFog(own, root !== null);
  // 위 끝에서 떨어졌다 — 머리 아래 선
  React.useLayoutEffect(() => {
    const el = own.current;
    if (el && root) el.toggleAttribute("data-scrolled", el.scrollTop > 0);
  });
  if (!root) {
    // 서랍(Side Panel) — 스스로 주 메뉴가 되고 펼친 모양. 스크롤 · 흐림은 Side Panel 본문이 맡는다
    return (
      <ContentContext.Provider value={{ onNavigate }}>
        <nav
          ref={ref}
          aria-label="주 메뉴"
          data-slot="side-navigation-content"
          data-standalone=""
          className={cn("flex flex-col gap-x2 font-sans", className)}
          {...props}
        >
          {children}
        </nav>
      </ContentContext.Provider>
    );
  }
  return (
    <ContentContext.Provider value={{ onNavigate }}>
      <div
        ref={mergeRefs(
          ref as React.Ref<HTMLDivElement>,
          own as React.Ref<HTMLDivElement>,
        )}
        data-slot="side-navigation-content"
        className={cn(
          CONTENT,
          root.labelsHidden ? "gap-0" : "gap-x2",
          className,
        )}
        onScroll={(e) => {
          e.currentTarget.toggleAttribute(
            "data-scrolled",
            e.currentTarget.scrollTop > 0,
          );
          onScroll?.(e);
        }}
        {...(props as React.HTMLAttributes<HTMLDivElement>)}
      >
        {children}
      </div>
    </ContentContext.Provider>
  );
});
SideNavigationContent.displayName = "SideNavigationContent";

// ── 묶음 ─────────────────────────────────────────────────────
export interface SideNavigationGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 묶음 이름 — 성격이 다른 항목을 나눌 때만(짧은 명사) */
  label?: React.ReactNode;
}

const SideNavigationGroup = React.forwardRef<
  HTMLDivElement,
  SideNavigationGroupProps
>(({ label, className, children, ...props }, ref) => {
  const root = React.useContext(RootContext);
  const labelId = React.useId();
  const hidden = root?.labelsHidden ?? false;
  return (
    <div
      ref={ref}
      data-slot="side-navigation-group"
      className={cn("flex flex-col", hidden && GROUP_DIVIDER, className)}
      {...props}
    >
      {label != null && (
        <div
          id={labelId}
          data-slot="side-navigation-group-label"
          className={hidden ? "sr-only" : GROUP_LABEL}
        >
          {label}
        </div>
      )}
      <ul
        aria-labelledby={label != null ? labelId : undefined}
        className="m-0 flex list-none flex-col p-0"
      >
        {children}
      </ul>
    </div>
  );
});
SideNavigationGroup.displayName = "SideNavigationGroup";

// ── 바닥 ─────────────────────────────────────────────────────
const SideNavigationFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  if (React.Children.toArray(children).length === 0) return null;
  return (
    <div
      ref={ref}
      data-slot="side-navigation-footer"
      className={cn(FOOTER, className)}
      {...props}
    >
      {children}
    </div>
  );
});
SideNavigationFooter.displayName = "SideNavigationFooter";

export {
  SideNavigation,
  SideNavigationContent,
  SideNavigationFooter,
  SideNavigationGroup,
  SideNavigationHeader,
};
