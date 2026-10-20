import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { Slot, Slottable } from "@radix-ui/react-slot";
import { X } from "lucide-react";
import type { VariantProps } from "class-variance-authority";

import { useFieldGroup } from "@/shared/ds/field";
import { useScrollFog } from "@/shared/ds/scroll-fog";
import { cn } from "@/shared/lib/cn";

import {
  CHIP_GROUP_RING,
  CHIP_ICON_SLOT,
  CHIP_ICONS,
  CHIP_REMOVE,
  CHIP_SCROLL_ROW,
  chipGroupVariants,
  chipVariants,
  inputChipVariants,
  isPressKey,
  measurePress,
  type ChipSize,
} from "./chip-variants";

/*
 * Groo Chip — 구조는 SEED Chip(2026-10-02). 수치 원본은 groo-design specs/components/chip.yaml(값은
 * src/shared/ds/spec/chip.json). groo-design recipes/shadcn/components/ui/chip.tsx 를 첫 판으로 가져왔다 — 클래스는
 * chip-variants.ts 다(컴포넌트 파일은 컴포넌트만 내보낸다 — 빠른 새로 고침).
 *
 *   Chip                         버튼 — 제안(누르면 칸에 값을 넣는다, 고른 모습 없음) · 필터 바의 여는 칩(뒤 아래 화살표 +
 *                                aria-haspopup="dialog", 걸린 조건이면 selected) · 아이콘만 있는 필터 지우기(↺, aria-label 필수)
 *   ChipToggle                   여럿 고르기 — 체크박스, 다시 누르면 풀린다. name · value 를 주면 폼으로 보낸다
 *   ChipRadioGroup · ChipRadio   하나 고르기 — 라디오 묶음. 화살표로 옮기면 고르고, Tab 은 고른 칩 하나에만 선다.
 *                                고른 칩을 다시 눌러도 풀리지 않는다
 *   InputChip                    넣은 값 — 버튼이 아닌 알약(Outline Weak 고른 모습) + 뒤 지우기 버튼("{글} 지우기")
 *   ChipGroup                    묶음 — wrap(폼 · 시트 안) · scroll(목록 위 필터 바 · 제안 줄)
 *
 *   variant  solid(옅은 회색 채움 — 흰 표면 위에서만) · outlineStrong(고르면 짙은 채움) ·
 *            outlineWeak(기본 — 고르면 옅은 바탕 + 짙은 1px, 글자 그대로)
 *   size     small 32 · medium 36(기본) · large 40. 글은 세 크기 모두 t4 14 · 500, 가장자리 ↔ 글 12 · 14 · 16, 아이콘 ↔ 글 6
 *   layout   withText(기본) · iconOnly(원 — 아이콘을 children 으로, aria-label 필수 · 없으면 개발 중에 경고)
 *
 * 고름은 ChipToggle · ChipRadio 는 Radix 의 data-state="checked", Chip 은 selected 가 다는 data-selected 로 칠한다
 * (보이기만 한다 — aria-pressed 는 어디에도 쓰지 않는다, SEED). Chip 에 data-state 를 쓰지 않는 것은 여는 칩을 감싸는
 * Popover · Dialog 트리거(asChild)가 data-state="open | closed" 를 덮어쓰기 때문이다. 고른 칩은 브랜드가 아니라 중립색이다.
 * 테두리는 안쪽 1px(inset shadow)이라 칩 크기가 변하지 않는다. 호버 = 누름 바탕(v106 — 마우스 있는 기기에서만, 축소 없음).
 * 누르면 누름 바탕 + 칩 전체가 2px 거리로 준다(SEED scaleScope: self · v104) — 배율 = (기준 − 2) ÷ 기준,
 * 기준 = max(높이, 폭 ÷ 4, 24). 누르는 순간(포인터 · Space · Enter) 칩을 재서 --press-basis 로 넘기고, 크기마다 높이를
 * 기본값으로 둔다. 모션 줄이기면 축소하지 않는다. 포커스 링은 키보드 포커스에만 바깥 2px · 띄움 2px.
 * 비활성은 전용 색(bg-disabled · fg-disabled — 흐리게 하지 않는다, v106)이고 호버 · 누름 · 축소가 없다. 고른 채 막히면
 * 안쪽 1px stroke-neutral-solid 를 남겨 무엇을 골랐는지 보인다(사용자 결정 2026-10-02).
 * 누르는 영역은 보이는 칩과 따로 44 까지 넓힌다(::before — Button 과 같다. 아이콘만 있는 칩은 가로도 44).
 *
 * 묶음은 칩 사이 · 줄 사이 8(spacing-between-chips). scroll 은 두 겹이다 — 바깥 묶음(이름 · 포커스 · bleed) 안에 스크롤 칸
 * (chip.yaml scrollRow)을 둔다. 칸은 한 줄로 두고 안쪽 좌우 여백을 화면 여백(spacing-global-gutter)만큼 둔다 — 스크롤해도
 * 첫 칩이 여백에서 시작하고, 키보드로 옮겨도 여백 안에 멈춘다(scroll-padding). 스크롤바는 숨긴다. 칸의 양 끝은 늘 흐린다(Scroll Fog
 * row — gradient-fade-mask 좌우 20, 스크롤 위치 · 넘침과 상관없이) — 안쪽 여백 24 가 흐림보다 넓어 처음 · 끝의 칩은 흐리지 않는다.
 * 흐림은 마스크라 흐린 자리의 칩도 그대로 눌린다. 부모가 이미 화면 여백을 두었으면 bleed 로 줄을 화면 끝까지 낸다.
 * 칸은 넘친 것을 자르므로 위아래 안쪽 6 · 바깥 −6 을 둔다 — 누르는 영역 44 · 포커스 링이 잘리지 않고, 줄이 세로로 스크롤되지 않고,
 * 줄 높이는 칩 그대로다. 두 겹이라 −6 이 바깥 묶음의 margin 과 상쇄돼 부모의 위아래 간격(space-y · gap)도 그대로다.
 * 비어 있는 묶음은 칩 한 줄(36) 높이를 남긴다 — 입력값을 다 지운 뒤 받는 묶음의 링(모서리 없음)이 납작한 선이 되지 않게.
 * 묶음 · 스크롤 칸은 position: relative — 폼 안에서 Radix 가 칩 옆에 두는 숨은 input(투명 · 누르지 않음)이 그 안에 자리 잡는다
 * (스크롤 줄에서는 칩과 함께 잘리고 함께 스크롤된다).
 * 고르기 묶음을 Field 로 감싸면 라벨이 묶음의 이름, 설명 · 오류가 설명이 된다. Field 없이 쓰면 aria-label 을 준다.
 *
 * InputChip 의 지우기는 칩 안에서 따로 눌린다 — 아이콘 14 · 14 · 16(글자색 그대로), 누르는 영역 24 × 24, 호버 바탕 없음,
 * 누르면 지우기만 준다(기준 24 — Input Button 의 지우기와 같다). 지우기에 키보드 포커스가 있으면 링은 칩 둘레에 그린다
 * (지우기가 칩의 유일한 누를 자리다). 누르면 onRemove 를 부르고, 다음 프레임에 포커스를 다음 칩의 지우기로(없으면 앞 칩의 지우기,
 * 그것도 없으면 ChipGroup — 묶음도 키보드 링을 그린다) 옮긴다. 그래서 InputChip 은 ChipGroup 안에 둔다. 지우지 않았으면
 * (onRemove 가 거절) 포커스는 그 자리에 둔다.
 */

