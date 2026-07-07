import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Calendar1, Home, Menu, Plus, ReceiptText } from 'lucide-react'

type TabItem =
  | { id: string; labelKey: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number }>; path: string; isFab?: false }
  | { id: string; labelKey: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number }>; isFab: true }

const TABS: TabItem[] = [
  { id: 'home', labelKey: 'home', icon: Home, path: '/desk' },
  { id: 'tx', labelKey: 'expense', icon: ReceiptText, path: '/desk/expense' },
  { id: 'add', labelKey: '', icon: Plus, isFab: true },
  { id: 'calendar', labelKey: 'calendar', icon: Calendar1, path: '/desk/calendar' },
  { id: 'more', labelKey: 'all', icon: Menu, path: '/desk/more' },
]

export function MobileTabBar({ onAdd }: { onAdd: () => void }) {
  const { t } = useTranslation('layout')
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = (path: string) =>
    path === '/desk' ? location.pathname === path : location.pathname.startsWith(path)

  return (
    <nav className="m-tabbar">
      {TABS.map(tab => {
        const IconComp = tab.icon
        if (tab.isFab) {
          return (
            <button key={tab.id} className="m-tab" onClick={onAdd} style={{ position: 'relative' }}>
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
        const active = isActive(tab.path)
        return (
          <button
            key={tab.id}
            className={`m-tab ${active ? 'active' : ''}`}
            onClick={() => navigate(tab.path)}
          >
            <IconComp size={22} strokeWidth={active ? 2.2 : 1.9} />
            <span>{t(tab.labelKey)}</span>
          </button>
        )
      })}
    </nav>
  )
}
