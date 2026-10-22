import * as React from "react";
import { flushSync } from "react-dom";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import type { VariantProps } from "class-variance-authority";

import {
  ChipLabel,
  chipVariants,
  isPressKey,
  measurePress,
} from "@/shared/ds/chip";
import { useScrollFog } from "@/shared/ds/scroll-fog";
import { cn } from "@/shared/lib/cn";

import {
  EDGE_FOLLOW,
  COMMIT_WAIT,
  FLICK_DISTANCE,
  FLICK_SPEED,
  SWIPE_DISTANCE,
  SWIPE_SLOP,
  blocksSwipe,
  clearSwipe,
  moveTo,
  panesOf,
  resetPanel,
  setPeek,
  slide,
  speedOf,
  type Commit,
  type Drag,
} from "./tabs-swipe";
import {
  CHIP_TABS_NOTIFICATION,
  CHIP_VARIANT,
  TABS_CONTENT,
  TABS_INDICATOR,
  TABS_NOTIFICATION,
  TABS_SWIPE_AREA,
  chipTabsListVariants,
  placeIndicator,
  prefersReducedMotion,
  revealSelected,
  tabsListVariants,
  tabsTriggerVariants,
  type ChipTabsSize,
  type ChipTabsVariant,
  type LineLayout,
  type LineSize,
  type PlacedBar,
} from "./tabs-variants";
import { useDsText } from "@/shared/ds/i18n";

