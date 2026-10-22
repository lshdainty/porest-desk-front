import * as React from "react";
import { ChevronDown, Search, SearchX, type LucideProps } from "lucide-react";
import { DynamicIcon, iconNames, type IconName } from "lucide-react/dynamic";

import { cn } from "@/shared/lib/cn";
import {
  BottomSheet,
  BottomSheetBody,
  BottomSheetContent,
  BottomSheetTrigger,
} from "@/shared/ds/bottom-sheet";
import { Input } from "@/shared/ds/input";
import {
  InputButton,
  useInputButtonSurface,
  type InputButtonProps,
} from "@/shared/ds/input-button";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ds/popover";
import { ResultSection } from "@/shared/ds/result-section";
import { useScrollFog } from "@/shared/ds/scroll-fog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ds/tooltip";

import { CATEGORY_ICON_GLYPHS } from "./category-icon-glyphs";
import {
  CATEGORY_ICON_SECTIONS,
  DEFAULT_CATEGORY_ICON,
  findCategoryIcon,
  searchCategoryIcons,
  type CategoryIcon,
} from "./category-icons";
import {
  ANNOUNCE_DELAY,
  CELL,
  cellsOf,
  centerInScroller,
  GRID,
  GRID_COLUMNS,
  GROUP_HEADER,
  POPOVER_SCROLL,
} from "./icon-picker-variants";
import { useDsText } from "@/shared/ds/i18n";

