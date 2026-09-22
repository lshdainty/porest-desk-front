import { Toaster as Sonner } from "sonner";
import { useTheme } from "@/shared/ui/theme-context";

/*
 * Porest Sonner (Toaster) — porest-design specs/components/sonner.md SoT 기반.
 *
 * site preview SoT 정합:
 *   toast: surface-raised + radius-md + shadow-md (테두리 없음)
 *   title: text-title-sm 600
 *   description: text-body-sm + text-secondary
 *   actionButton: button.md Size sm — h-8 + text-caption + radius-sm + bg-primary +
 *                 shadow-sm + hover:brightness-105 + transition-[box-shadow]
 *   cancelButton: 같은 sm 골격 + outline (border-default + surface-default)
 *
 * Theme 연결: next-themes 대신 자체 ThemeProvider 의 resolvedTheme 사용 — sonner 가
 * system 미디어쿼리로 라이브러리 자체 다크 톤(검정)을 박지 못하도록 명시 dark/light 전달.
 *
 * 색상 적용 우선순위 (sonner v2 라이브러리 기본 다크 톤 override):
 *   1. Toaster style — sonner 의 --normal-bg / --normal-text / --normal-border 등 root CSS var 교체
 *   2. toastOptions.style — 각 toast 인스턴스에 inline style 강제 (specificity 최강)
 * 두 단계로 박아 라이브러리 기본 black 토스트가 새지 않도록 함.
 *
 * 부품(아이콘·제목·설명·버튼)은 `!`(important) 유틸리티로 덮는다. sonner 기본 규칙이
 * `[data-sonner-toast][data-styled=true] [data-title]` 같은 속성 선택자 셋이라 보통
 * 유틸리티는 진다. 예전 classNames 는 `group-[.toast]:` 를 달았는데 `.group.toast` 조상이
 * 없어 한 번도 적용되지 않았다 — 제목이 13px/500 시스템 글꼴, 버튼이 24px 검정으로
 * 떠 있었다(2026-09-22 브라우저 실측).
 *
 * 버튼은 글 아래 줄 오른쪽 끝(sonner.md 2026-09-22) — toast 는 flex-wrap, content 가
 * 아이콘 옆 한 줄 전체를 차지해 버튼이 다음 줄로 간다.
 *
 * 다크 모드 자동 전환: var(--color-surface-default) 등은 src/index.css 의 [data-theme='dark']
 * 블록에서 *-dark 토큰으로 자동 swap. 따로 isDark 분기 불필요.
 *
 * 사용:
 *   import { toast } from "sonner"
 *   toast.success("저장되었습니다")
 *   toast.error("저장 실패", { id: "save-error" })  // id 옵션으로 중복 방지
 */

type ToasterProps = React.ComponentProps<typeof Sonner>;

// 다크에서 surface-default(#242938)는 bg-page(#1A1F2E)와 차이가 작고, 분리를 맡던
// 검은 그림자는 검은 배경 위에서 효과가 거의 없다. 면을 한 단계 올려야
// 실제로 뜬다(sonner.md 2026-08-21). 라이트에선 --bg-surface-raised 가
// var(--color-surface-default) 라 변화 없다.
const SURFACE = "var(--bg-surface-raised)";
const TEXT = "var(--color-text-primary)";
// 테두리 없음(sonner.md) — sonner 의 --*-border 는 "none" 을 받는다.
const BORDER = "none";

/*
 * Kind icons — porest-design sonner-examples.mjs 와 1:1 동기.
 * 20×20 stroke svg, kind 별 semantic 토큰 색상. fill 채움 금지(spec 규칙).
 */
const iconBaseProps = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  style: { flexShrink: 0, marginTop: 2 } as React.CSSProperties,
};

const SuccessIcon = () => (
  <svg {...iconBaseProps} stroke="var(--color-success)">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);