/*
 * Groo Tabs — 구조는 SEED Tabs(2026-10-02). 수치 원본은 groo-design specs/components/tabs.yaml(Line) · chip-tabs.yaml(Chip Tabs)
 * (값은 src/shared/ds/spec/tabs.json · chip-tabs.json). groo-design recipes/shadcn/components/ui/tabs.tsx 를 첫 판으로 가져왔다 —
 * 클래스 · 상수 · 순수 헬퍼는 tabs-variants.ts · tabs-swipe.ts 다(컴포넌트 파일은 컴포넌트만 내보낸다 — 빠른 새로 고침).
 *
 *   Tabs                             값을 쥔 묶음(Radix Tabs). ← → 로 옮기면 바로 고르고(자동), 끝에서 처음으로 돈다.
 *                                    막힌 탭은 건너뛴다. Home · End 는 첫 · 마지막 탭(막히지 않은)
 *   TabsList · TabsTrigger           Line — 화면 · 구역 맨 위의 1차 탭
 *   ChipTabsList · ChipTabsTrigger   Chip Tabs — 1차 탭 안의 2차 탭. 칩 하나는 Chip(chipVariants) 그대로
 *   TabsContent                      내용 칸(tabpanel) — 모두 그려 두고 고르지 않은 칸은 숨긴다
 *   TabsSwipeArea                    폰 1차 탭의 내용 칸 묶음 — 내용을 옆으로 밀어 이웃 탭으로 넘긴다
 *
 * Line
 *   layout   fill(기본 — 칸을 똑같이 나눈다, 막대는 탭에서 좌우 16 들인다) ·
 *            hug(탭이 글 + 좌우 10 · 목록 좌우 16, 넘치면 가로 스크롤 — 스크롤바는 숨긴다. 막대는 탭 폭 그대로)
 *   size     small 40 · 글 t4 14(기본) · medium 44 · 글 t5 16
 * 목록은 놓인 폭을 채우고 바탕이 불투명하다(bg-layer-default). 바닥 구획 선은 안쪽 1px(inset shadow)이라 높이를 밀지 않는다.
 * 탭은 위아래 · 좌우 10 이고 글을 아래로 붙인다 — 크기와 관계없이 막대와 글 사이가 10 이다. 글은 고르든 안 고르든 700 이고
 * 줄바꿈 · 말줄임하지 않는다. 고르면 글자색만 fg-neutral-subtle → fg-neutral 로 바로 바뀐다(전환 없음).
 * 막대는 목록에 하나 — 2px · fg-neutral · 끝이 각지다. 고른 탭의 offsetLeft · offsetWidth 를 재서 놓고(값이 바뀔 때 · 목록 ·
 * 탭 크기가 바뀔 때 · 글꼴을 다 불러왔을 때), 고른 탭이 바뀌면 left · width 로 200ms 미끄러진다(motion-duration-d4 ·
 * motion-ease-easing — 200ms 이하는 마이크로 모션이라 모션 줄이기에도 그대로다). 크기가 바뀌어 다시 놓을 때는 바로 놓는다.
 * 호버 모양은 없다. 누르면 탭만 2px 거리로 준다(SEED scaleScope: self · v104) — 배율 = (기준 − 2) ÷ 기준,
 * 기준 = max(높이, 폭 ÷ 4, 24) 를 누르는 순간(포인터 · Space · Enter) 잰다. 색은 그대로다 — 글자색이 이미 고름을 말하므로
 * 누르는 동안 색이 바뀌면 손을 떼기 전에 고른 것처럼 보인다. 모션 줄이기면 축소하지 않는다.
 * 포커스 링은 키보드 포커스에만 탭 안쪽 2px(띄움 −2 · 각진 모서리 — 이웃 탭 · 바닥 선에 걸리지 않는다). 막대 위에 그린다.
 * 막힌 탭은 fg-disabled · not-allowed · 축소 없음. 고른 탭이 막히면(목록 전체를 막을 때) 막대도 fg-disabled 다.
 * 알림 점(notification)은 6px fg-brand(브랜드 글자색 — bg-brand-solid 는 다크 바탕에서 안 보인다) — 글 끝에서 2 · 글 위쪽에
 * 띄워 탭 폭을 넓히지 않는다. 보조 기술에는 "새 소식" 을 덧붙인다(점만으로 알리지 않는다). 고른 탭에는 점도 "새 소식" 도 없다
 * (내용을 보면 사라진다). 한 목록에 하나만 단다(둘 이상이면 개발 중에 경고). Fill 목록이 넘치면(글이 칸을 넘으면) 개발 중에
 * 경고한다 — Hug 로 바꾼다.
 *
 * Chip Tabs
 *   variant  solid(기본 — 화면 전체를 바꾸는 2차 탭, Chip Solid) · outline(일부를 바꾸는 2차 탭, Chip Outline Strong)
 *   size     medium 36(기본) · large 40
 * 목록은 바탕 · 바닥 선 없이 한 줄 가로 스크롤이다 — 좌우 화면 여백 24 · 위아래 8 · 칩 사이 8, 스크롤바는 숨긴다. 양 끝은 늘
 * 흐린다(Scroll Fog row — gradient-fade-mask 좌우 20, 스크롤 위치 · 넘침과 상관없이) — 여백 24 가 흐림보다 넓어 처음 · 끝 칩은 흐리지
 * 않는다. 흐림은 마스크라 흐린 자리의 칩도 그대로 눌린다.
 * 칩은 chipVariants 를 그대로 쓴다(누름 · 호버 · 포커스 · 비활성 · 누르는 영역 44 모두 Chip 과 같다). chipVariants 는
 * data-state="checked" · data-selected 로 고름(짙은 채움)을 칠하는데 Radix 탭은 data-state="active" 를 달므로, 고른 탭에
 * data-selected 를 단다. 알림 점(fg-brand)은 글 뒤에 칩의 사이 6 을 두고 세로 가운데 — 칩 폭이 그만큼 넓어진다. 고른 칩(짙은
 * 채움)에는 없다.
 *
 * 공통
 * Hug · Chip Tabs 는 고른 탭이 목록 밖이면 가장자리에서 scroll-padding(Hug 16 · Chip Tabs 24) 띄워 가까운 쪽으로 목록만 스크롤한다 — 페이지는
 * 움직이지 않는다. 처음 그릴 때는 바로, 그 뒤로는 부드럽게(모션 줄이기면 바로).
 * 고른 탭만 Tab 이 선다(tabIndex 0) — 값이 밀어 넘기기 · 주소로 바뀌어도 Radix 의 로빙 위치가 옛 탭에 남지 않는다. 다음
 * Tab 은 내용 칸(tabIndex 0)으로 간다. 목록에 보이는 제목이 없으면 aria-label 을 준다(이름이 없으면 개발 중에 경고).
 * value 는 글이 아니라 바뀌지 않는 id 다 — Radix 가 value 로 탭 · 내용 칸의 id 를 만들어 aria-controls · aria-labelledby 로
 * 잇는데, 빈칸이 있으면 그 연결이 깨진다(빈칸이 있으면 개발 중에 경고).
 * 내용 칸은 바로 바뀐다(애니메이션 없음). 칸은 모두 그려 두고(forceMount) 고르지 않은 칸을 display: none 으로 숨겨, 다른
 * 탭을 다녀와도 칸 안의 스크롤 · 입력이 그대로다. 페이지(window) 스크롤은 칸마다 따로 남지 않는다.
 * 내용 칸의 키보드 포커스 링은 탭과 같이 안쪽 2px 다(칸이 화면 폭을 채워 바깥 링은 잘린다).
 *
 * TabsSwipeArea — 폰에서 화면 전체를 바꾸는 1차 탭만 둔다(2차 탭 · Segmented 에는 없다). 거친 포인터(손가락)에서만 내용을
 * 가로로 끌면 고른 칸이 손을 따라 움직이고 이웃 칸이 옆에서 들어온다. 손을 떼면 칸 폭의 25% 를 넘었거나 빠르게 튕겼을 때
 * (0.4px/ms 이상 · 24 이상) 이웃 탭(막힌 탭은 건너뛴다)으로 넘어가며 200ms 에 마저 미끄러지고, 아니면 제자리로 돌아온다.
 * 값은 손을 뗄 때 바뀐다 — 막대 · 글자색이 칸과 함께 옮겨 간다. 이웃이 없는 쪽은 손의 1/3 만 따라온다.
 * 세로 스크롤은 그대로다(touch-action: pan-y pinch-zoom — 확대도 막지 않는다). 가로로 스크롤하는 칸 · data-tabs-prevent-swipe
 * 를 단 요소(탭 목록은 스스로 단다) · 입력칸 · 슬라이더에서 시작한 끌기는 넘기지 않는다. 모션 줄이기면 손을 따라 움직이는 것은
 * 그대로 두고(직접 조작), 손을 뗀 뒤 미끄러지지 않고 바로 바뀐다. 제어 컴포넌트가 값을 받지 않으면(300ms) 제자리로 돌아온다.
 *
 * 웹은 1차 탭을 주소에 남긴다 — 뒤로 가기 · 링크 · 새로고침이 같은 탭을 연다. 값은 라우터가 쥐고 Tabs 는 받기만 한다
 * (react-router 예 — replace 라 탭을 오가도 방문 기록이 쌓이지 않고, 뒤로 가기는 앞 화면으로 간다):
 *
 *   const [params, setParams] = useSearchParams();
 *   const tab = params.get("tab") ?? "category";
 *   <Tabs value={tab} onValueChange={(v) => setParams((p) => { p.set("tab", v); return p; }, { replace: true })}>
 *     <TabsList aria-label="통계">
 *       <TabsTrigger value="category">카테고리</TabsTrigger>
 *       <TabsTrigger value="trend">추이</TabsTrigger>
 *     </TabsList>
 *     <TabsSwipeArea>
 *       <TabsContent value="category">…</TabsContent>
 *       <TabsContent value="trend">…</TabsContent>
 *     </TabsSwipeArea>
 *   </Tabs>
 */

