import { Toaster as Sonner } from "sonner"
import { useTheme } from "@/shared/ui/theme-provider"

/*
 * Porest Sonner (Toaster) — porest-design specs/components/sonner.md SoT 기반.
 *
 * site preview SoT 정합:
 *   toast: surface-default + border-default(1px) + radius-md + shadow-lg
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

type ToasterProps = React.ComponentProps<typeof Sonner>

const SURFACE = "var(--color-surface-default)"
const TEXT = "var(--color-text-primary)"
const BORDER = "var(--color-border-default)"

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
}

const SuccessIcon = () => (
  <svg {...iconBaseProps} stroke="var(--color-success)">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
)
const ErrorIcon = () => (
  <svg {...iconBaseProps} stroke="var(--color-error)">
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
)
const WarningIcon = () => (
  <svg {...iconBaseProps} stroke="var(--color-warning)">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
)
const InfoIcon = () => (
  <svg {...iconBaseProps} stroke="var(--color-info)">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
)

export const Toaster = ({ style: styleProp, ...rest }: ToasterProps) => {
  const { resolvedTheme } = useTheme()

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
  } as React.CSSProperties

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
          border: `1px solid ${BORDER}`,
          borderRadius: "var(--radius-md)",
          boxShadow: "var(--shadow-lg)",
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
  )
}
