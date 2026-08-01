import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ConfirmDialog, ModalShell } from '@/shared/ui/porest/dialogs'
import { ModalViewFooter } from '@/shared/ui/porest/modal-footer'
import { KRW, isEn } from '@/shared/lib/porest/format'
import { formatMonthDayDow } from '@/shared/lib/date'
import { useDeleteTransfer } from '@/features/asset'
import type { AssetTransfer } from '@/entities/asset'

/**
 * 이체 상세 — 보기 + 삭제.
 *
 * 이체는 수정 API 가 없다(생성/삭제만). 값을 바꾸려면 지우고 다시 넣는 방식이라
 * 편집 버튼 대신 삭제만 둔다. 삭제하면 서버가 양쪽 자산의 잔액 이력을 되돌린다.
 */
export function TransferDetailDialog({
  transfer,
  mobile,
  onClose,
}: {
  transfer: AssetTransfer
  mobile: boolean
  onClose: () => void
}) {
  const { t } = useTranslation('expense')
  const { t: tc } = useTranslation('common')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const deleteMut = useDeleteTransfer()

  const fee = transfer.fee ?? 0
  const won = (v: number) => `${isEn() ? '₩' : ''}${KRW(v, { abs: true })}${isEn() ? '' : '원'}`

  const handleConfirmDelete = () => {
    deleteMut.mutate(transfer.rowId, {
      onSuccess: () => {
        toast.success(t('transferDeleted'))
        setConfirmDelete(false)
        onClose()
      },
      // onError: 전역 인터셉터가 서버 메시지를 토스트로 노출
    })
  }

  const rows: { label: string; value: string }[] = [
    { label: t('addTx.fromAccount'), value: transfer.fromAssetName },
    { label: t('addTx.depositAccount'), value: transfer.toAssetName },
    { label: t('form.amount'), value: won(transfer.amount) },
    ...(fee > 0 ? [{ label: t('transferFeePrefix'), value: won(fee) }] : []),
    // 보내는 쪽에서 실제로 빠져나간 금액 — 수수료가 있으면 이체 금액과 다르다.
    ...(fee > 0
      ? [{ label: t('transferWithdrawn'), value: won(transfer.amount + fee) }]
      : []),
    {
      label: t('form.date'),
      value: `${formatMonthDayDow(transfer.transferDate.slice(0, 10))} ${transfer.transferDate.slice(11, 16)}`,
    },
    ...(transfer.description ? [{ label: t('memo'), value: transfer.description }] : []),
  ]

  return (
    <>
      <ModalShell
        title={t('addTx.transfer')}
        onClose={onClose}
        size="sm"
        mobile={mobile}
        footer={
          <ModalViewFooter
            onDelete={() => setConfirmDelete(true)}
            deleteLabel={tc('delete')}
            onConfirm={onClose}
          />
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {rows.map(r => (
            <div key={r.label} style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <span
                style={{
                  fontSize: 'var(--text-label-sm)',
                  color: 'var(--fg-tertiary)',
                  minWidth: 88,
                  flexShrink: 0,
                }}
              >
                {r.label}
              </span>
              <span
                style={{
                  fontSize: 'var(--text-body-sm)',
                  color: 'var(--fg-primary)',
                  fontWeight: 600,
                  wordBreak: 'break-word',
                }}
              >
                {r.value}
              </span>
            </div>
          ))}
        </div>
      </ModalShell>

      {confirmDelete && (
        <ConfirmDialog
          title={tc('delete')}
          message={t('transferDeleteConfirm')}
          confirmLabel={tc('delete')}
          danger
          loading={deleteMut.isPending}
          onCancel={() => !deleteMut.isPending && setConfirmDelete(false)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </>
  )
}