const useIsoLayoutEffect =
  typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

function mergeRefs<T>(...refs: (React.Ref<T> | undefined)[]) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as React.MutableRefObject<T | null>).current = node;
    }
  };
}

// ── 값 ───────────────────────────────────────────────────────
// Radix Tabs 위에서 값을 한 번 더 쥔다 — 막대 · 목록 스크롤 · 칩 탭의 고른 모습 · 밀어 넘기기가 고른 값을 알아야 한다
type TabsValue = { value: string; setValue: (value: string) => void };
const TabsValueContext = React.createContext<TabsValue | null>(null);

function useTabsValue(component: string) {
  const ctx = React.useContext(TabsValueContext);
  if (!ctx) throw new Error(`[Tabs] ${component} 는 Tabs 안에 둔다.`);
  return ctx;
}

// Radix Tabs 는 마우스를 누르는 순간(mousedown) 탭을 고른다 — 그러면 누르는 동안 글자색 · 칩 모양이 손을 떼기 전에 고른 것처럼
// 바뀐다(스펙: 누르면 축소만, 색은 그대로 — Foundation Feedback). 그래서 누르는 순간의 고르기를 막고 손을 뗄 때(click)에 고른다.
// 포커스도 누르는 순간 옮기지 않고(preventDefault) 손을 뗄 때 옮긴다. 키보드는 Radix 그대로다(화살표 · Home · End · Enter · Space).
function pressSelect(
  value: string,
  setValue: (value: string) => void,
  handlers: {
    onMouseDown?: React.MouseEventHandler<HTMLButtonElement>;
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
  },
) {
  return {
    onMouseDown: (e: React.MouseEvent<HTMLButtonElement>) => {
      handlers.onMouseDown?.(e);
      e.preventDefault();
    },
    onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
      handlers.onClick?.(e);
      if (e.defaultPrevented || e.currentTarget.disabled) return;
      // 고른 값이 그려진 다음에 포커스를 옮긴다 — 그 전에 옮기면 Radix 의 포커스 고르기가 같은 값을 한 번 더 알린다
      const el = e.currentTarget;
      flushSync(() => setValue(value));
      el.focus();
    },
  };
}

