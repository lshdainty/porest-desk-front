import type { CSSProperties, ReactNode } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'

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
/**
 * ManagerTabs — 관리 화면 탭. shared `Tabs`(tabs.md pills variant) 그대로 사용한다.
 * 자체 button/inline-style 로 pills 를 모방하면 spec 변경 시 어긋나므로 금지(CLAUDE.md).
 * count 는 라벨에 인라인으로 붙인다 — active(brand 채움) 위에서도 읽히도록 색 분리.
 */
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
    <Tabs
      value={value}
      onValueChange={v => v && onChange(v as T)}
      className={fill ? 'w-full' : 'w-fit self-start'}
    >
      <TabsList variant="pills" size="sm" className={fill ? 'flex w-full' : undefined}>
        {options.map(o => (
          <TabsTrigger key={o.value} value={o.value} className={fill ? 'flex-1' : undefined}>
            {o.label}
            {o.count != null && (
              <span className="ml-1.5 opacity-70">{o.count}</span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