function mergeRefs<T>(...refs: (React.Ref<T> | undefined)[]) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as React.MutableRefObject<T | null>).current = node;
    }
  };
}

// 아이콘만 있는 칩은 이름이 있어야 한다 — 개발 중에만, 그려진 칩을 보고 알린다(asChild 자식에 단 이름도 본다)
function useIconOnlyName(
  ref: React.RefObject<HTMLElement | null>,
  iconOnly: boolean,
  label?: string,
  labelledBy?: string,
) {
  React.useEffect(() => {
    if (!import.meta.env.DEV || !iconOnly) return;
    const el = ref.current;
    if (
      el &&
      !el.getAttribute("aria-label")?.trim() &&
      !el.getAttribute("aria-labelledby")?.trim()
    ) {
      console.warn(
        '[Chip] 아이콘만 있는 칩에 이름이 없다 — aria-label 을 준다(예: "필터 지우기").',
        el,
      );
    }
  }, [ref, iconOnly, label, labelledBy]);
}

function PrefixIcon({
  size,
  children,
}: {
  size: ChipSize;
  children: React.ReactNode;
}) {
  return (
    <span
      aria-hidden
      data-slot="chip-prefix-icon"
      className={cn(CHIP_ICON_SLOT, CHIP_ICONS[size].prefix)}
    >
      {children}
    </span>
  );
}

function SuffixIcon({
  size,
  children,
}: {
  size: ChipSize;
  children: React.ReactNode;
}) {
  return (
    <span
      aria-hidden
      data-slot="chip-suffix-icon"
      className={cn(CHIP_ICON_SLOT, CHIP_ICONS[size].suffix)}
    >
      {children}
    </span>
  );
}

