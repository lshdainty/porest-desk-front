import { useLocation, useNavigate } from 'react-router-dom'
import { CalendarDays, Home, Menu, Plus, Banknote } from 'lucide-react'

type TabItem =
  | { id: string; label: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number }>; path: string; isFab?: false }
  | { id: string; label: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number }>; isFab: true }

const TABS: TabItem[] = [
  { id: 'home', label: '홈', icon: Home, path: '/desk' },
  { id: 'tx', label: '가계부', icon: Banknote, path: '/desk/expense' },
  { id: 'add', label: '', icon: Plus, isFab: true },
  { id: 'calendar', label: '캘린더', icon: CalendarDays, path: '/desk/calendar' },
  { id: 'more', label: '전체', icon: Menu, path: '/desk/more' },
]

export function MobileTabBar({ onAdd }: { onAdd: () => void }) {
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = (path: string) =>
    path === '/desk' ? location.pathname === path : location.pathname.startsWith(path)

  return (
    <nav className="m-tabbar">
      {TABS.map(t => {
        const IconComp = t.icon
        if (t.isFab) {
          return (
            <button key={t.id} className="m-tab" onClick={onAdd} style={{ position: 'relative' }}>
              <span
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 'var(--radius-pill)',
                  // + 버튼은 light/dark 무관하게 primary(#0147ad) 고정 — --bg-brand는
                  // dark에서 primary-light로 밝아짐. card 정합 shadow-sm (앱 mobile_tab_bar 정합).
                  background: 'var(--color-primary)',
                  color: 'var(--fg-on-brand)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--shadow-sm)',
                  marginTop: -6,
                }}
              >
                <IconComp size={22} strokeWidth={2.5} />
              </span>
            </button>
          )
        }
        const active = isActive(t.path)
        return (
          <button
            key={t.id}
            className={`m-tab ${active ? 'active' : ''}`}
            onClick={() => navigate(t.path)}
          >
            <IconComp size={22} strokeWidth={active ? 2.2 : 1.9} />
            <span>{t.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
