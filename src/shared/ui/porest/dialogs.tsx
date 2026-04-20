import type { ReactNode } from 'react'
import { X } from 'lucide-react'

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
    return (
      <div className="overlay" onClick={onClose}>
        <div className="sheet sheet--tall" onClick={e => e.stopPropagation()}>
          <div className="sheet__handle" />
          <div className="sheet__head">
            <h3>{title}</h3>
            <button className="close" onClick={onClose} aria-label="닫기">
              <X size={18} />
            </button>
          </div>
          <div className="sheet__body">{children}</div>
          {footer && (
            <div
              style={{
                padding: '12px 20px',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                gap: 8,
                alignItems: 'center',
              }}
            >
              {footer}
            </div>
          )}
        </div>
      </div>
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
