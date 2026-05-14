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
