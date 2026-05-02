import { useLocation, useNavigate } from 'react-router-dom'
import { ChartPie, Home, Menu, Plus, Receipt } from 'lucide-react'

type TabItem =
  | { id: string; label: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number }>; path: string; isFab?: false }
  | { id: string; label: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number }>; isFab: true }

const TABS: TabItem[] = [
  { id: 'home', label: '홈', icon: Home, path: '/desk' },
  { id: 'tx', label: '가계부', icon: Receipt, path: '/desk/expense' },
  { id: 'add', label: '', icon: Plus, isFab: true },
  { id: 'stats', label: '통계', icon: ChartPie, path: '/desk/stats' },
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
                  borderRadius: 999,
                  background: 'var(--bg-brand)',
                  color: 'var(--fg-on-brand)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--shadow-brand)',
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