export type TabsProps = Omit<
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>,
  "activationMode" | "orientation"
>;

// 묶음 — 화살표로 옮기면 바로 고른다(activationMode automatic), 가로 하나뿐이다
const Tabs = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Root>,
  TabsProps
>(({ value: valueProp, defaultValue, onValueChange, ...props }, ref) => {
  const [inner, setInner] = React.useState(defaultValue ?? "");
  const controlled = valueProp !== undefined;
  const value = controlled ? valueProp : inner;
  const setValue = (next: string) => {
    if (!controlled) setInner(next);
    onValueChange?.(next);
  };
  return (
    <TabsValueContext.Provider value={{ value, setValue }}>
      <TabsPrimitive.Root
        ref={ref}
        data-slot="tabs"
        {...props}
        value={value}
        onValueChange={setValue}
        activationMode="automatic"
        orientation="horizontal"
      />
    </TabsValueContext.Provider>
  );
});
Tabs.displayName = "Tabs";

// ── 목록 공통 ─────────────────────────────────────────────────
function useRevealSelected(
  listRef: React.RefObject<HTMLElement | null>,
  value: string,
  enabled: boolean,
) {
  const first = React.useRef(true);
  useIsoLayoutEffect(() => {
    const list = listRef.current;
    if (!list || !enabled) return;
    revealSelected(list, !first.current);
    first.current = false;
  }, [listRef, value, enabled]);
}

// 개발 중에만 — 이름 없는 목록 · 알림 점 둘 이상 · 넘치는 Fill 목록 · 빈칸 있는 value 를 알린다(같은 경고는 한 번만)
function useListChecks(
  listRef: React.RefObject<HTMLElement | null>,
  component: string,
  fill: boolean,
  label?: string,
  labelledBy?: string,
) {
  const warned = React.useRef(new Set<string>());
  React.useEffect(() => {
    if (!import.meta.env.DEV) return;
    const list = listRef.current;
    if (!list) return;
    const warn = (key: string, message: string) => {
      if (warned.current.has(key)) return;
      warned.current.add(key);
      console.warn(`[Tabs] ${message}`, list);
    };
    if (
      !list.getAttribute("aria-label")?.trim() &&
      !list.getAttribute("aria-labelledby")?.trim()
    ) {
      warn(
        "name",
        `${component} 에 이름이 없다 — 보이는 제목이 있으면 aria-labelledby, 없으면 aria-label 을 준다(예: "통계").`,
      );
    }
    if (list.querySelectorAll(":scope > [data-notification]").length > 1) {
      warn("notification", "알림 점이 둘 이상이다 — 새 소식은 한 탭에만 단다.");
    }
    if (fill && list.scrollWidth > list.clientWidth + 1) {
      warn(
        "overflow",
        'Fill 목록이 넘친다 — 탭이 6개 이상이거나 글이 칸을 넘으면 layout="hug" 로 둔다.',
      );
    }
    const spaced = Array.from(
      list.querySelectorAll<HTMLElement>(":scope > [role=tab]"),
    ).find((t) => /\s/.test(t.dataset.value ?? ""));
    if (spaced) {
      warn(
        "value",
        `value "${spaced.dataset.value}" 에 빈칸이 있다 — 탭 · 내용 칸의 id 연결(aria-controls · aria-labelledby)이 깨진다. 바뀌지 않는 id 를 쓴다.`,
      );
    }
  }, [listRef, component, fill, label, labelledBy]);
}

// ── Line ─────────────────────────────────────────────────────
const TabsListContext = React.createContext<{
  layout: LineLayout;
  size: LineSize;
}>({ layout: "fill", size: "small" });