export interface ChipProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof chipVariants> {
  /** 고른 모습(짙은 채움) — 필터 바의 걸린 조건. 보이기만 한다(aria 상태 없음). 제안 칩에는 쓰지 않는다 */
  selected?: boolean;
  /** 앞 아이콘 — 묶음 안에서 모두 두거나 모두 뺀다 */
  prefixIcon?: React.ReactNode;
  /** 뒤 아이콘 — 여는 칩의 아래 화살표(ChevronDown) */
  suffixIcon?: React.ReactNode;
  /** 자식 요소(링크 등)를 칩으로 그린다 — 자식은 하나 */
  asChild?: boolean;
}

// 버튼 칩 — 제안 · 여는 칩 · 아이콘만 있는 지우기. 폼 안에서도 제출하지 않는다(type="button")
const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  (
    {
      className,
      variant,
      size,
      layout,
      selected = false,
      prefixIcon,
      suffixIcon,
      asChild = false,
      type,
      children,
      onPointerDown,
      onKeyDown,
      ...props
    },
    ref,
  ) => {
    const own = React.useRef<HTMLButtonElement>(null);
    useIconOnlyName(
      own,
      layout === "iconOnly",
      props["aria-label"],
      props["aria-labelledby"],
    );
    const s = size ?? "medium";
    const prefix = prefixIcon != null && (
      <PrefixIcon size={s}>{prefixIcon}</PrefixIcon>
    );
    const suffix = suffixIcon != null && (
      <SuffixIcon size={s}>{suffixIcon}</SuffixIcon>
    );
    const common = {
      "data-slot": "chip",
      "data-selected": selected ? "" : undefined,
      className: cn(chipVariants({ variant, size, layout }), className),
      onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
        measurePress(e.currentTarget);
        onPointerDown?.(e);
      },
      onKeyDown: (e: React.KeyboardEvent<HTMLButtonElement>) => {
        if (isPressKey(e)) measurePress(e.currentTarget);
        onKeyDown?.(e);
      },
    };
    if (asChild) {
      return (
        <Slot ref={mergeRefs(ref, own)} {...common} {...props}>
          {prefix}
          <Slottable>{children}</Slottable>
          {suffix}
        </Slot>
      );
    }
    return (
      <button
        ref={mergeRefs(ref, own)}
        type={type ?? "button"}
        {...common}
        {...props}
      >
        {prefix}
        {children}
        {suffix}
      </button>
    );
  },
);
Chip.displayName = "Chip";

// ── 여럿 고르기 ───────────────────────────────────────────────
export interface ChipToggleProps
  extends
    Omit<
      React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>,
      "checked" | "defaultChecked" | "onCheckedChange"
    >,
    Omit<VariantProps<typeof chipVariants>, "layout"> {
  // 일부 고름(indeterminate)은 없다 — 칩은 고름 · 안 고름 둘뿐이다
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /** 앞 아이콘 — 묶음 안에서 모두 두거나 모두 뺀다 */
  prefixIcon?: React.ReactNode;
}

// 체크박스 칩 — 칩 자체가 Radix 체크박스(button role=checkbox)이고 글은 그 안에 있다. 칩마다 Tab 이 선다
const ChipToggle = React.forwardRef<
  React.ComponentRef<typeof CheckboxPrimitive.Root>,
  ChipToggleProps
>(
  (
    {
      className,
      variant,
      size,
      prefixIcon,
      children,
      onCheckedChange,
      onPointerDown,
      onKeyDown,
      ...props
    },
    ref,
  ) => (
    <CheckboxPrimitive.Root
      ref={ref}
      data-slot="chip"
      className={cn(
        chipVariants({ variant, size, layout: "withText" }),
        className,
      )}
      onCheckedChange={
        onCheckedChange && ((checked) => onCheckedChange(checked === true))
      }
      onPointerDown={(e) => {
        measurePress(e.currentTarget);
        onPointerDown?.(e);
      }}
      onKeyDown={(e) => {
        if (isPressKey(e)) measurePress(e.currentTarget);
        onKeyDown?.(e);
      }}
      {...props}
    >
      {prefixIcon != null && (
        <PrefixIcon size={size ?? "medium"}>{prefixIcon}</PrefixIcon>
      )}
      {children}
    </CheckboxPrimitive.Root>
  ),
);
ChipToggle.displayName = "ChipToggle";

