import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Wallet, Receipt, ChartPie, Target, CalendarDays,
  ListChecks, UsersRound, NotebookPen, ChevronsUpDown,
} from 'lucide-react'

export interface NavItem {
  id: string
  label: string
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
  path: string
  badge?: number
}

export const NAV: NavItem[] = [
  { id: 'home',     label: '홈',        icon: LayoutDashboard, path: '/desk' },
  { id: 'assets',   label: '자산',      icon: Wallet,          path: '/desk/asset' },
  { id: 'tx',       label: '가계부',    icon: Receipt,         path: '/desk/expense',  badge: 27 },
  { id: 'stats',    label: '통계·분석', icon: ChartPie,        path: '/desk/stats' },
  { id: 'budget',   label: '예산',      icon: Target,          path: '/desk/budget',   badge: 5 },
  { id: 'calendar', label: '캘린더',    icon: CalendarDays,    path: '/desk/calendar' },
  { id: 'todo',     label: '할 일',     icon: ListChecks,      path: '/desk/todo',     badge: 4 },
  { id: 'dutch',    label: '더치페이',  icon: UsersRound,      path: '/desk/dutch-pay' },
  { id: 'memo',     label: '메모',      icon: NotebookPen,     path: '/desk/memo' },
]

export function PorestSidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean
  onToggle: () => void
}) {
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = (path: string) =>
    path === '/desk' ? location.pathname === path : location.pathname.startsWith(path)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault()
        onToggle()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onToggle])

  const renderItem = (it: NavItem) => {
    const IconComp = it.icon
    const active = isActive(it.path)
    return (
      <button
        key={it.id}
        className={`side__item ${active ? 'active' : ''}`}
        onClick={() => navigate(it.path)}
        title={collapsed ? it.label : undefined}
      >
        <IconComp size={18} strokeWidth={1.9} />
        <span className="side__item-label">{it.label}</span>
        {it.badge != null && <span className="count">{it.badge}</span>}
      </button>
    )
  }

  return (
    <aside className={`side ${collapsed ? 'side--collapsed' : ''}`}>
      <div className="side__head">
        {!collapsed ? (
          <>
            <span className="wordmark">POREST</span>
            <span className="pill">DESK</span>
          </>
        ) : (
          <span className="mark-logo">P</span>
        )}
        <button
          className="side__collapse"
          onClick={onToggle}
          aria-label={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
          title={collapsed ? '펼치기 (⌘\\)' : '접기 (⌘\\)'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="14" rx="2.5" />
            <path d="M9 5v14" />
            {collapsed ? <path d="M14 9l3 3-3 3" /> : <path d="M17 9l-3 3 3 3" />}
          </svg>
        </button>
      </div>
      <div className="side__scroll">
        <div className="side__glabel">워크스페이스</div>
        {NAV.slice(0, 5).map(renderItem)}
        <div className="side__glabel">기록</div>
        {NAV.slice(5).map(renderItem)}
      </div>
      <div className="side__foot">
        <div className="side__user" title={collapsed ? '김민서 · minseo@porest.cloud' : undefined}>
          <span
            className="p-avatar"
            style={{ width: 32, height: 32, fontSize: 12, background: 'var(--mossy-200)', color: 'var(--mossy-800)' }}
          >
            김
          </span>
          {!collapsed && (
            <>
              <div className="info side__item-label">
                <div className="name">김민서</div>
                <div className="sub">minseo@porest.cloud</div>
              </div>
              <ChevronsUpDown size={14} style={{ color: 'var(--fg-tertiary)' }} />
            </>
          )}
        </div>
      </div>
    </aside>
  )
}
