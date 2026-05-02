import type { ReactNode } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
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
 * - 데스크탑: Radix Dialog + porest .modal CSS (포커스 트랩 / ESC / outside click 자동)
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
    <DialogPrimitive.Root
      open={true}
      onOpenChange={open => {
        if (!open) onClose()
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="modal-overlay" />
        <DialogPrimitive.Content
          className={`modal modal--${size}`}
          onOpenAutoFocus={e => e.preventDefault()}
        >
          <div className="modal__head">
            <DialogPrimitive.Title asChild>
              <h3>{title}</h3>
            </DialogPrimitive.Title>
            <DialogPrimitive.Close className="close" aria-label="닫기">
              <X size={18} />
            </DialogPrimitive.Close>
          </div>
          <div className="modal__body">{children}</div>
          {footer && <div className="modal__foot">{footer}</div>}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
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
    <DialogPrimitive.Root
      open={true}
      onOpenChange={open => {
        if (!open) onCancel()
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="modal-overlay" />
        <DialogPrimitive.Content className="modal modal--sm">
          <div className="modal__head">
            <DialogPrimitive.Title asChild>
              <h3>{title}</h3>
            </DialogPrimitive.Title>
          </div>
          <div className="modal__body">
            <p style={{ fontSize: 13.5, color: 'var(--fg-secondary)', lineHeight: 1.6, margin: 0 }}>
              {message}
            </p>
          </div>
          <div className="modal__foot">
            <Button variant="ghost" onClick={onCancel}>
              {cancelLabel}
            </Button>
            <Button
              variant={danger ? 'destructive' : 'default'}
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
