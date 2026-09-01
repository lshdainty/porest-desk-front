import { Toaster as Sonner } from "sonner";
import { useTheme } from "@/shared/ui/theme-provider";

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
          alignItems: "center",
        },
        classNames: {
          title: "group-[.toast]:text-title-sm group-[.toast]:font-semibold",
          description: "group-[.toast]:text-body-sm",
          actionButton:
            "group-[.toast]:inline-flex group-[.toast]:items-center group-[.toast]:justify-center group-[.toast]:gap-[var(--spacing-sm)] group-[.toast]:whitespace-nowrap group-[.toast]:rounded-sm group-[.toast]:font-sans group-[.toast]:font-medium group-[.toast]:transition-[box-shadow] group-[.toast]:duration-[var(--motion-duration-fast)] group-[.toast]:ease-[var(--motion-ease-out)] group-[.toast]:bg-primary group-[.toast]:text-text-on-accent group-[.toast]:shadow-sm hover:group-[.toast]:brightness-105 group-[.toast]:h-8 group-[.toast]:px-[var(--spacing-sm)] group-[.toast]:text-caption",
          cancelButton:
            "group-[.toast]:inline-flex group-[.toast]:items-center group-[.toast]:justify-center group-[.toast]:gap-[var(--spacing-sm)] group-[.toast]:whitespace-nowrap group-[.toast]:rounded-sm group-[.toast]:font-sans group-[.toast]:font-medium group-[.toast]:transition-[box-shadow] group-[.toast]:duration-[var(--motion-duration-fast)] group-[.toast]:ease-[var(--motion-ease-out)] group-[.toast]:border group-[.toast]:h-8 group-[.toast]:px-[var(--spacing-sm)] group-[.toast]:text-caption",
        },
      }}
      {...rest}
    />
  );
};
