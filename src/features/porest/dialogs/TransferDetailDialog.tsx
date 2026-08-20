import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ConfirmDialog, ModalShell } from '@/shared/ui/porest/dialogs'
import { ModalViewFooter } from '@/shared/ui/porest/modal-footer'
import { HIDE_AMOUNTS_MASK, useHideAmounts } from '@/shared/lib/porest/hide-amounts-core'
import { KRW, isEn } from '@/shared/lib/porest/format'
import { formatMonthDayDow } from '@/shared/lib/date'
import { useDeleteTransfer } from '@/features/asset'
import type { AssetTransfer } from '@/entities/asset'

/**
 * 이체 상세 — 보기 + 수정 + 삭제.
 *
 * <p>수정·삭제는 서버가 이자 지출·잔액 이력을 되돌렸다 다시 만든다. rowId 는 유지되므로
 * 이 이체를 가리키던 참조가 끊기지 않는다.
 *
 * <p>시스템이 만든 이체(매수 예수금 충당·카드 자동결제)는 금액이 원본과 묶여 있어
 * 고칠 수 없다 — 버튼을 감추고 왜 그런지 적어 둔다.
 */
export function TransferDetailDialog({
  transfer,
  mobile,
  onClose,
  onEdit,
}: {
  transfer: AssetTransfer
  mobile: boolean
  onClose: () => void
  /** 수정 폼으로 넘긴다. 안 넘기면 수정 버튼이 없다. */
  onEdit?: (transfer: AssetTransfer) => void
}) {
  const { t } = useTranslation('expense')
  const { t: tc } = useTranslation('common')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const deleteMut = useDeleteTransfer()

  // 이체 상세는 지금까지 어떤 카드로도 가려지지 않았다 — 거래 상세와 같은 카드로 묶는다.
  // 금액만 가리고 수수료를 남기면 `이체금액 = 출금총액 − 수수료` 로 좁혀지므로 한 덩어리로 본다.
  const hidden = useHideAmounts('ledger.txDetail')
  const fee = transfer.fee ?? 0
  const interest = transfer.interestAmount ?? 0
  // 매수 충당·카드 결제로 생긴 이체는 원본과 금액이 묶여 있다.
  const locked = transfer.autoSource != null
  const won = (v: number) =>
    hidden ? HIDE_AMOUNTS_MASK : `${isEn() ? '₩' : ''}${KRW(v, { abs: true })}${isEn() ? '' : '원'}`

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
    // 대출 상환에만 있다. 이자는 부채를 줄이지 않고 은행으로 나가는 비용이라,
    // 안 보여 주면 "왜 원금이 이만큼밖에 안 줄었지" 가 된다.
    ...(interest > 0
      ? [
          { label: t('addTx.interest'), value: won(interest) },
          { label: t('transferPrincipal'), value: won(transfer.principalAmount) },
        ]
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
            onDelete={locked ? undefined : () => setConfirmDelete(true)}
            deleteLabel={tc('delete')}
            onEdit={locked || !onEdit ? undefined : () => onEdit(transfer)}
            editLabel={tc('edit')}
          />
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* 왜 고칠 수 없는지 알려 준다 — 버튼만 없으면 고장으로 보인다. */}
          {locked && (
            <div
              style={{
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-sunken)',
                fontSize: 'var(--text-caption)',
                color: 'var(--fg-tertiary)',
                lineHeight: 1.6,
              }}
            >
              {t(`transferAutoSource.${transfer.autoSource}`, {
                defaultValue: t('transferAutoSource.default'),
              })}
            </div>
          )}
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
