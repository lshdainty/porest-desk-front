import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ModalShell } from '@/shared/ui/porest/dialogs'
import { ModalFooter } from '@/shared/ui/porest/modal-footer'
import { Field, FieldLabel } from '@/shared/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { useMoveCategoryTransactions } from '@/features/expense'
import type { ExpenseCategory } from '@/entities/expense'

/**
 * 카테고리에 달린 거래를 다른 카테고리로 일괄 이동.
 *
 * <p>거래가 직접 달린 카테고리는 하위 분류를 만들 수 없다(거래는 말단에만 달 수 있어서).
 * 그 상태를 푸는 유일한 방법인데, 지금까지는 거래를 하나씩 편집하는 수밖에 없었다.
 */
export function CategoryMoveTxDialog({
  source,
  categories,
  mobile,
  onClose,
}: {
  source: ExpenseCategory
  categories: ExpenseCategory[]
  mobile: boolean
  onClose: () => void
}) {
  const { t } = useTranslation('category')
  const { t: tc } = useTranslation('common')
  const [targetRowId, setTargetRowId] = useState<number | null>(null)
  const moveMut = useMoveCategoryTransactions()

  // 옮길 수 있는 곳 = 같은 유형이고, 자기 자신이 아니고, 자식이 없는(말단) 카테고리.
  // 서버도 같은 규칙으로 거부하므로 여기서 미리 걸러 고를 수 없게 한다.
  const options = useMemo(() => {
    const parentIds = new Set(
      categories.filter(c => c.parentRowId != null).map(c => c.parentRowId as number),
    )
    return categories.filter(
      c =>
        c.rowId !== source.rowId &&
        c.expenseType === source.expenseType &&
        !parentIds.has(c.rowId),
    )
  }, [categories, source])

  const labelOf = (c: ExpenseCategory) => {
    const parent = c.parentRowId != null
      ? categories.find(p => p.rowId === c.parentRowId)?.categoryName
      : null
    return parent ? `${parent} > ${c.categoryName}` : c.categoryName
  }

  const submit = () => {
    if (targetRowId == null) return
    moveMut.mutate(
      { id: source.rowId, targetCategoryRowId: targetRowId },
      {
        onSuccess: (r) => {
          toast.success(t('moveTx.done', { count: r.expenses + r.recurring + r.splits }))
          onClose()
        },
        // onError: 전역 인터셉터가 서버 메시지를 토스트로 노출
      },
    )
  }

  return (
    <ModalShell
      title={t('moveTx.title')}
      onClose={onClose}
      size="sm"
      mobile={mobile}
      footer={
        <ModalFooter
          onCancel={onClose}
          cancelLabel={tc('cancel')}
          onSave={submit}
          saveLabel={t('moveTx.action')}
          saving={moveMut.isPending}
          saveDisabled={targetRowId == null}
        />
      }
    >
      <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--fg-secondary)', marginBottom: 14 }}>
        {t('moveTx.desc', { name: source.categoryName })}
      </p>

      <Field>
        <FieldLabel>{t('moveTx.target')}</FieldLabel>
        <Select
          value={targetRowId != null ? String(targetRowId) : ''}
          onValueChange={(v) => setTargetRowId(v ? Number(v) : null)}
          disabled={options.length === 0}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('moveTx.targetPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            {options.map(c => (
              <SelectItem key={c.rowId} value={String(c.rowId)}>
                {labelOf(c)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', marginTop: 4 }}>
          {options.length === 0 ? t('moveTx.noTarget') : t('moveTx.hint')}
        </div>
      </Field>
    </ModalShell>
  )
}
