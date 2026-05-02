import type { CSSProperties, ReactNode } from 'react'

/**
 * ManagerLayout: 설정 화면(카테고리/계좌/예산/알림 등) 상단 영역 공통 spec.
 * 기존 .cat-mgr / __head / __title / __sub / __toolbar / __tabs / __search 의
 * 시각 spec 그대로 보존. 본문은 page 별 children 으로 자유 구성.
 */

const SHELL_CLS = 'flex flex-col gap-4'

export const MANAGER_LAYOUT = {
  shellClassName: SHELL_CLS,
  headStyle: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 20,
  } as CSSProperties,
  titleStyle: {
    font: '700 20px/1.3 var(--font-sans)',
    letterSpacing: '-0.02em',
    margin: '0 0 4px',
    color: 'var(--fg-primary)',
  } as CSSProperties,
  subStyle: {
    fontSize: 13,
    color: 'var(--fg-tertiary)',
    margin: 0,
    maxWidth: '52ch',
    lineHeight: 1.55,
  } as CSSProperties,
  toolbarStyle: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  } as CSSProperties,
  searchWrapStyle: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  } as CSSProperties,
  searchIconStyle: {
    position: 'absolute',
    left: 10,
    color: 'var(--fg-tertiary)',
    pointerEvents: 'none' as const,
  } as CSSProperties,
  searchInputStyle: {
    padding: '8px 12px 8px 30px',
    border: '1px solid var(--border-subtle)',
    borderRadius: 10,
    font: '13px/1 var(--font-sans)',
    background: 'var(--bg-surface)',
    color: 'var(--fg-primary)',
    minWidth: 220,
    outline: 'none',
    fontFamily: 'inherit',
  } as CSSProperties,
} as const

export function ManagerShell({
  className = '',
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return <div className={`${SHELL_CLS} ${className}`}>{children}</div>
}

/**
 * ManagerHead: 데스크톱에서만 노출되는 머리말 섹션 (제목 + 설명 + 우측 액션).
 * 모바일에서는 페이지가 알아서 분기하므로 그대로 안 쓰면 됨.
 */
export function ManagerHead({
  title,
  description,
  actions,
}: {
  title: string
  description?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div style={MANAGER_LAYOUT.headStyle}>
      <div>
        <h2 style={MANAGER_LAYOUT.titleStyle}>{title}</h2>
        {description && <p style={MANAGER_LAYOUT.subStyle}>{description}</p>}
      </div>
      {actions}
    </div>
  )
}

/**
 * ManagerTabs (cat-mgr__tabs): segmented toggle. active 상태 시 mossy-700 배경.
 * 기존 button 스타일 (font/color/active bg) 그대로 보존 - inline style 로.
 */
const TAB_BTN_BASE_STYLE: CSSProperties = {
  padding: '8px 16px',
  border: 0,
  background: 'transparent',
  borderRadius: 6,
  font: '600 13px/1 var(--font-sans)',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontFamily: 'inherit',
  color: 'var(--fg-tertiary)',
}

const TAB_BTN_ACTIVE_STYLE: CSSProperties = {
  background: 'var(--mossy-700)',
  color: '#fff',
  fontWeight: 700,
  boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
}

const TAB_CNT_BASE_STYLE: CSSProperties = {
  fontSize: 11,
  color: 'var(--fg-tertiary)',
  background: 'var(--bg-surface)',
  padding: '2px 7px',
  borderRadius: 999,
  fontWeight: 700,
  minWidth: 20,
  textAlign: 'center',
}

const TAB_CNT_ACTIVE_STYLE: CSSProperties = {
  background: 'rgba(255,255,255,0.22)',
  color: '#fff',
}

export function ManagerTabs<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: T; label: ReactNode; count?: number }[]
  onChange: (v: T) => void
}) {
  return (
    <div
      style={{
        display: 'inline-flex',
        background: 'var(--pd-surface-inset)',
        padding: 4,
        borderRadius: 10,
        gap: 2,
        border: '1px solid var(--border-subtle)',
      }}
    >
      {options.map(o => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={!active ? 'hover:!text-[var(--fg-secondary)]' : ''}
            style={{ ...TAB_BTN_BASE_STYLE, ...(active ? TAB_BTN_ACTIVE_STYLE : null) }}
          >
            {o.label}
            {o.count != null && (
              <span
                style={{
                  ...TAB_CNT_BASE_STYLE,
                  ...(active ? TAB_CNT_ACTIVE_STYLE : null),
                }}
              >
                {o.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