// 막대를 고른 탭 아래에 놓는다 — 값이 바뀌면 미끄러지고, 목록 · 탭 크기가 바뀌거나 글꼴을 다 불러오면 바로 놓는다
function useIndicator(
  listRef: React.RefObject<HTMLElement | null>,
  barRef: React.RefObject<HTMLElement | null>,
  value: string,
) {
  const placed = React.useRef<PlacedBar>(null);
  const lastValue = React.useRef<string | null>(null);
  const observer = React.useRef<ResizeObserver | null>(null);

  // 그릴 때마다 — 값이 바뀌었으면 미끄러지고, 아니면 자리가 달라졌을 때만 바로 놓는다. 새로 생긴 탭도 크기를 지켜본다
  useIsoLayoutEffect(() => {
    const list = listRef.current;
    const bar = barRef.current;
    if (!list || !bar) return;
    const changed = lastValue.current !== null && lastValue.current !== value;
    lastValue.current = value;
    placed.current = placeIndicator(list, bar, placed.current, changed);
    if (observer.current) {
      for (const tab of list.querySelectorAll(":scope > [role=tab]")) {
        observer.current.observe(tab);
      }
    }
  });

  React.useEffect(() => {
    const list = listRef.current;
    const bar = barRef.current;
    if (!list || !bar) return;
    const place = () => {
      placed.current = placeIndicator(list, bar, placed.current, false);
    };
    const ro = new ResizeObserver(place);
    observer.current = ro;
    ro.observe(list);
    for (const tab of list.querySelectorAll(":scope > [role=tab]")) {
      ro.observe(tab);
    }
    let alive = true;
    void document.fonts?.ready.then(() => {
      if (alive) place();
    });
    return () => {
      alive = false;
      ro.disconnect();
      observer.current = null;
    };
  }, [listRef, barRef]);
}

export interface TabsListProps
  extends
    Omit<React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>, "loop">,
    VariantProps<typeof tabsListVariants> {}

// Line 목록(role=tablist) — 끝에서 처음으로 돈다(loop)
const TabsList = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ className, layout, size, children, ...props }, ref) => {
  const own = React.useRef<HTMLDivElement>(null);
  const bar = React.useRef<HTMLSpanElement>(null);
  const { value } = useTabsValue("TabsList");
  const l = layout ?? "fill";
  const s = size ?? "small";
  useIndicator(own, bar, value);
  useRevealSelected(own, value, l === "hug");
  useListChecks(
    own,
    "TabsList",
    l === "fill",
    props["aria-label"],
    props["aria-labelledby"],
  );
  return (
    <TabsListContext.Provider value={{ layout: l, size: s }}>
      <TabsPrimitive.List
        ref={mergeRefs(ref, own)}
        data-slot="tabs-list"
        data-layout={l}
        data-size={s}
        data-tabs-prevent-swipe=""
        className={cn(tabsListVariants({ layout: l, size: s }), className)}
        {...props}
      >
        <span
          ref={bar}
          aria-hidden
          data-slot="tabs-indicator"
          className={TABS_INDICATOR}
        />
        {children}
      </TabsPrimitive.List>
    </TabsListContext.Provider>
  );
});
TabsList.displayName = "TabsList";

// id 는 Radix 가 단다 — 탭 ↔ 내용 칸을 aria-controls · aria-labelledby 로 잇는 값이라 덮어쓰지 않는다
export interface TabsTriggerProps extends Omit<
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>,
  "asChild" | "id"
> {
  /** 새 소식 — 알림 점 + 보조 기술에 "새 소식"(고른 탭에는 그리지 않는다). 내용을 보면 끈다. 한 목록에 하나만 */
  notification?: boolean;
}

