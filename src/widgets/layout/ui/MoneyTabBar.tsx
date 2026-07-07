import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ChartPie, ReceiptText, FilePen, Wallet } from 'lucide-react'

/**
 * 금액 sub-navigation 하단바 — money group 진입 시 표시.
 *
 * 5 슬롯: ← back / 가계부 / 자산 / 통계 / 예산. 기본 [MobileTabBar] (홈 /
 * 가계부 / + / 캘린더 / 전체) 와 mutually exclusive — 4 페이지 (/desk/expense,
 * /desk/asset, /desk/stats, /desk/budget) 에서만 표시.
 *
 * App `MoneyTabBar` (Flutter) 미러.
 */
type Tab = { id: string; labelKey: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number }>; path: string }

const TABS: Tab[] = [
  { id: 'expense', labelKey: 'expense', icon: ReceiptText, path: '/desk/expense' },
  { id: 'asset', labelKey: 'asset', icon: Wallet, path: '/desk/asset' },
  { id: 'stats', labelKey: 'stats', icon: ChartPie, path: '/desk/stats' },
  { id: 'budget', labelKey: 'budget', icon: FilePen, path: '/desk/budget' },
]

export function MoneyTabBar() {
  const { t } = useTranslation('layout')
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = (path: string) => location.pathname.startsWith(path)
  const onBack = () => navigate('/desk')

  return (
    <nav className="m-tabbar">
      <button className="m-tab m-tab--back" onClick={onBack} aria-label={t('back')}>
        <span className="m-tab__back-pill">
          <ArrowLeft size={18} strokeWidth={2.2} />
        </span>
      </button>
      {TABS.map(tab => {
        const IconComp = tab.icon
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