/*
 * Groo Icon Picker — 카테고리 · 저축 목표에 붙일 아이콘을 고르는 칸(2026-10-09). 수치 원본은 groo-design specs/components/icon-picker.yaml(값은 src/shared/ds/spec/icon-picker.json),
 * 세트는 specs/components/category-icons.yaml(JSON — category-icons.ts 가 그대로 읽는다). 트리거 · 시트 · 팝오버 · 찾기 칸의 나머지 값은 각 레시피(input-button ·
 * bottom-sheet · popover · input)가 그대로다. SEED 에는 아이콘 고르기 부품이 없다 — 세트 · 칸 · 고른 표시 · 키보드 · 한국어 찾기는
 * groo 가 정했다(사용자 결정 15A · 16A · 17A). 옛 Icon Picker(40 정사각 트리거 · 팝오버 320 · lucide 전체 · 영어 이름 · "없음")를 대신한다.
 *
 *   IconPicker   트리거 + 여는 자리 + 찾기 + 격자. value(저장된 lucide 이름 — null · "" 이면 태그) · onValueChange(id — 고르면, 닫는 것은
 *                스스로 한다) · size(트리거 — "responsive" 기본 · "large" · "medium") · disabled · id, 나머지는 Input Button 의 속성.
 *                Field 안이면 라벨이 이름이 되고 오류 · 막힘을 받는다(Input Button)
 *
 * 트리거: Input Button — 앞 붙이개에 지금 아이콘, 값에 그 한국어 이름("커피"), 뒤 chevron-down. 이름은 "아이콘 커피"(Field 라벨 + 값).
 *   아이콘이 없는 항목(null · "")은 태그 + "태그", 세트 밖에 저장된 아이콘은 그 아이콘(lucide-react/dynamic) + "지금 아이콘" — 지우지도
 *   바꾸지도 않는다(격자에 고른 칸이 없고, 고르지 않고 닫으면 그대로). 서버 시드의 home 은 세트의 house(집)로 본다(lucideAliases).
 * 여는 자리: 1280 미만 Bottom Sheet(제목 "아이콘" · 닫기), 이상 Popover(머리 없이 · 이름 "아이콘" · 폭 408 = 칸 48 × 7 + 사이 4 × 6 +
 *   좌우 24 × 2). 고르면 바로 닫힌다("완료" 없음) — 초점은 트리거로. 묶음 머리 · 격자가 든 스크롤 상자는 끝 흐림(Scroll Fog overlayBody —
 *   위 20 · 아래 80 늘 켜짐 + 본문 안 여백 그만큼, 2026-10-03 규칙)을 건다 — 맨 위에서 첫 묶음 머리, 끝까지 내리면 마지막 줄이 흐림
 *   밖에 선다. 찾기 칸은 스크롤 상자 밖이라 흐리지 않는다.
 * 찾기: 위에 붙은 Input 밑줄형(시트 large 40 · 팝오버 medium 34 · 앞 돋보기 · 지우기 · "아이콘 이름 검색" · 이름 "아이콘 검색") — 목록과
 *   따로 두어 스크롤해도 그 자리다. 치는 대로 세트를 거른다(이름 · 찾는 말 · id — 소문자 · 공백 없이 부분 일치). 결과는 세트 차례 그대로
 *   묶음 머리 없이, 개수는 화면 밖(aria-live polite)에서 치기를 멈추면 한 번 "검색 결과 2개". 0건이면 격자 자리에 Result Section medium
 *   "'{검색어}'에 대한 아이콘이 없어요"(role=status 가 알린다).
 * 격자: role="listbox"(이름 "아이콘") — 묶음은 role="group" + 머리(14 · 500 · fg-neutral-subtle, 위 12 · 아래 8)가 이름. 칸 48 · 모서리 12 ·
 *   아이콘 24(fg-neutral · 선 2)을 시트 6열 · 팝오버 7열로 두고(사이 최소 4 — 남는 폭은 칸 사이에 고르게, 시트 본문이 308 보다 좁은 폰은
 *   들어가는 만큼) 줄 사이 4. 스크롤 상자 맨 위(흐림 여백 20 아래)가 첫 묶음 머리(위 12)이고, 찾는 동안은 머리 대신 격자 위
 *   12(searchGap) — 어느 쪽이든 찾기 칸에서 머리 글 · 격자까지 32 다(흐림 여백은 본문 안에 더한다 — bottom-sheet.yaml).
 *   칸 이름은 한국어 이름(role="option" · aria-selected), 마우스는 같은 글의 툴팁(Tooltip — 네이티브 title 은 쓰지 않는다).
 *   고른 칸은 안쪽 2px stroke-neutral-contrast(::after — 아이콘이 밀리지 않는다, Select Box v113) + 선 2.5, 바탕은 칠하지 않는다.
 *   호버 · 누름 바탕 bg-layer-floating-pressed, 누르면 칸 2px 거리 축소(48 → 0.958, 모션 줄이기면 하지 않는다), 키보드 포커스에만 바깥 링 2px · 띄움 2px.
 * 키보드: 격자에 Tab 하나(고른 칸, 없으면 첫 칸 — roving tabindex). ← → 는 차례대로(줄 끝에서 다음 줄 · 다음 묶음으로, 끝에서 멈춘다 — RTL 은
 *   반대), ↑ ↓ 는 보이는 위아래 줄의 가장 가까운 칸(묶음 머리를 넘는다), Home · End 는 그 줄의 처음 · 끝, Enter · Space 로 고른다.
 *   찾기 칸에서 ↓ 는 격자의 첫 칸으로. 열면 초점은 고른 칸(없으면 첫 칸)이고 고른 칸이 보이게 가운데로 스크롤한다 — 폰에서 키보드가 올라와
 *   격자를 가리지 않게 찾기 칸은 눌러야 친다. Esc 는 찾는 말이 있으면 지우고(초점은 찾기 칸) 비었으면 닫는다(값은 그대로).
 */

/*
 * 레시피와 다른 자리
 *   - 세트는 TS 표가 아니라 JSON(category-icons.json)을 읽는다(category-icons.ts) — 그림만 category-icon-glyphs.ts 가 잇고 icon-picker.test.tsx 가 어긋남을 잡는다.
 *   - 여는 자리 안(찾기 칸 + 격자 + 결과 수)을 IconPickerPanel 로, 칸 하나를 IconPickerCell 로 떼었다 — 카탈로그 견본이 시트 · 팝오버를 열지 않고 칸 · 격자를 직접 그려 ds:check 가 잴 수 있게.
 *     IconPicker 는 트리거 · 여는 자리 · 열 때 초점 · Esc 만 맡는다.
 *   - 결과 수 알림은 effect 에서 상태를 비우지 않고 "어느 찾는 말에 알렸나" 를 함께 들어 현재 찾는 말과 다르면 비운 것으로 본다(effect 안 동기 setState 없이).
 */

// lucide-react 가 아는 이름 — 세트 밖 저장 값을 그릴 수 있는지(없는 이름이면 태그)
const LUCIDE_NAMES = new Set<string>(iconNames);