// ── 묶음 ─────────────────────────────────────────────────────
// 스크롤 칸 — 양 끝은 늘 흐린다(Scroll Fog row — 좌우 20). 위아래 여백 6 은 흐리지 않는다(가로 마스크다)
function ChipScrollRow({ children }: { children?: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null);
  useScrollFog(ref, "row");
  return (
    <div
      ref={ref}
      data-slot="chip-scroll-row"
      data-scroll-fog="row"
      className={CHIP_SCROLL_ROW}
    >
      {children}
    </div>
  );
}

const rowOf = (
  layout: VariantProps<typeof chipGroupVariants>["layout"],
  children: React.ReactNode,
) =>
  layout === "scroll" ? <ChipScrollRow>{children}</ChipScrollRow> : children;

export interface ChipGroupProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof chipGroupVariants> {}

// 묶음 — role="group"(이름은 Field 라벨 · aria-label). 입력값 칩을 다 지우면 포커스를 받으므로 tabIndex -1.
// className · ref 는 바깥 묶음에 간다(scroll 의 스크롤 칸은 그 안의 [data-slot=chip-scroll-row])
const ChipGroup = React.forwardRef<HTMLDivElement, ChipGroupProps>(
  ({ className, layout, bleed, children, ...props }, ref) => (
    <div
      ref={ref}
      role="group"
      tabIndex={-1}
      data-slot="chip-group"
      className={cn(
        chipGroupVariants({ layout, bleed }),
        CHIP_GROUP_RING,
        className,
      )}
      {...useFieldGroup(props)}
    >
      {rowOf(layout, children)}
    </div>
  ),
);
ChipGroup.displayName = "ChipGroup";

// ── 하나 고르기 ───────────────────────────────────────────────
export interface ChipRadioGroupProps
  extends
    Omit<
      React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>,
      "orientation"
    >,
    VariantProps<typeof chipGroupVariants> {}

// 고른 값 — 칩이 자기가 고른 칩인지(tabIndex) 안다
const ChipRadioValueContext = React.createContext<string | null>(null);

// 라디오 묶음(role=radiogroup) — ← → ↑ ↓ 모두 옮기며 고른다(orientation 을 두지 않는다). 배치는 ChipGroup 과 같다
// (scroll 은 radiogroup 안에 스크롤 칸을 한 겹 더 둔다 — Radix 는 칸 너머의 라디오도 DOM 순서로 찾는다).
// 고른 칩만 tabIndex 0 이다 — Radix 의 로빙 위치는 마지막으로 포커스한 칩이라, 값이 밖에서 바뀌면 Shift+Tab 이 옛 칩에 선다.
// 그래서 값은 이 컴포넌트가 한 번 더 쥔다 — 쓰는 쪽은 value · onValueChange 또는 defaultValue
const ChipRadioGroup = React.forwardRef<
  React.ComponentRef<typeof RadioGroupPrimitive.Root>,
  ChipRadioGroupProps
>(
  (
    {
      className,
      layout,
      bleed,
      children,
      value: valueProp,
      defaultValue,
      onValueChange,
      ...props
    },
    ref,
  ) => {
    const [inner, setInner] = React.useState(defaultValue ?? "");
    const controlled = valueProp !== undefined;
    const value = controlled ? valueProp : inner;
    const setValue = (next: string) => {
      if (!controlled) setInner(next);
      onValueChange?.(next);
    };
    return (
      <ChipRadioValueContext.Provider value={value}>
        <RadioGroupPrimitive.Root
          ref={ref}
          data-slot="chip-radio-group"
          className={cn(chipGroupVariants({ layout, bleed }), className)}
          {...useFieldGroup(props)}
          value={value}
          onValueChange={setValue}
        >
          {rowOf(layout, children)}
        </RadioGroupPrimitive.Root>
      </ChipRadioValueContext.Provider>
    );
  },
);
ChipRadioGroup.displayName = "ChipRadioGroup";

export interface ChipRadioProps
  extends
    React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>,
    Omit<VariantProps<typeof chipVariants>, "layout"> {
  /** 앞 아이콘 — 묶음 안에서 모두 두거나 모두 뺀다 */
  prefixIcon?: React.ReactNode;
}

// 라디오 칩 — 칩 자체가 Radix 라디오(button role=radio)이고 글은 그 안에 있다. ChipRadioGroup 안에 둔다
const ChipRadio = React.forwardRef<
  React.ComponentRef<typeof RadioGroupPrimitive.Item>,
  ChipRadioProps
