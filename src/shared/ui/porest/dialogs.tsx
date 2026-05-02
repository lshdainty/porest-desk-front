import type { ReactNode } from 'react'
import { X } from 'lucide-react'
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
}: {
  title: ReactNode
  onClose: () => void
  size?: ModalSize
  footer?: ReactNode
  children?: ReactNode
  mobile: boolean
}) {
  if (mobile) {
    return (
      <Drawer
        open={true}
        onOpenChange={open => {
          if (!open) onClose()
        }}
      >
        <DrawerContent className="max-h-[88%]">
          <DrawerHeader>
            <DrawerTitle className="flex-1">{title}</DrawerTitle>
            <button
              type="button"
              onClick={onClose}
              aria-label="닫기"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-0 bg-transparent text-[var(--fg-secondary)] cursor-pointer hover:bg-[var(--pd-hover-bg)] hover:text-[var(--fg-primary)] transition-colors"
            >
              <X size={18} />
            </button>
          </DrawerHeader>
          <DrawerBody>{children}</DrawerBody>
          {footer && (
            <div
              className="flex items-center justify-end gap-2 border-t border-[var(--border-subtle)] px-5 py-3"
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
            aria-label="닫기"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-0 bg-transparent text-[var(--fg-secondary)] cursor-pointer hover:bg-[var(--pd-hover-bg)] hover:text-[var(--fg-primary)] transition-colors"
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
  confirmLabel = '확인',
  cancelLabel = '취소',
  danger,
  onCancel,
  onConfirm,
}: {
  title: string
  message: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
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
              fontSize: 13.5,
              color: 'var(--fg-secondary)',
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            {message}
          </p>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant={danger ? 'destructive' : 'default'}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