/** 저장 값으로 아이콘 하나를 그린다 — 세트 안은 세트의 컴포넌트, 세트 밖은 lucide-react/dynamic, 빈 값 · 모르는 이름은 태그 */
function CategoryGlyph({ id, ...props }: { id: string } & LucideProps) {
  const entry = findCategoryIcon(id);
  const Tag = CATEGORY_ICON_GLYPHS[DEFAULT_CATEGORY_ICON];
  const Known = entry ? CATEGORY_ICON_GLYPHS[entry.id] : undefined;
  if (Known) return <Known aria-hidden {...props} />;
  if (id !== "" && LUCIDE_NAMES.has(id)) {
    return (
      <DynamicIcon
        aria-hidden
        {...props}
        name={id as IconName}
        fallback={Tag ? () => <Tag aria-hidden {...props} /> : undefined}
      />
    );
  }
  return Tag ? <Tag aria-hidden {...props} /> : null;
}

// 팝오버 본문 — 팝오버가 열릴 때 마운트되므로 흐림도 이 부품이 걸고(useScrollFog) 닫히면 걷는다.
// PopoverBody 는 넘치면 스스로 Tab 이 서는데(tabIndex 0), 격자는 칸이 초점을 받아 화살표로 스크롤되므로 Tab 하나 규칙을 지키려 그 칸을 두지 않는다
function PopoverScroll({ children }: { children: React.ReactNode }) {
  const own = React.useRef<HTMLDivElement>(null);
  useScrollFog(own, "overlayBody");
  return (
    <div
      ref={own}
      data-slot="icon-picker-body"
      data-scroll-fog="overlayBody"
      className={POPOVER_SCROLL}
    >
      {children}
    </div>
  );
}

export interface IconPickerCellProps {
  icon: CategoryIcon;
  /** 지금 값의 칸 — 안쪽 2px 짙은 테두리 + 선 2.5 */
  selected: boolean;
  /** roving tabindex — 격자에 Tab 하나(고른 칸, 없으면 첫 칸) */
  tabIndex: 0 | -1;
  /** 초점이 오면(격자가 Tab 이 서는 칸을 옮겨 다니게) */
  onActivate?: (id: string) => void;
  /** 누르면 — 고른다 */
  onSelect: (id: string) => void;
}

/** 칸 하나 — 48 · 아이콘 24, 이름은 한국어 이름(role=option), 마우스는 같은 글의 툴팁. 격자(IconPickerPanel)가 늘어놓는다 */
function IconPickerCell({
  icon,
  selected,
  tabIndex,
  onActivate,
  onSelect,
}: IconPickerCellProps) {
  const Glyph = CATEGORY_ICON_GLYPHS[icon.id];
  // 칸 툴팁은 마우스를 올렸을 때만 연다 — 키보드 초점(열면 고른 칸에 초점이 간다)으로 열지 않는다. 칸 이름은 낭독이 읽고,
  // 초점으로 뜬 툴팁이 첫 Esc 를 먹어 두 번 눌러야 닫히던 문제를 막는다(icon-picker.md "마우스는 같은 글의 툴팁", 03B-012)
  const [tipOpen, setTipOpen] = React.useState(false);
  const mouseOver = React.useRef(false);
  return (
    <Tooltip
      open={tipOpen}
      onOpenChange={(next) => {
        if (next && !mouseOver.current) return;
        setTipOpen(next);
      }}
    >
      <TooltipTrigger asChild>
        <div
          role="option"
          aria-selected={selected}
          aria-label={icon.name}
          tabIndex={tabIndex}
          data-slot="icon-picker-cell"
          data-icon={icon.id}
          className={CELL}
          onPointerEnter={(e) => {
            mouseOver.current = e.pointerType === "mouse";
          }}
          onPointerLeave={() => {
            mouseOver.current = false;
          }}
          onFocus={() => onActivate?.(icon.id)}
          onClick={() => onSelect(icon.id)}
        >
          {Glyph && <Glyph aria-hidden />}
        </div>
      </TooltipTrigger>
      <TooltipContent>{icon.name}</TooltipContent>
    </Tooltip>
  );
}