// Line 탭(role=tab) — 글은 이름만(개수를 붙이지 않는다)
const TabsTrigger = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(
  (
    {
      className,
      value,
      notification = false,
      children,
      onPointerDown,
      onKeyDown,
      onMouseDown,
      onClick,
      ...props
    },
    ref,
  ) => {
    const dsT = useDsText();
    const { layout, size } = React.useContext(TabsListContext);
    const tabs = useTabsValue("TabsTrigger");
    const selected = tabs.value === value;
    return (
      <TabsPrimitive.Trigger
        ref={ref}
        value={value}
        data-slot="tabs-trigger"
        data-value={value}
        data-notification={notification ? "" : undefined}
        tabIndex={selected ? 0 : -1}
        className={cn(tabsTriggerVariants({ layout, size }), className)}
        onPointerDown={(e) => {
          measurePress(e.currentTarget);
          onPointerDown?.(e);
        }}
        onKeyDown={(e) => {
          if (isPressKey(e)) measurePress(e.currentTarget);
          onKeyDown?.(e);
        }}
        {...pressSelect(value, tabs.setValue, { onMouseDown, onClick })}
        {...props}
      >
        <span data-slot="tabs-label" className="relative">
          {children}
          {notification && !selected && (
            <span
              aria-hidden
              data-slot="tabs-notification"
              className={TABS_NOTIFICATION}
            />
          )}
        </span>
        {notification && !selected && (
          <span className="sr-only">{dsT("common.news")}</span>
        )}
      </TabsPrimitive.Trigger>
    );
  },
);
TabsTrigger.displayName = "TabsTrigger";

// ── Chip Tabs ────────────────────────────────────────────────
const ChipTabsListContext = React.createContext<{
  variant: ChipTabsVariant;
  size: ChipTabsSize;
}>({
  variant: "solid",
  size: "medium",
});

export interface ChipTabsListProps extends Omit<
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>,
  "loop"
> {
  /** solid(기본 — 화면 전체를 바꾸는 2차 탭) · outline(일부 내용을 바꾸는 2차 탭) */
  variant?: ChipTabsVariant;
  /** medium 36(기본 — 좁은 자리 · 스크롤 중간의 서브 내용) · large 40(화면 전체를 바꾸는 탭) */
  size?: ChipTabsSize;
}

// Chip Tabs 목록(role=tablist) — 1차 Line 탭 안의 2차 탭
const ChipTabsList = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.List>,
  ChipTabsListProps
>(({ className, variant = "solid", size = "medium", ...props }, ref) => {
  const own = React.useRef<HTMLDivElement>(null);
  const { value } = useTabsValue("ChipTabsList");
  useRevealSelected(own, value, true);
  useListChecks(
    own,
    "ChipTabsList",
    false,
    props["aria-label"],
    props["aria-labelledby"],
  );
  // 양 끝은 늘 흐린다 — 따로 켜지 않는다
  useScrollFog(own, "row");
  return (
    <ChipTabsListContext.Provider value={{ variant, size }}>
      <TabsPrimitive.List
        ref={mergeRefs(ref, own)}
        data-slot="chip-tabs-list"
        data-scroll-fog="row"
        data-variant={variant}
        data-size={size}
        data-tabs-prevent-swipe=""
        className={cn(chipTabsListVariants(), className)}
        {...props}
      />
    </ChipTabsListContext.Provider>
  );
});
ChipTabsList.displayName = "ChipTabsList";

// Chip Tabs 탭(role=tab) — Chip 그대로 그리고 고른 탭에 data-selected 를 단다
const ChipTabsTrigger = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(
  (
    {
      className,
      value,
      notification = false,
      children,
      onPointerDown,
      onKeyDown,
      onMouseDown,
      onClick,
      ...props
    },
    ref,
  ) => {
    const dsT = useDsText();
    const { variant, size } = React.useContext(ChipTabsListContext);
    const tabs = useTabsValue("ChipTabsTrigger");
    const selected = tabs.value === value;
    return (
      <TabsPrimitive.Trigger
        ref={ref}
        value={value}
        data-slot="chip-tabs-trigger"
        data-value={value}
        data-selected={selected ? "" : undefined}
        data-notification={notification ? "" : undefined}
        tabIndex={selected ? 0 : -1}
        className={cn(
          chipVariants({
            variant: CHIP_VARIANT[variant],
            size,
            layout: "withText",
          }),
          className,
        )}
        onPointerDown={(e) => {
          measurePress(e.currentTarget);
          onPointerDown?.(e);
        }}
        onKeyDown={(e) => {
          if (isPressKey(e)) measurePress(e.currentTarget);
          onKeyDown?.(e);
        }}
        {...pressSelect(value, tabs.setValue, { onMouseDown, onClick })}
        {...props}
      >
        <ChipLabel>{children}</ChipLabel>
        {notification && !selected && (
          <span
            aria-hidden
            data-slot="chip-tabs-notification"
            className={CHIP_TABS_NOTIFICATION}
          />
        )}
        {notification && !selected && (
          <span className="sr-only">{dsT("common.news")}</span>
        )}
      </TabsPrimitive.Trigger>
    );
  },
);
ChipTabsTrigger.displayName = "ChipTabsTrigger";

