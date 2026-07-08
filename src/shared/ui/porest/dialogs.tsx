import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/shared/ui/drawer'
import { Button } from '@/shared/ui/button'

export type ModalSize = 'sm' | 'md' | 'lg'

/**
 * Porest 디자인 시스템 모달 래퍼.
 * - 모바일: vaul Drawer (스와이프 닫힘)
 * - 데스크탑: shadcn Dialog (Radix 기반, .modal 디자인)
 *
 * Unmount 패턴: 부모가 조건부 마운트하면 열림. onClose 호출 시 부모가 unmount.
 */
export function ModalShell({
  title,
  onClose,
  size = 'md',
  footer,
  children,
  mobile,
  mobileMinHeight,
}: {
  title: ReactNode
  onClose: () => void
  size?: ModalSize
  footer?: ReactNode
  children?: ReactNode
  mobile: boolean
  /** 모바일 drawer 최소 높이 (예: '85dvh') — 앱 showPSheet initialChildSize 0.85 정합.
   *  미지정 시 기존처럼 content 높이. */
  mobileMinHeight?: string
}) {
  const { t } = useTranslation('common')
  if (mobile) {
    return (
      <Drawer
        open={true}
        onOpenChange={open => {
          if (!open) onClose()
        }}
      >
        <DrawerContent
          className="max-h-[88%]"
          style={mobileMinHeight ? { minHeight: mobileMinHeight } : undefined}
        >
          <DrawerHeader>
            <DrawerTitle className="flex-1">{title}</DrawerTitle>
            <button
              type="button"
              onClick={onClose}
              aria-label={t('close')}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-0 bg-transparent text-[var(--fg-secondary)] cursor-pointer hover:bg-[var(--bg-muted)] hover:text-[var(--fg-primary)] transition-colors"
            >
              <X size={18} />
            </button>
          </DrawerHeader>
          <DrawerBody>{children}</DrawerBody>
          {footer && (
            <div
              className="flex items-center justify-end gap-2 px-5 py-3"
            >
              {footer}
            </div>
          )}
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog
      open={true}
      onOpenChange={open => {
        if (!open) onClose()
      }}
    >
      <DialogContent size={size}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogClose
            aria-label={t('close')}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-0 bg-transparent text-[var(--fg-secondary)] cursor-pointer hover:bg-[var(--bg-muted)] hover:text-[var(--fg-primary)] transition-colors"
          >
            <X size={18} />
          </DialogClose>
        </DialogHeader>
        <DialogBody>{children}</DialogBody>
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  )
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel,
  danger,
  loading,
  onCancel,
  onConfirm,
}: {
  title: string
  message: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  loading?: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  const { t } = useTranslation('common')
  return (
    <Dialog
      open={true}
      onOpenChange={open => {
        if (!open) onCancel()
      }}
    >
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <p
            style={{
              fontSize: 'var(--text-body-sm)',
              color: 'var(--fg-secondary)',
              lineHeight: '1.7',
              margin: 0,
            }}
          >
            {message}
          </p>
        </DialogBody>
        <DialogFooter>
          {/* 취소는 비동기 작업(loading) 중에도 원래 상태 유지 — busy 표시는 확인 버튼 스피너로만. */}
          <Button variant="ghost" onClick={onCancel}>
            {cancelLabel ?? t('cancel')}
          </Button>
          <Button
            variant={danger ? 'destructive' : 'default'}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel ?? t('confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