export interface IconPickerPanelProps {
  /** 여는 자리 — sheet(1280 미만 · 앱: 6열 · 찾기 칸 large) · popover(1280 이상: 7열 · 찾기 칸 medium) */
  surface: "sheet" | "popover";
  /** 고른 칸의 id — 없으면(세트 밖 저장 값) null */
  selectedId: string | null;
  /** 찾는 말 */
  query: string;
  onQueryChange: (query: string) => void;
  /** 칸을 고르면 */
  onSelect: (id: string) => void;
  /** 격자(listbox) · 찾기 칸 — 열 때 초점을 두고 Esc 로 찾는 말을 지우는 쪽이 쓴다 */
  listboxRef?: React.RefObject<HTMLDivElement | null>;
  searchRef?: React.RefObject<HTMLInputElement | null>;
}

/** 여는 자리 안 — 찾기 칸 + 묶음 격자(스크롤 · 끝 흐림) + 결과 수 알림. 시트 · 팝오버 안에 넣거나 견본으로 그대로 그린다 */
function IconPickerPanel({
  surface,
  selectedId,
  query,
  onQueryChange,
  onSelect,
  listboxRef: listboxRefProp,
  searchRef: searchRefProp,
}: IconPickerPanelProps) {
  const dsT = useDsText();
  const ownListbox = React.useRef<HTMLDivElement>(null);
  const ownSearch = React.useRef<HTMLInputElement>(null);
  const listboxRef = listboxRefProp ?? ownListbox;
  const searchRef = searchRefProp ?? ownSearch;
  const headerId = React.useId();
  const [activeId, setActiveId] = React.useState<string | null>(null);
  // 결과 수 알림 — 어느 찾는 말에 알렸나를 함께 든다(현재 찾는 말과 다르면 비운 것)
  const [announced, setAnnounced] = React.useState<{
    query: string;
    count: number;
  } | null>(null);

  const searching = query.trim() !== "";
  const results = searchCategoryIcons(query);
  const visible: readonly CategoryIcon[] = searching
    ? results
    : CATEGORY_ICON_SECTIONS.flatMap((section) => section.icons);
  // Tab 이 서는 칸 — 옮겨 다닌 칸, 없으면 고른 칸, 그것도 없으면 첫 칸
  const tabbableId =
    activeId != null && visible.some((icon) => icon.id === activeId)
      ? activeId
      : selectedId != null && visible.some((icon) => icon.id === selectedId)
        ? selectedId
        : (visible[0]?.id ?? null);

  // 결과 수 — 치기를 멈추면 한 번. 0건은 Result Section 이 알린다
  const resultCount = results.length;
  React.useEffect(() => {
    if (!searching || resultCount === 0) return;
    const timer = window.setTimeout(
      () => setAnnounced({ query, count: resultCount }),
      ANNOUNCE_DELAY,
    );
    return () => window.clearTimeout(timer);
  }, [searching, resultCount, query]);
  const announcement =
    searching && announced?.query === query
      ? dsT("iconPicker.results", { count: announced.count })
      : "";

  const focusCell = (cell: HTMLElement | undefined) => {
    if (!cell) return;
    const id = cell.getAttribute("data-icon");
    if (id) setActiveId(id);
    cell.focus({ preventScroll: true });
    cell.scrollIntoView({ block: "nearest", inline: "nearest" });
  };

  const onGridKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const cell = (e.target as HTMLElement).closest<HTMLElement>(
      '[role="option"]',
    );
    if (!cell) return;
    const cells = cellsOf(listboxRef.current);
    const i = cells.indexOf(cell);
    if (i < 0) return;
    const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
    const r = cell.getBoundingClientRect();
    const sameRow = (c: HTMLElement) =>
      Math.abs(c.getBoundingClientRect().top - r.top) < 2;
    let target: HTMLElement | undefined;
    switch (e.key) {
      case "ArrowRight":
        target =
          cells[Math.min(cells.length - 1, Math.max(0, i + (rtl ? -1 : 1)))];
        break;
      case "ArrowLeft":
        target =
          cells[Math.min(cells.length - 1, Math.max(0, i + (rtl ? 1 : -1)))];
        break;
      case "ArrowDown":
      case "ArrowUp": {
        // 보이는 위아래 줄의 가장 가까운 칸 — 묶음 머리를 넘는다
        const down = e.key === "ArrowDown";
        const cx = r.left + r.width / 2;
        let rowTop: number | null = null;
        for (const c of cells) {
          const t = c.getBoundingClientRect().top;
          if (down ? t > r.top + 2 : t < r.top - 2) {
            if (rowTop == null || (down ? t < rowTop : t > rowTop)) rowTop = t;
          }
        }
        if (rowTop == null) break;
        let best = Number.POSITIVE_INFINITY;
        for (const c of cells) {
          const q = c.getBoundingClientRect();
          if (Math.abs(q.top - rowTop) > 2) continue;
          const d = Math.abs(q.left + q.width / 2 - cx);
          if (d < best) {
            best = d;
            target = c;
          }
        }
        break;
      }
      case "Home":
        target = cells.find(sameRow);
        break;
      case "End":
        target = cells.filter(sameRow).pop();
        break;
      case "Enter":
      case " ": {
        e.preventDefault();
        const id = cell.getAttribute("data-icon");
        if (id) onSelect(id);
        return;
      }
      default:
        return;
    }
    e.preventDefault();
    if (target && target !== cell) focusCell(target);
  };

  const cell = (icon: CategoryIcon) => (
    <IconPickerCell
      key={icon.id}
      icon={icon}
      selected={icon.id === selectedId}
      tabIndex={icon.id === tabbableId ? 0 : -1}
      onActivate={setActiveId}
      onSelect={onSelect}
    />
  );

  const search = (
    <Input
      ref={searchRef}
      variant="underline"
      size={surface === "sheet" ? "large" : "medium"}
      prefixIcon={<Search />}
      clearable
      type="text"
      value={query}
      onChange={(e) => onQueryChange(e.target.value)}
      placeholder={dsT("iconPicker.searchPlaceholder")}
      aria-label={dsT("iconPicker.searchLabel")}
      autoComplete="off"
      spellCheck={false}
      onKeyDown={(e) => {
        // 글자를 조합하는 동안(한글)의 키는 조합의 것이다
        if (
          e.nativeEvent.isComposing ||
          e.keyCode === 229 ||
          e.key !== "ArrowDown"
        )
          return;
        e.preventDefault();
        focusCell(cellsOf(listboxRef.current)[0]);
      }}
    />
  );

  const grid = (
    <>
      {searching && results.length === 0 ? (
        <ResultSection
          kind="empty"
          size="medium"
          icon={<SearchX />}
          data-icon-picker="empty"
          title={dsT("iconPicker.emptyTitle", { query: query.trim() })}
          description={dsT("iconPicker.emptyDescription")}
        />
      ) : (
        <div
          ref={listboxRef}
          role="listbox"
          aria-label={dsT("iconPicker.label")}
          data-slot="icon-picker-grid"
          onKeyDown={onGridKeyDown}
        >
          {searching ? (
            // 찾는 동안은 묶음 머리가 없다 — 찾기 칸 ↔ 격자 12(searchGap, 묶음 머리 위 여백과 같다)
            <div
              role="none"
              className={cn(GRID, GRID_COLUMNS[surface], "pt-x3")}
            >
              {results.map(cell)}
            </div>
          ) : (
            CATEGORY_ICON_SECTIONS.map(({ group, icons }) => (
              <div
                key={group}
                role="group"
                aria-labelledby={`${headerId}${group}`}
                data-slot="icon-picker-group"
              >
                <div
                  id={`${headerId}${group}`}
                  role="presentation"
                  data-slot="icon-picker-group-header"
                  className={GROUP_HEADER}
                >
                  {group}
                </div>
                <div role="none" className={cn(GRID, GRID_COLUMNS[surface])}>
                  {icons.map(cell)}
                </div>
              </div>
            ))
          )}
        </div>
      )}
      <span
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
        data-slot="icon-picker-count"
      >
        {announcement}
      </span>
    </>
  );

  if (surface === "sheet") {
    return (
      <>
        <div
          data-slot="icon-picker-search"
          className="shrink-0 px-global-gutter"
        >
          {search}
        </div>
        {/* 끝 흐림 — 위 20 · 아래 80(본문 안 여백 그만큼). 열 수는 본문 폭(@container)으로 가른다 */}
        <BottomSheetBody scrollFog className="@container">
          {grid}
        </BottomSheetBody>
      </>
    );
  }
  return (
    <>
      <div data-slot="icon-picker-search" className="shrink-0 px-x6 pt-x6">
        {search}
      </div>
      <PopoverScroll>{grid}</PopoverScroll>
    </>
  );
}