// ── 내용 칸 ───────────────────────────────────────────────────
export type TabsContentProps = Omit<
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>,
  "forceMount" | "asChild" | "id"
>;

// 내용 칸(role=tabpanel · aria-labelledby · tabIndex 0 — Radix). 모두 그려 두고 고르지 않은 칸은 숨긴다 — 칸 안의 스크롤 · 입력이 남는다
const TabsContent = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Content>,
  TabsContentProps
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    forceMount
    data-slot="tabs-content"
    className={cn(TABS_CONTENT, className)}
    {...props}
  />
));
TabsContent.displayName = "TabsContent";

// ── 밀어 넘기기 ───────────────────────────────────────────────
export type TabsSwipeAreaProps = React.HTMLAttributes<HTMLDivElement>;

// 폰 1차 탭의 내용 칸 묶음 — TabsContent 를 바로 아래에 둔다
const TabsSwipeArea = React.forwardRef<HTMLDivElement, TabsSwipeAreaProps>(
  ({ className, ...props }, ref) => {
    const own = React.useRef<HTMLDivElement>(null);
    const { value, setValue } = useTabsValue("TabsSwipeArea");
    const setValueRef = React.useRef(setValue);
    const pending = React.useRef<Commit | null>(null);
    const busy = React.useRef(false);
    useIsoLayoutEffect(() => {
      setValueRef.current = setValue;
    });

    React.useEffect(() => {
      const area = own.current;
      if (!area) return;
      let drag: Drag | null = null;
      let swallowClickUntil = 0;
      const timers = new Set<number>();
      const later = (id: number) => (timers.add(id), id);

      const backToStart = (
        d: Pick<Drag, "current" | "prev" | "next" | "w">,
      ) => {
        const els = [d.current, d.prev?.panel, d.next?.panel];
        if (prefersReducedMotion() || !d.current) {
          clearSwipe(area, els);
          busy.current = false;
          return;
        }
        busy.current = true;
        const moves: [HTMLElement, number][] = [[d.current, 0]];
        if (d.prev) moves.push([d.prev.panel, -d.w]);
        if (d.next) moves.push([d.next.panel, d.w]);
        later(
          slide(area, moves, () => {
            clearSwipe(area, els);
            busy.current = false;
          }),
        );
      };

      const down = (e: PointerEvent) => {
        if (busy.current || drag || !e.isPrimary || e.pointerType === "mouse") {
          return;
        }
        if (
          !window.matchMedia("(pointer: coarse)").matches ||
          blocksSwipe(e.target, area)
        ) {
          return;
        }
        drag = {
          id: e.pointerId,
          x0: e.clientX,
          y0: e.clientY,
          dragging: false,
          dx: 0,
          x: 0,
          w: 0,
          current: null,
          prev: null,
          next: null,
          samples: [],
        };
      };

      const move = (e: PointerEvent) => {
        const d = drag;
        if (!d || e.pointerId !== d.id) return;
        const dx = e.clientX - d.x0;
        const dy = e.clientY - d.y0;
        if (!d.dragging) {
          if (Math.abs(dx) < SWIPE_SLOP && Math.abs(dy) < SWIPE_SLOP) return;
          // 세로가 먼저면 브라우저가 스크롤한다(pan-y)
          const panes = Math.abs(dx) > Math.abs(dy) ? panesOf(area) : null;
          if (!panes) {
            drag = null;
            return;
          }
          Object.assign(d, { dragging: true, w: area.clientWidth, ...panes });
          area.setAttribute("data-swiping", "");
          if (d.prev) setPeek(d.prev.panel, true);
          if (d.next) setPeek(d.next.panel, true);
        }
        d.dx = dx;
        d.x = (dx < 0 ? d.next : d.prev) ? dx : dx * EDGE_FOLLOW;
        if (d.current) moveTo(d.current, d.x);
        if (d.prev) moveTo(d.prev.panel, d.x - d.w);
        if (d.next) moveTo(d.next.panel, d.x + d.w);
        d.samples.push({ t: e.timeStamp, x: e.clientX });
        if (d.samples.length > 12) d.samples.shift();
      };

      const up = (e: PointerEvent) => {
        const d = drag;
        if (!d || e.pointerId !== d.id) return;
        drag = null;
        if (!d.dragging || !d.current) return;
        swallowClickUntil = performance.now() + 400;
        d.samples.push({ t: e.timeStamp, x: e.clientX });
        const speed = speedOf(d.samples);
        const dir: 1 | -1 = d.dx < 0 ? 1 : -1; // 1 = 다음 탭(왼쪽으로 밀었다)
        const target = dir === 1 ? d.next : d.prev;
        const far = Math.abs(d.dx) >= d.w * SWIPE_DISTANCE;
        const flick =
          Math.abs(speed) >= FLICK_SPEED &&
          Math.sign(speed) === Math.sign(d.dx) &&
          Math.abs(d.dx) >= FLICK_DISTANCE;
        if (!target || !(far || flick)) {
          backToStart(d);
          return;
        }
        // 반대쪽 이웃은 바로 치우고, 값을 바꾼다 — 바뀐 값이 그려진 직후(아래 레이아웃 효과)에 마저 미끄러진다
        resetPanel((dir === 1 ? d.prev : d.next)?.panel);
        busy.current = true;
        const commit: Commit = {
          value: target.value,
          from: d.current,
          to: target.panel,
          fromX: d.x,
          toX: d.x + dir * d.w,
          dir,
          w: d.w,
          timer: 0,
        };
        commit.timer = later(
          window.setTimeout(() => {
            if (pending.current !== commit) return;
            pending.current = null;
            backToStart({
              current: commit.from,
              prev: dir === 1 ? null : target,
              next: dir === 1 ? target : null,
              w: commit.w,
            });
          }, COMMIT_WAIT),
        );
        pending.current = commit;
        setValueRef.current(target.value);
      };

      const cancel = (e: PointerEvent) => {
        const d = drag;
        if (!d || e.pointerId !== d.id) return;
        drag = null;
        if (d.dragging) backToStart(d);
      };

      // 밀어 넘긴 손을 떼며 생기는 누르기는 버린다
      const swallowClick = (e: MouseEvent) => {
        if (performance.now() >= swallowClickUntil) return;
        swallowClickUntil = 0;
        e.preventDefault();
        e.stopPropagation();
      };

      area.addEventListener("pointerdown", down);
      area.addEventListener("pointermove", move);
      area.addEventListener("pointerup", up);
      area.addEventListener("pointercancel", cancel);
      area.addEventListener("click", swallowClick, true);
      return () => {
        area.removeEventListener("pointerdown", down);
        area.removeEventListener("pointermove", move);
        area.removeEventListener("pointerup", up);
        area.removeEventListener("pointercancel", cancel);
        area.removeEventListener("click", swallowClick, true);
        for (const id of timers) window.clearTimeout(id);
      };
    }, []);

    // 넘긴 값이 그려진 직후(칠하기 전) — 새 칸은 제자리 흐름에, 옛 칸은 엿보기로 띄워 둘 다 마저 미끄러뜨린다
    useIsoLayoutEffect(() => {
      const p = pending.current;
      const area = own.current;
      if (!p || !area) return;
      pending.current = null;
      window.clearTimeout(p.timer);
      if (value !== p.value || prefersReducedMotion()) {
        clearSwipe(area, [p.from, p.to]);
        busy.current = false;
        return;
      }
      setPeek(p.to, false);
      setPeek(p.from, true);
      moveTo(p.from, p.fromX);
      moveTo(p.to, p.toX);
      slide(
        area,
        [
          [p.from, -p.dir * p.w],
          [p.to, 0],
        ],
        () => {
          clearSwipe(area, [p.from, p.to]);
          busy.current = false;
        },
      );
    }, [value]);

    return (
      <div
        ref={mergeRefs(ref, own)}
        data-slot="tabs-swipe-area"
        className={cn(TABS_SWIPE_AREA, className)}
        {...props}
      />
    );
  },
);
TabsSwipeArea.displayName = "TabsSwipeArea";

export {
  ChipTabsList,
  ChipTabsTrigger,
  Tabs,
  TabsContent,
  TabsList,
  TabsSwipeArea,
  TabsTrigger,
};
