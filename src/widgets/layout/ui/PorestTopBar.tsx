import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Eye, EyeOff, Plus, Search, Settings } from 'lucide-react'
import {
  disablePdHideAmounts,
  enablePdHideAmounts,
  useHideAmounts,
} from '@/shared/lib/porest/hide-amounts'
import { useUnreadCount } from '@/features/notification'
import { NotificationsPopover } from '@/features/porest/dialogs'
import { HideAmountsUnlockDialog } from '@/features/porest/dialogs/HideAmountsUnlockDialog'
import { SidebarTrigger } from '@/shared/ui/sidebar'
import { Button } from '@/shared/ui/button'
import { ModeToggle } from '@/shared/ui/mode-toggle'

export function PorestTopBar({ onOpenAdd }: { onOpenAdd: () => void }) {
  const navigate = useNavigate()
  const hidden = useHideAmounts()
  const { data: unreadCount = 0 } = useUnreadCount()
  const [notifOpen, setNotifOpen] = useState(false)
  const [unlockOpen, setUnlockOpen] = useState(false)

  const handleHideToggle = () => {
    if (hidden) {
      setUnlockOpen(true)
    } else {
      enablePdHideAmounts()
    }
  }

  return (
    <header className="top">
      <SidebarTrigger className="h-8 w-8" />
      <div className="top__search">
        <Search size={15} />
        <input placeholder="거래, 카테고리, 계좌 검색" />
      </div>
      <div className="top__actions">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleHideToggle}
          title={hidden ? '금액 표시' : '금액 가리기'}
          aria-label={hidden ? '금액 표시' : '금액 가리기'}
        >
          {hidden ? <EyeOff size={18} /> : <Eye size={18} />}
        </Button>
        <ModeToggle />
        <Button
          variant="ghost"
          size="icon"
          aria-label="알림"
          onClick={() => setNotifOpen(v => !v)}
          className="relative"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span
              aria-hidden
              className="absolute top-1.5 right-1.5 h-[7px] w-[7px] rounded-full border-2 border-[var(--bg-surface)] bg-[var(--fg-expense)]"
            />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="설정"
          onClick={() => navigate('/desk/settings')}
        >
          <Settings size={18} />
        </Button>
        <Button size="sm" style={{ marginLeft: 6 }} onClick={onOpenAdd}>
          <Plus size={14} strokeWidth={2.4} />
          내역 추가
        </Button>
      </div>
      {notifOpen && (
        <NotificationsPopover
          onClose={() => setNotifOpen(false)}
          onGoSettings={() => navigate('/desk/settings')}
        />
      )}
      <HideAmountsUnlockDialog
        open={unlockOpen}
        onOpenChange={setUnlockOpen}
        onVerified={disablePdHideAmounts}
      />
    </header>
  )
}
