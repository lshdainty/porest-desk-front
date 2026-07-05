import { ChevronRight } from 'lucide-react'
import { Trans, useTranslation } from 'react-i18next'
import { Button } from '@/shared/ui/button'
import { Skeleton as SkeletonBase } from '@/shared/ui/skeleton'
import { useMarkAllRead, useMarkRead, useNotifications } from '@/features/notification'
import { NotificationRow } from '@/entities/notification'
import type { Notification } from '@/entities/notification'

export function NotificationsPopover({
  onClose,
  onGoSettings,
}: {
  onClose: () => void
  onGoSettings?: () => void
}) {
  const { t } = useTranslation('notification')
  const { data, isLoading } = useNotifications()
  const markRead = useMarkRead()
  const markAllRead = useMarkAllRead()

  const items: Notification[] = data ?? []
  const unreadCount = items.filter(n => !n.isRead).length

  return (
    <>
      <div className="notif-backdrop" onClick={onClose} />
      <div
        role="dialog"
        aria-label={t('title')}
        style={{
          position: 'fixed',
          top: 58,
          right: 20,
          width: 380,
          maxWidth: 'calc(100vw - 32px)',
          maxHeight: 'min(640px, calc(100vh - 80px))',
          zIndex: 'var(--z-sticky)',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-xl)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '16px 18px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div>
            <div
              style={{
                font: '700 15px/1.3 var(--font-sans)',
                letterSpacing: '-0.012em',
                color: 'var(--fg-primary)',
              }}
            >
              {t('title')}
            </div>
            {unreadCount > 0 ? (
              <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', marginTop: 1 }}>
                <Trans
                  t={t}
                  i18nKey="popover.unread"
                  values={{ count: unreadCount }}
                  components={{ b: <b style={{ color: 'var(--fg-brand-strong)' }} /> }}
                />
              </div>
            ) : (
              !isLoading && items.length === 0 && (
                <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', marginTop: 1 }}>
                  {t('popover.noNew')}
                </div>
              )
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              loading={markAllRead.isPending}
              onClick={() => markAllRead.mutate()}
              className="ml-auto text-[var(--fg-brand-strong)] hover:bg-[var(--bg-brand-subtle)] hover:text-[var(--fg-brand-strong)]"
            >
              {t('markAllRead')}
            </Button>
          )}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
          {isLoading && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="notif-row"
                  style={{ pointerEvents: 'none' }}
                >
                  <SkeletonBase className="h-8 w-8 rounded-md notif-row__icon" />
                  <div className="notif-row__text">
                    <SkeletonBase className="h-4 w-2/3 mb-1.5" />
                    <SkeletonBase className="h-3 w-full" />
                  </div>
                  <SkeletonBase className="h-3 w-10 shrink-0" />
                </div>
              ))}
            </div>
          )}
          {!isLoading && items.length === 0 && (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 'var(--text-label-sm)' }}>
              {t('popover.empty')}
            </div>
          )}
          {items.map(n => (
            <NotificationRow
              key={n.rowId}
              notification={n}
              onClick={() => {
                if (!n.isRead) markRead.mutate(n.rowId)
              }}
            />
          ))}
        </div>
        <div
          style={{
            padding: '10px 14px',
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-sunken)',
          }}
        >
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              onClose()
              onGoSettings?.()
            }}
            className="w-full justify-center gap-1 text-[var(--fg-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--fg-primary)]"
          >
            {t('prefs.title')} <ChevronRight size={12} />
          </Button>
        </div>
      </div>
    </>
  )
}
