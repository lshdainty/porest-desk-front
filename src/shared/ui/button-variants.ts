import { cva } from "class-variance-authority"

/*
 * Button cva — button.tsx 에서 분리(Fast Refresh: 컴포넌트 파일은 컴포넌트만 export).
 * 시각 spec 주석은 button.tsx 상단 참조.
 */
export const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-[var(--spacing-sm)] whitespace-nowrap select-none",
    // button.md Sizes: md·lg = radius md(8px), xs·sm = radius sm(4px).
    // 기본을 md 로 두고 작은 사이즈만 아래에서 sm 으로 덮는다(뒤에 오는 쪽이 이긴다).
    "rounded-md font-sans font-medium tracking-[-0.005em] leading-none",
    "transition-[box-shadow,background-color,color,border-color,transform] duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-out)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        // 채움색은 brand primary(#0147AD, 남색) 가 아니라 info(#1D6FCB) — 버튼 채움에
        // 한정한다(탭 선택·토글 등 brand 채움 자리는 --bg-brand 그대로).
        // spec button.md Migration notes 2026-08.
        default:
          "bg-[var(--status-info)] text-text-on-accent shadow-sm hover:shadow-md hover:brightness-105 active:shadow-none active:scale-[0.98] active:brightness-95",
        destructive:
          "bg-destructive text-text-on-accent shadow-sm hover:shadow-md hover:brightness-105 active:shadow-none active:scale-[0.98] active:brightness-95",
        outline:
          "border border-border-default bg-transparent text-text-primary hover:bg-surface-input hover:border-[var(--border-strong)] active:scale-[0.98]",
        // spec Color tokens 표에 border 가 없다 — 구현에만 있던 1px 을 뺐다(2026-08).
        secondary:
          "bg-secondary text-text-primary hover:bg-border-default active:scale-[0.98] active:brightness-95",
        // 모달 footer 의 삭제 — 옅은 빨강 채움. 전체 폭 두 버튼이 나란히 설 때 ghost 는
        // 배경이 없어 버튼으로 안 보인다. 삭제 *확정* 은 AlertDialog 의 destructive.
        dangerSoft:
          "bg-[var(--status-danger-subtle)] text-[var(--status-danger-fg)] hover:bg-[color-mix(in_srgb,var(--color-error)_18%,transparent)] active:scale-[0.98] active:brightness-95",
        ghost:
          "bg-transparent text-text-primary hover:bg-surface-input active:bg-border-default active:scale-[0.98]",
        accent:
          "bg-transparent text-[var(--fg-brand)] hover:bg-surface-input active:bg-border-default active:scale-[0.98]",
        link:
          "bg-transparent border-0 px-0.5 text-[var(--fg-link)] hover:text-[var(--fg-link-hover)] hover:underline underline-offset-[3px] active:brightness-90",
        warm:
          "bg-[var(--bg-section-warm)] text-[var(--fg-on-warm)] hover:bg-surface-input",
      },
      size: {
        default: "h-9 px-4 py-[9px] text-sm [&_svg]:size-4",
        xs:      "h-6 px-2 py-1 text-xs gap-1 rounded-[var(--radius-sm)] [&_svg]:size-3.5",
        // sm 은 spec 매핑 그대로 (button.md Sizes: h-8 px-2 py-1 text-caption + BASE gap 8)
        // — 기존 호환층(px-3·13px·gap-5)이 앱 PButton sm 보다 커 보이던 문제 정리.
        sm:      "h-8 px-2 py-1 text-caption rounded-[var(--radius-sm)] [&_svg]:size-3.5",
        md:      "h-10 px-3 py-2 text-sm [&_svg]:size-4",
        // lg 은 모바일 sheet/dialog footer 의 한 손 조작 폭 — 48×48(touch-comfortable),
        // radius md(8px). 앱 PButton lg 및 button.md Sizes 표와 같은 값이다.
        // 예전 h-11(44)·rounded-sm(4)·px-5 는 앱보다 납작하고 각졌다.
        lg:      "h-12 px-4 py-3 text-base rounded-md [&_svg]:size-[18px]",
        icon:    "h-9 w-9 p-0 rounded-md [&_svg]:size-4",
        // 모바일 크롬 헤더(m-header) 전용 — 36×36 원형 + glyph 20px.
        // ghost 조합에서도 보조톤 약화 없이 중립(text-primary) 유지. button.md v97.
        iconLg:  "h-9 w-9 p-0 rounded-full [&_svg]:size-5",
      },
      // flush — 컨테이너 edge 에 붙는 ghost 버튼의 광학 정렬용. 해당 방향 좌/우 padding 만
      // 제거해 글자/아이콘이 edge 에 flush(box·hover 영역 위치는 그대로). footer 좌측
      // 삭제 버튼 등 ghost 가 채워진 버튼과 edge 가 안 맞아 보이던 문제용.
      flush: {
        left:  "pl-0",
        right: "pr-0",
      },
    },
    compoundVariants: [
      // 아이콘 액션 버튼(ghost+icon): 글씨색을 보조톤(text-secondary)으로 약화 —
      // 리스트 행/툴바의 quiet 아이콘 액션. porest-design button.md v96 정합.
      // (iconLg는 페이지당 1개뿐인 주 액션이라 약화 없이 중립 유지 — v97)
      { variant: "ghost", size: "icon", className: "text-text-secondary" },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)