>(
  (
    {
      className,
      variant,
      size,
      value,
      prefixIcon,
      children,
      onPointerDown,
      onKeyDownCapture,
      ...props
    },
    ref,
  ) => (
    <RadioGroupPrimitive.Item
      ref={ref}
      value={value}
      data-slot="chip"
      tabIndex={React.useContext(ChipRadioValueContext) === value ? 0 : -1}
      className={cn(
        chipVariants({ variant, size, layout: "withText" }),
        className,
      )}
      onPointerDown={(e) => {
        measurePress(e.currentTarget);
        onPointerDown?.(e);
      }}
      // Radix 라디오는 onKeyDown 을 자기 것으로 덮는다 — 누르는 키는 잡는 단계에서 잰다
      onKeyDownCapture={(e) => {
        if (isPressKey(e)) measurePress(e.currentTarget);
        onKeyDownCapture?.(e);
      }}
      {...props}
    >
      {prefixIcon != null && (
        <PrefixIcon size={size ?? "medium"}>{prefixIcon}</PrefixIcon>
      )}
      {children}
    </RadioGroupPrimitive.Item>
  ),
);
ChipRadio.displayName = "ChipRadio";

// ── 입력값 ───────────────────────────────────────────────────
const removeButtonsIn = (group: HTMLElement) =>
  Array.from(
    group.querySelectorAll<HTMLButtonElement>("[data-slot=input-chip-remove]"),
  );
const enabled = (button: HTMLButtonElement) => !button.disabled;

export interface InputChipProps extends Omit<
  React.HTMLAttributes<HTMLSpanElement>,
  "children"
> {
  /** 넣은 값의 글 */
  children: React.ReactNode;
  /** 지우기 — 이 값을 뺀다 */
  onRemove: () => void;
  size?: ChipSize;
  /** 앞 아이콘 — 묶음 안에서 모두 두거나 모두 뺀다 */
  prefixIcon?: React.ReactNode;
  disabled?: boolean;
  /** 지우기 버튼의 이름 — 기본 "{글} 지우기"(글이 문자열이 아니면 화면의 글 + "지우기" 로 읽힌다) */
  removeLabel?: string;
}

// 입력값 칩 — 글 + 뒤 지우기 버튼. ChipGroup 안에 둔다(지운 뒤 포커스가 갈 자리)
const InputChip = React.forwardRef<HTMLSpanElement, InputChipProps>(
  (
    {
      className,
      size,
      prefixIcon,
      disabled = false,
      removeLabel,
      onRemove,
      children,
      ...props
    },
    ref,
  ) => {
    const auto = React.useId();
    const labelId = `${auto}label`;
    const removeTextId = `${auto}remove`;
    const s = size ?? "medium";
    const plain = typeof children === "string" || typeof children === "number";
    const name = removeLabel ?? (plain ? `${children} 지우기` : undefined);

    const remove = (e: React.MouseEvent<HTMLButtonElement>) => {
      const button = e.currentTarget;
      const group = button.closest<HTMLElement>("[data-slot=chip-group]");
      const index = group ? removeButtonsIn(group).indexOf(button) : -1;
      onRemove();
      if (!group) return;
      // 지운 칩이 화면에서 빠진 다음 프레임에 — 다음 칩의 지우기, 없으면 앞 칩의 지우기, 그것도 없으면 묶음
      requestAnimationFrame(() => {
        if (!group.isConnected) return;
        // 지우지 않았거나(거절) 같은 자리를 다음 칩이 이어 쓴다(배열 순번 key) — 그 자리에 둔다
        if (button.isConnected && enabled(button)) {
          button.focus();
          return;
        }
        const rest = removeButtonsIn(group);
        const next =
          rest.slice(index).find(enabled) ??
          rest.slice(0, index).reverse().find(enabled);
        (next ?? group).focus();
      });
    };

    return (
      <span
        ref={ref}
        data-slot="input-chip"
        data-disabled={disabled ? "" : undefined}
        className={cn(inputChipVariants({ size: s }), className)}
        {...props}
      >
        {prefixIcon != null && <PrefixIcon size={s}>{prefixIcon}</PrefixIcon>}
        <span id={labelId} data-slot="input-chip-label">
          {children}
        </span>
        <button
          type="button"
          data-slot="input-chip-remove"
          aria-label={name}
          aria-labelledby={
            name === undefined ? `${labelId} ${removeTextId}` : undefined
          }
          disabled={disabled}
          className={cn(CHIP_REMOVE, CHIP_ICONS[s].remove)}
          onClick={remove}
        >
          <X aria-hidden />
        </button>
        {name === undefined && (
          <span id={removeTextId} hidden>
            지우기
          </span>
        )}
      </span>
    );
  },
);
InputChip.displayName = "InputChip";

export { Chip, ChipGroup, ChipRadio, ChipRadioGroup, ChipToggle, InputChip };
