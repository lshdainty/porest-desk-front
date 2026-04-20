import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Bell, Eye, EyeOff, Plus, Search, Settings } from 'lucide-react'
import { useHideAmounts, togglePdHideAmounts } from '@/shared/lib/porest/hide-amounts'
import { NotificationsPopover } from '@/features/porest/dialogs'
import { SidebarTrigger } from '@/shared/ui/sidebar'
import { Separator } from '@/shared/ui/separator'
import { NAV } from './PorestSidebar'

const TITLE_MAP: Record<string, string> = {
  '/desk': '홈',
  '/desk/asset': '자산',
  '/desk/expense': '가계부',
  '/desk/stats': '통계·분석',
  '/desk/budget': '예산',
  '/desk/calendar': '캘린더',
  '/desk/todo': '할 일',
  '/desk/dutch-pay': '더치페이',
  '/desk/memo': '메모',
  '/desk/settings': '설정',
}

const SUB_MAP: Record<string, string | undefined> = {
  '/desk': '2026년 4월',
}

function titleFor(pathname: string): { title: string; sub?: string } {
  const t = TITLE_MAP[pathname]
  if (t) return { title: t, sub: SUB_MAP[pathname] }
  const item = NAV.find(n => pathname.startsWith(n.path) && n.path !== '/desk')
  if (item) return { title: item.label }
  return { title: TITLE_MAP['/desk'] ?? '홈', sub: SUB_MAP['/desk'] }
}

export function PorestTopBar({ onOpenAdd }: { onOpenAdd: () => void }) {
  const location = useLocation()
  const navigate = useNavigate()
  const hidden = useHideAmounts()
  const { title, sub } = titleFor(location.pathname)
  const [notifOpen, setNotifOpen] = useState(false)

  return (
    <header className="top">
      <SidebarTrigger className="-ml-1 h-8 w-8" />
      <Separator orientation="vertical" className="mx-1 h-5" />
      <div>
        <div className="top__title">{title}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--fg-tertiary)', marginTop: 1 }}>{sub}</div>}
      </div>
      <div className="top__search">
        <Search size={15} />
        <input placeholder="거래, 카테고리, 계좌 검색" />
      </div>
      <div className="top__actions">
        <button
          className="top__icon-btn"
          onClick={togglePdHideAmounts}
          title={hidden ? '금액 표시' : '금액 가리기'}
        >
          {hidden ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
        <button
          className="top__icon-btn"
          aria-label="알림"
          onClick={() => setNotifOpen(v => !v)}
        >
          <Bell size={18} />
          <span className="dot" />
        </button>
        <button
          className="top__icon-btn"
          aria-label="설정"
          onClick={() => navigate('/desk/settings')}
        >
          <Settings size={18} />
        </button>
        <button className="p-btn p-btn--primary p-btn--sm" style={{ marginLeft: 6 }} onClick={onOpenAdd}>
          <Plus size={14} strokeWidth={2.4} />
          내역 추가
        </button>
      </div>
      {notifOpen && (
        <NotificationsPopover
          onClose={() => setNotifOpen(false)}
          onGoSettings={() => navigate('/desk/settings')}
        />
      )}
    </header>
  )
}
