import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Bell, Eye, EyeOff, Moon, Search, Sun } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { useTheme } from '@/shared/ui/theme-provider'
import {
  disablePdHideAmounts,
  enablePdHideAmounts,
  useHideAmounts,
} from '@/shared/lib/porest/hide-amounts'
import { HideAmountsUnlockDialog } from '@/features/porest/dialogs/HideAmountsUnlockDialog'
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

export function MobileHeader() {
  const location = useLocation()
  const navigate = useNavigate()
  const [unlockOpen, setUnlockOpen] = useState(false)
  const { data: unreadCount = 0 } = useUnreadCount()
  const { resolvedTheme, setTheme } = useTheme()
  const hidden = useHideAmounts()
  const toggleTheme = () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')

  const handleHideToggle = () => {
    if (hidden) {
      setUnlockOpen(true)
    } else {
      enablePdHideAmounts()
    }
  }

  return (
    <>
      <div className="m-header">
        <h1>{title(location.pathname)}</h1>
        <Button
          variant="ghost"
          size="icon"
          aria-label={resolvedTheme === 'dark' ? '라이트 모드' : '다크 모드'}
          title={resolvedTheme === 'dark' ? '라이트 모드' : '다크 모드'}
          onClick={toggleTheme}
        >
          {resolvedTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label={hidden ? '금액 표시' : '금액 가리기'}
          title={hidden ? '금액 표시' : '금액 가리기'}
          onClick={handleHideToggle}
        >
          {hidden ? <EyeOff size={20} /> : <Eye size={20} />}
        </Button>
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
        <Button
          variant="ghost"
          size="icon"
          aria-label="검색"
          onClick={() => navigate('/desk/search')}
        >
          <Search size={20} />
        </Button>
      </div>
      <HideAmountsUnlockDialog
        open={unlockOpen}
        onOpenChange={setUnlockOpen}
        onVerified={disablePdHideAmounts}
      />
    </>
  )
}

