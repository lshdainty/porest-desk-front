import * as React from "react";

import { cn } from "@/shared/lib/cn";

import { tagGroupItemVariants, tagGroupVariants } from "./tag-group-variants";

// 크기 · 톤 · 굵기 · 줄바꿈은 tag-group-variants.ts 머리 주석과 porest-design specs/components/tag-group.yaml 이 정한다.

export type TagGroupSize = "t2" | "t3" | "t4";
export type TagGroupTone = "neutralSubtle" | "neutral" | "brand";
export type TagGroupWeight = "regular" | "bold";

type TagGroupContextValue = {
  size: TagGroupSize;
  truncate: boolean;
  tone: TagGroupTone;
  weight: TagGroupWeight;
};
const TagGroupContext = React.createContext<TagGroupContextValue>({
  size: "t2",
  truncate: false,
  tone: "neutralSubtle",
  weight: "regular",
});

// 아이콘 — 상자 높이를 줄 높이(1lh)로 두고 가운데. wrap 은 줄 상자 위에 맞춰(vertical-align top) 줄 높이를 늘리지 않는다
const ICON =
  "inline-flex h-[1lh] shrink-0 items-center align-top [&>svg]:shrink-0";
const ICON_SIZE: Record<TagGroupSize, string> = {
  t2: "[&>svg]:size-x3",
  t3: "[&>svg]:size-[13px]",
  t4: "[&>svg]:size-x3_5",
};

// 항목 글 — wrap 은 안쪽 띄어쓰기에서 줄을 바꾸고(묶음 칸의 nowrap 을 푼다), truncate 는 각자 말줄임
const LABEL: Record<"wrap" | "truncate", string> = {
  wrap: "whitespace-normal",
  truncate: "min-w-0 truncate",
};

// 묶음 칸 — 항목 하나 + 뒤 구분. wrap 은 칸을 nowrap 으로 두어 아이콘 ↔ 글 · 글(아이콘) ↔ 구분 사이에서 줄이 바뀌지 않게 한다.
// 아이콘은 한 덩어리(inline-flex)라 그 앞뒤는 NBSP · 이음 문자가 있어도 줄바꿈 자리가 된다(CSS Text) — 둘의 가장 가까운 공통
// 조상의 white-space 만 그 자리를 막는다. 글 안 · 구분 뒤 공백은 normal 로 풀어 거기서만 줄이 바뀐다.
// truncate 는 칸을 contents 로 지워 항목 · 구분이 묶음의 flex 칸이 된다
const UNIT: Record<"wrap" | "truncate", string> = {
  wrap: "whitespace-nowrap",
  truncate: "contents",
};

// 구분 — 보이는 " · "(숨김) + 보이지 않는 ", "(읽힘). wrap 은 normal — 뒤 공백이 줄바꿈 자리라 다음 항목이 다음 줄에서 시작한다.
// truncate 의 칸은 줄지 않고, 앞뒤 공백을 지키게 pre 로 둔다
const SEPARATOR = "font-normal text-fg-disabled";
const SEPARATOR_MODE: Record<"wrap" | "truncate", string> = {
  wrap: "whitespace-normal",
  truncate: "shrink-0 whitespace-pre",
};
const SEPARATOR_GLYPH = " · ";

const isBlank = (node: React.ReactNode) =>
  React.Children.toArray(node).every(
    (n) => typeof n === "string" && n.trim() === "",
  );

// wrap 의 뒤 아이콘 — Chromium 은 글 바로 뒤 아이콘 앞의 줄바꿈 자리를 글 쪽 white-space 로 정해, 칸이 nowrap 이어도 아이콘만
// 다음 줄로 넘긴다. 그래서 아이콘을 글의 마지막 낱말과 같은 nowrap 칸 안에 둔다(글 안 다른 띄어쓰기에서는 그대로 줄을 바꾼다).
// 글이 문자열이 아니면 글 전체를 아이콘과 함께 nowrap 으로 둔다
function withSuffixIcon(
  children: React.ReactNode,
  icon: React.ReactNode,
): { label: React.ReactNode; nowrap: boolean } {
  if (typeof children !== "string" && typeof children !== "number") {
    return {
      label: (
        <>
          {children}
          {icon}
        </>
      ),
      nowrap: true,
    };
  }
  const text = String(children);
  const cut = text.search(/\s\S+\s*$/) + 1;
  return {
    label: (
      <>
        {text.slice(0, cut)}
        <span className="whitespace-nowrap">
          {text.slice(cut)}
          {icon}
        </span>
      </>
    ),
    nowrap: false,
  };
}

export interface TagGroupProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** 글자 크기 — t2 12/16(기본) · t3 13/18 · t4 14/19. 묶음에 하나 */
  size?: TagGroupSize;
  /** true 면 한 줄 + 항목마다 말줄임, false(기본)면 낱말 단위 줄바꿈 */
  truncate?: boolean;
  /** 항목의 기본 톤 — 기본 neutralSubtle */
  tone?: TagGroupTone;
  /** 항목의 기본 굵기 — 기본 regular */
  weight?: TagGroupWeight;
}

