import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Bell, Search } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { useUnreadCount } from '@/features/notification'
import { NAV } from './PorestSidebar'

// 값은 layout ns i18n 키 — 렌더 시 t(titleKey(pathname)) 로 해석.
const MTITLE_KEY: Record<string, string> = {
  '/desk': 'home',
  '/desk/asset': 'asset',
  '/desk/expense': 'expense',
  '/desk/stats': 'statsAnalysis',
  '/desk/budget': 'budget',
  '/desk/calendar': 'calendar',
  // '/desk/todo' · '/desk/dutch-pay' · '/desk/memo' · '/desk/card-benefit' · '/desk/notifications'
  // — 풀스크린 페이지(자체 ← 헤더)라 전역 헤더 미사용 (AppLayout FULLSCREEN_PATHS)
  '/desk/more': 'all',
  '/desk/search': 'search',
}

function titleKey(pathname: string): string {
  if (MTITLE_KEY[pathname]) return MTITLE_KEY[pathname]
  const nav = NAV.find(n => pathname.startsWith(n.path) && n.path !== '/desk')
  return nav?.labelKey ?? 'home'
}

/**
 * 모바일 전역 헤더 — 아이콘은 페이지당 1개 (클로드 디자인 MHeader 정합):
 * 홈=알림 벨(+unread dot), 그 외=검색.
 * 버튼은 size="iconLg" (36×36 원형, glyph 20px, ghost 중립색 — button.md v97).
 * 테마 전환은 설정>표시 설정, 금액 가리기는 홈·자산 순자산 카드 눈 버튼으로 이동.
 */
export function MobileHeader() {
  const { t } = useTranslation('layout')
  const location = useLocation()
  const navigate = useNavigate()
  const { data: unreadCount = 0 } = useUnreadCount()
  const isHome = location.pathname === '/desk'

  return (
    <div className="m-header">
      <h1>{t(titleKey(location.pathname))}</h1>
      {isHome ? (
        <Button
          variant="ghost"
          size="iconLg"
          aria-label={t('notifications')}
          onClick={() => navigate('/desk/notifications')}
          className="relative"
        >
          <Bell />
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
          size="iconLg"
          aria-label={t('search')}
          onClick={() => navigate('/desk/search')}
        >
          <Search />
        </Button>
      )}
    </div>
  )
}
