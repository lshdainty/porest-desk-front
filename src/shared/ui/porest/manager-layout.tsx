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
    letterSpacing: '-0.022em',
    margin: '0 0 4px',
    color: 'var(--fg-primary)',
  } as CSSProperties,
  subStyle: {
    fontSize: 'var(--text-label-sm)',
    color: 'var(--fg-tertiary)',
    margin: 0,
    maxWidth: '52ch',
    lineHeight: '1.5',
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
    borderRadius: 'var(--radius-md)',
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
 * ManagerTabs (cat-mgr__tabs): segmented toggle — tabs.md Container 룩.
 * active = surface-default pill + shadow-sm + text-primary (brand 채움 아님). count 배지 유지.
 */
// tabs.md pills variant 정합(프리셋 정렬 토글과 동일 룩, 사용자 결정) —
// 트랙 없는 평면 배치 + active = bg-brand 채움(다크에서도 primary 고정) + on-brand 글씨.
const TAB_BTN_BASE_STYLE: CSSProperties = {
  padding: '6px 12px',
  border: 0,
  background: 'transparent',
  borderRadius: 'var(--radius-md)',
  font: '500 13px/1 var(--font-sans)',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontFamily: 'inherit',
  color: 'var(--fg-secondary)',
  transition: 'background var(--motion-duration-fast) var(--motion-ease-out)',
}

const TAB_BTN_ACTIVE_STYLE: CSSProperties = {
  background: 'var(--bg-brand)',
  color: 'var(--fg-on-brand)',
  fontWeight: '600',
}

// count 는 배지 pill 대신 인라인 숫자 — brand 채움 위에서도 읽히게 색만 구분.
const TAB_CNT_BASE_STYLE: CSSProperties = {
  fontSize: 'var(--text-caption)',
  color: 'var(--fg-tertiary)',
  fontWeight: '600',
}

const TAB_CNT_ACTIVE_STYLE: CSSProperties = {
  color: 'var(--fg-on-brand)',
  opacity: 0.8,
}

export function ManagerTabs<T extends string>({
  value,
  options,
  onChange,
  fill = false,
}: {
  value: T
  options: { value: T; label: ReactNode; count?: number }[]
  onChange: (v: T) => void
  /** true 면 가로 전체를 균등 분할 (앱 PToggleGroup expanded 톤). 모바일에서 사용. */
  fill?: boolean
}) {
  return (
    <div
      style={{
        display: fill ? 'flex' : 'inline-flex',
        width: fill ? '100%' : undefined,
        // fill=false(데스크톱): 부모 flex stretch 방지 → sunken bar 가 탭 내용에 딱 맞음
        alignSelf: fill ? undefined : 'flex-start',
        // pills — 트랙(배경·보더·패딩) 없음. 아이템 사이만 xs(4).
        gap: 'var(--spacing-xs)',
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
            style={{
              ...TAB_BTN_BASE_STYLE,
              ...(fill ? { flex: 1, justifyContent: 'center' } : null),
              ...(active ? TAB_BTN_ACTIVE_STYLE : null),
            }}
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
