import { useLocation, useNavigate } from 'react-router-dom'
import { Bell, Search } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { useUnreadCount } from '@/features/notification'
import { NAV } from './PorestSidebar'

const MTITLE: Record<string, string> = {
  '/desk': '홈',
  '/desk/asset': '자산',
  '/desk/expense': '가계부',
  '/desk/stats': '통계·분석',
  '/desk/budget': '예산',
  '/desk/calendar': '캘린더',
  // '/desk/todo' · '/desk/dutch-pay' · '/desk/memo' · '/desk/card-benefit' · '/desk/notifications'
  // — 풀스크린 페이지(자체 ← 헤더)라 전역 헤더 미사용 (AppLayout FULLSCREEN_PATHS)
  '/desk/more': '전체',
  '/desk/search': '검색',
}

function title(pathname: string) {
  if (MTITLE[pathname]) return MTITLE[pathname]
  const nav = NAV.find(n => pathname.startsWith(n.path) && n.path !== '/desk')
  return nav?.label ?? '홈'
}

/**
 * 모바일 전역 헤더 — 아이콘은 페이지당 1개 (클로드 디자인 MHeader 정합):
 * 홈=알림 벨(+unread dot), 그 외=검색.
 * 테마 전환은 설정>표시 설정, 금액 가리기는 홈·자산 순자산 카드 눈 버튼으로 이동.
 */
export function MobileHeader() {
  const location = useLocation()
  const navigate = useNavigate()
  const { data: unreadCount = 0 } = useUnreadCount()
  const isHome = location.pathname === '/desk'

  return (
    <div className="m-header">
      <h1>{title(location.pathname)}</h1>
      {isHome ? (
        <Button
          variant="ghost"
          size="icon"
          aria-label="알림"
          onClick={() => navigate('/desk/notifications')}
          className="relative"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span
              aria-hidden
              className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-[var(--fg-expense)]"
            />
          )}
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          aria-label="검색"
          onClick={() => navigate('/desk/search')}
        >
          <Search size={20} />
        </Button>
      )}
    </div>
  )
}