export interface IconPickerProps extends Omit<
  InputButtonProps,
  | "value"
  | "onClick"
  | "placeholder"
  | "prefixIcon"
  | "suffixIcon"
  | "prefix"
  | "suffix"
  | "onClear"
  | "size"
> {
  /** 저장된 lucide 이름 — null · "" 이면 태그로 그린다. 세트 밖 이름은 그대로 그린다("지금 아이콘") */
  value?: string | null;
  /** 고르면 — 닫는 것은 스스로 한다 */
  onValueChange?: (id: string) => void;
  /** 트리거 크기 — "responsive"(기본 — 1280 미만 large 52 · 이상 medium 40) · "large"(앱) · "medium" */
  size?: "responsive" | "large" | "medium";
}

const IconPicker = React.forwardRef<HTMLButtonElement, IconPickerProps>(
  ({ value, onValueChange, size = "responsive", ...props }, ref) => {
    const dsT = useDsText();
    const surface = useInputButtonSurface();
    const [open, setOpen] = React.useState(false);
    const [query, setQuery] = React.useState("");
    const listboxRef = React.useRef<HTMLDivElement>(null);
    const searchRef = React.useRef<HTMLInputElement>(null);

    const stored = value?.trim() ?? "";
    const entry = findCategoryIcon(stored);
    const empty = stored === "";
    // 트리거 — 세트 안은 그 아이콘 + 이름, 빈 값은 태그 + "태그", 세트 밖은 그 아이콘 + "지금 아이콘"
    const shownId = entry ? entry.id : empty ? DEFAULT_CATEGORY_ICON : stored;
    const shownName = entry
      ? entry.name
      : empty
        ? (findCategoryIcon(DEFAULT_CATEGORY_ICON)?.name ??
          dsT("iconPicker.tag"))
        : dsT("iconPicker.current");
    const selectedId = entry ? entry.id : empty ? DEFAULT_CATEGORY_ICON : null;

    const changeOpen = (next: boolean) => {
      setOpen(next);
      if (!next) setQuery("");
    };

    const select = (id: string) => {
      onValueChange?.(id);
      changeOpen(false);
    };

    // 열면 초점은 고른 칸(없으면 첫 칸) — 고른 칸이 보이게 가운데로
    const onOpenAutoFocus = (e: Event) => {
      e.preventDefault();
      const cells = cellsOf(listboxRef.current);
      const cell =
        cells.find((c) => c.getAttribute("data-icon") === selectedId) ??
        cells[0];
      if (!cell) return;
      centerInScroller(cell);
      cell.focus({ preventScroll: true });
    };

    // Esc — 찾는 말이 있으면 지우고 찾기 칸으로(표면은 그대로), 비었으면 닫는다
    const onEscapeKeyDown = (e: KeyboardEvent) => {
      if (query === "") return;
      e.preventDefault();
      setQuery("");
      searchRef.current?.focus();
    };

    const panel = (
      <IconPickerPanel
        surface={surface}
        selectedId={selectedId}
        query={query}
        onQueryChange={setQuery}
        onSelect={select}
        listboxRef={listboxRef}
        searchRef={searchRef}
      />
    );

    const trigger = (
      <InputButton
        ref={ref}
        size={size}
        value={shownName}
        prefixIcon={<CategoryGlyph id={shownId} />}
        suffixIcon={<ChevronDown />}
        // 버튼의 data-slot(input-button-trigger)은 Input Button 그대로 둔다
        data-icon-picker=""
        data-icon={shownId}
        {...props}
      />
    );

    if (surface === "sheet") {
      return (
        <BottomSheet open={open} onOpenChange={changeOpen}>
          <BottomSheetTrigger asChild>{trigger}</BottomSheetTrigger>
          <BottomSheetContent
            title={dsT("iconPicker.label")}
            data-icon-picker="sheet"
            onOpenAutoFocus={onOpenAutoFocus}
            onEscapeKeyDown={onEscapeKeyDown}
          >
            {panel}
          </BottomSheetContent>
        </BottomSheet>
      );
    }
    return (
      <Popover open={open} onOpenChange={changeOpen}>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent
          aria-label={dsT("iconPicker.label")}
          align="start"
          data-icon-picker="popover"
          className="w-[408px]"
          onOpenAutoFocus={onOpenAutoFocus}
          onEscapeKeyDown={onEscapeKeyDown}
        >
          {panel}
        </PopoverContent>
      </Popover>
    );
  },
);
IconPicker.displayName = "IconPicker";

export { IconPicker, IconPickerCell, IconPickerPanel };
