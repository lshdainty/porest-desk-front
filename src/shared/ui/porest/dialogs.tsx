import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/shared/ui/drawer'

export type ModalSize = 'sm' | 'md' | 'lg'

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
    // vaul Drawer (swipe-to-dismiss 지원, 디자인 토큰은 .sheet 와 동일)
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
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal modal--${size}`} onClick={e => e.stopPropagation()}>
        <div className="modal__head">
          <h3>{title}</h3>
          <button className="close" onClick={onClose} aria-label="닫기">
            <X size={18} />
          </button>
        </div>
        <div className="modal__body">{children}</div>
        {footer && <div className="modal__foot">{footer}</div>}
      </div>
    </div>
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
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal modal--sm" onClick={e => e.stopPropagation()}>
        <div className="modal__head">
          <h3>{title}</h3>
        </div>
        <div className="modal__body">
          <p style={{ fontSize: 13.5, color: 'var(--fg-secondary)', lineHeight: 1.6, margin: 0 }}>{message}</p>
        </div>
        <div className="modal__foot">
          <button className="p-btn p-btn--ghost" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button className={`p-btn ${danger ? 'p-btn--danger' : 'p-btn--primary'}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
