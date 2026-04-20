import { useLocation } from 'react-router-dom'
import { Bell, Search } from 'lucide-react'
import { NAV } from './PorestSidebar'

const MTITLE: Record<string, string> = {
  '/desk': '홈',
  '/desk/asset': '자산',
  '/desk/expense': '가계부',
  '/desk/stats': '통계·분석',
  '/desk/budget': '예산',
  '/desk/calendar': '캘린더',
  '/desk/todo': '할 일',
  '/desk/dutch-pay': '더치페이',
  '/desk/memo': '메모',
  '/desk/more': '전체',
}

function title(pathname: string) {
  if (MTITLE[pathname]) return MTITLE[pathname]
  const nav = NAV.find(n => pathname.startsWith(n.path) && n.path !== '/desk')
  return nav?.label ?? '홈'
}

export function MobileHeader() {
  const location = useLocation()
  const isHome = location.pathname === '/desk'
  return (
    <div className="m-header">
      <h1>{title(location.pathname)}</h1>
      <button className="ico-btn" aria-label={isHome ? '알림' : '검색'}>
        {isHome ? <Bell size={20} /> : <Search size={20} />}
        {isHome && <span className="dot" />}
      </button>
    </div>
  )
}