const ErrorIcon = () => (
  <svg {...iconBaseProps} stroke="var(--color-error)">
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);
const WarningIcon = () => (
  <svg {...iconBaseProps} stroke="var(--color-warning)">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
const InfoIcon = () => (
  <svg {...iconBaseProps} stroke="var(--color-info)">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

export const Toaster = ({ style: styleProp, ...rest }: ToasterProps) => {
  const { resolvedTheme } = useTheme();

  const rootStyle = {
    ...(styleProp ?? {}),
    "--normal-bg": SURFACE,
    "--normal-text": TEXT,
    "--normal-border": BORDER,
    "--success-bg": SURFACE,
    "--success-text": TEXT,
    "--success-border": BORDER,
    "--error-bg": SURFACE,
    "--error-text": TEXT,
    "--error-border": BORDER,
    "--warning-bg": SURFACE,
    "--warning-text": TEXT,
    "--warning-border": BORDER,
    "--info-bg": SURFACE,
    "--info-text": TEXT,
    "--info-border": BORDER,
  } as React.CSSProperties;

  return (
    <Sonner
      theme={resolvedTheme}
      className="toaster group"
      style={rootStyle}
      icons={{
        success: <SuccessIcon />,
        error: <ErrorIcon />,
        warning: <WarningIcon />,
        info: <InfoIcon />,
      }}
      toastOptions={{
        style: {
          background: SURFACE,
          color: TEXT,
          // 테두리 없음 — 면과 그림자만으로 분리한다(sonner.md 2026-08-21).
          border: "none",
          borderRadius: "var(--radius-md)",
          // 다크에서 lg 는 부드러운 번짐이 아니라 한 겹 더 어두운 띠로 읽힌다
          // (그림자 색이 50~60% 검정인데 배경이 이미 거의 검정이라 경계가 안 뭉개진다).
          boxShadow: "var(--shadow-md)",
          // 패딩·최소 높이를 명시한다(sonner.md). 안 주면 sonner 라이브러리
          // 기본값이 적용돼, 라이브러리가 바뀌면 조용히 따라 움직인다.
          padding: "var(--spacing-md) var(--spacing-lg)",
          minHeight: "52px",
          boxSizing: "border-box",
          // sonner.md ⓐ — 기본값(gap 6 · 가운데 정렬 · 한 줄)을 덮는다. 줄 묶음은 최소
          // 높이 안에서 세로 가운데, 줄 안에서는 위로 — 아이콘이 제목 첫 줄에 붙는다.
          gap: "var(--spacing-md)",
          flexWrap: "wrap",
          alignItems: "flex-start",
          alignContent: "center",
          // toaster 가 ui-sans-serif 를 박아 둔다 — 앱 글꼴(Pretendard)로 되돌린다.
          fontFamily: "var(--font-sans)",
        },
        classNames: {
          // ⓑ 20×20 — 기본 상자는 16 이라 20px 아이콘이 넘치고 글과의 간격이 좁았다.
          // 좌우 음수·양수 margin 도 걷는다(간격은 container gap 하나가 맡는다).
          icon: "!size-5 !m-0 !items-start",
          // content — 아이콘 옆 한 줄 전체. 버튼이 옆에 설 자리가 없어 아래 줄로 간다.
          content:
            "!min-w-0 !grow !basis-[calc(100%-20px-var(--spacing-md))] !gap-[var(--spacing-xs)]",
          title: "!text-title-sm !font-semibold",
          description:
            "!text-body-sm !font-normal !text-[var(--color-text-secondary)]",
          actionButton:
            "!ml-auto !inline-flex !items-center !justify-center !gap-[var(--spacing-sm)] !whitespace-nowrap !rounded-sm !font-sans !font-medium transition-[box-shadow] duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-out)] !bg-primary !text-text-on-accent ![box-shadow:var(--shadow-sm)] hover:brightness-105 !h-8 !px-[var(--spacing-sm)] !text-caption",
          cancelButton:
            "!inline-flex !items-center !justify-center !gap-[var(--spacing-sm)] !whitespace-nowrap !rounded-sm !font-sans !font-medium transition-[box-shadow] duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-out)] !border !border-[var(--color-border-default)] !bg-[var(--color-surface-default)] !text-[var(--color-text-primary)] !h-8 !px-[var(--spacing-sm)] !text-caption",
        },
      }}
      {...rest}
    />
  );
};