const TagGroup = React.forwardRef<HTMLSpanElement, TagGroupProps>(
  (
    {
      className,
      size = "t2",
      truncate = false,
      tone = "neutralSubtle",
      weight = "regular",
      children,
      ...props
    },
    ref,
  ) => {
    const mode = truncate ? "truncate" : "wrap";
    // 빈 항목을 뺀다 — 구분이 두 번 찍히거나 끝에 남지 않게
    const items = React.Children.toArray(children).filter((child) => {
      if (typeof child === "string") return child.trim() !== "";
      if (
        React.isValidElement<TagGroupItemProps>(child) &&
        child.type === TagGroupItem
      ) {
        const { children: label, prefixIcon, suffixIcon } = child.props;
        return !isBlank(label) || prefixIcon != null || suffixIcon != null;
      }
      return true;
    });
    return (
      <TagGroupContext.Provider value={{ size, truncate, tone, weight }}>
        <span
          ref={ref}
          data-slot="tag-group"
          className={cn(tagGroupVariants({ size, truncate }), className)}
          {...props}
        >
          {items.map((child, i) => (
            <span
              key={
                React.isValidElement(child) && child.key != null ? child.key : i
              }
              data-slot="tag-group-unit"
              className={UNIT[mode]}
            >
              {typeof child === "string" || typeof child === "number" ? (
                <TagGroupItem>{child}</TagGroupItem>
              ) : (
                child
              )}
              {i < items.length - 1 && (
                <span
                  data-slot="tag-group-separator"
                  className={cn(SEPARATOR, SEPARATOR_MODE[mode])}
                >
                  <span aria-hidden>{SEPARATOR_GLYPH}</span>
                  <span className="sr-only">, </span>
                </span>
              )}
            </span>
          ))}
        </span>
      </TagGroupContext.Provider>
    );
  },
);
TagGroup.displayName = "TagGroup";

type TagGroupItemIcon =
  | {
      /** 앞 아이콘 — 항목 글자색을 따른다(보조 기술에는 숨긴다) */
      prefixIcon?: React.ReactNode;
      suffixIcon?: never;
    }
  | {
      prefixIcon?: never;
      /** 뒤 아이콘 — 항목 글자색을 따른다(보조 기술에는 숨긴다) */
      suffixIcon?: React.ReactNode;
    };

export type TagGroupItemProps = Omit<
  React.HTMLAttributes<HTMLSpanElement>,
  "children"
> &
  TagGroupItemIcon & {
    /** 글 — 6 ~ 10자, 조사 · 접속어 없이 */
    children?: React.ReactNode;
    /** 톤 — 묶음의 tone 을 덮는다 */
    tone?: TagGroupTone;
    /** 굵기 — 묶음의 weight 를 덮는다 */
    weight?: TagGroupWeight;
    /** truncate 일 때 줄어드는 차례 — 기본 1, 0 은 줄지 않고 수가 클수록 먼저 · 많이 준다 */
    shrink?: number;
    /** 보조 기술이 읽을 글 — 주면 보이는 글 · 아이콘을 숨기고 이 글을 읽는다("분할 2건" · "조회 12") */
    srLabel?: string;
  };

const TagGroupItem = React.forwardRef<HTMLSpanElement, TagGroupItemProps>(
  (
    {
      className,
      style,
      tone,
      weight,
      prefixIcon,
      suffixIcon,
      shrink = 1,
      srLabel,
      children,
      ...props
    },
    ref,
  ) => {
    const group = React.useContext(TagGroupContext);
    const mode = group.truncate ? "truncate" : "wrap";
    const hideText = srLabel != null && srLabel !== "";
    const icon = (node: React.ReactNode, side: "prefix" | "suffix") => (
      <span
        aria-hidden
        data-slot={`tag-group-item-${side}-icon`}
        className={cn(
          ICON,
          ICON_SIZE[group.size],
          side === "prefix" ? "mr-x0_5" : "ml-x0_5",
        )}
      >
        {node}
      </span>
    );
    // wrap 의 뒤 아이콘은 글 안(마지막 낱말과 한 칸), truncate 는 글 밖(글만 말줄임 — 아이콘은 잘리지 않는다)
    const glued =
      mode === "wrap" && suffixIcon != null
        ? withSuffixIcon(children, icon(suffixIcon, "suffix"))
        : null;
    return (
      <span
        ref={ref}
        data-slot="tag-group-item"
        className={cn(
          tagGroupItemVariants({
            tone: tone ?? group.tone,
            weight: weight ?? group.weight,
            truncate: group.truncate,
          }),
          className,
        )}
        style={group.truncate ? { flexShrink: shrink, ...style } : style}
        {...props}
      >
        {prefixIcon != null && icon(prefixIcon, "prefix")}
        <span
          data-slot="tag-group-item-label"
          aria-hidden={hideText || undefined}
          className={glued?.nowrap ? "whitespace-nowrap" : LABEL[mode]}
        >
          {glued ? glued.label : children}
        </span>
        {suffixIcon != null && !glued && icon(suffixIcon, "suffix")}
        {hideText && <span className="sr-only">{srLabel}</span>}
      </span>
    );
  },
);
TagGroupItem.displayName = "TagGroupItem";

export { TagGroup, TagGroupItem };
