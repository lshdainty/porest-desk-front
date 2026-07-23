import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Calendar1, ChartPie, FilePen, Home, Menu, ReceiptText, Wallet } from 'lucide-react'
import { TabBar, TabBarBack, TabBarFab, TabBarItem } from '@/shared/ui/porest/tabbar'

/**
 * 모바일 하단 네비 — default(홈·가계부·+·캘린더·전체) / money(←·가계부·자산·통계·예산)
 * 두 모드를 한 인스턴스로 렌더해 모드 전환 스태거 안무(공유 탭 = 가계부)를 살린다.
 * design chrome.jsx MTabBar 미러 — 모드 결정은 라우팅(AppLayout isMoney)이 담당.
 */
export function AppTabBar({ mode, onAdd }: { mode: 'default' | 'money'; onAdd: () => void }) {
  const { t } = useTranslation('layout')
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = (path: string) =>
    path === '/desk' ? location.pathname === path : location.pathname.startsWith(path)

  return (
    <TabBar modeKey={mode}>
      {mode === 'money' ? (
        <TabBarBack aria-label={t('back')} onClick={() => navigate('/desk')} />
      ) : (
        <TabBarItem icon={Home} label={t('home')} active={isActive('/desk')} onClick={() => navigate('/desk')} />
      )}
      <TabBarItem
        shared
        icon={ReceiptText}
        label={t('expense')}
        active={isActive('/desk/expense')}
        onClick={() => navigate('/desk/expense')}
      />
      {mode === 'money' ? (
        <TabBarItem icon={Wallet} label={t('asset')} active={isActive('/desk/asset')} onClick={() => navigate('/desk/asset')} />
      ) : (
        <TabBarFab aria-label={t('addTransaction')} onClick={onAdd} />
      )}
      {mode === 'money' ? (
        <TabBarItem icon={ChartPie} label={t('stats')} active={isActive('/desk/stats')} onClick={() => navigate('/desk/stats')} />
      ) : (
        <TabBarItem icon={Calendar1} label={t('calendar')} active={isActive('/desk/calendar')} onClick={() => navigate('/desk/calendar')} />
      )}
      {mode === 'money' ? (
        <TabBarItem icon={FilePen} label={t('budget')} active={isActive('/desk/budget')} onClick={() => navigate('/desk/budget')} />
      ) : (
        <TabBarItem icon={Menu} label={t('all')} active={isActive('/desk/more')} onClick={() => navigate('/desk/more')} />
      )}
    </TabBar>
  )
}
