import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation('layout')
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
        <input placeholder={t('searchPlaceholder')} />
      </div>
      <div className="top__actions">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleHideToggle}
          title={hidden ? t('showAmounts') : t('hideAmounts')}
          aria-label={hidden ? t('showAmounts') : t('hideAmounts')}
        >
          {hidden ? <EyeOff size={18} /> : <Eye size={18} />}
        </Button>
        <ModeToggle />
        <Button
          variant="ghost"
          size="icon"
          aria-label={t('notifications')}
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
          aria-label={t('settings')}
          onClick={() => navigate('/desk/settings')}
        >
          <Settings size={18} />
        </Button>
        <Button size="sm" style={{ marginLeft: 6 }} onClick={onOpenAdd}>
          <Plus size={14} strokeWidth={2.4} />
          {t('addRecord')}
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
