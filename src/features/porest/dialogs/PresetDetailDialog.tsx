import { useTranslation } from 'react-i18next'

import { ModalShell } from '@/shared/ui/porest/dialogs'
import { ModalViewFooter } from '@/shared/ui/porest/modal-footer'
import { DetailHero, DetailField, DetailFieldGroup } from '@/shared/ui/porest/detail'
import { KRW } from '@/shared/lib/porest/format'
import { renderIcon, tileRadius } from '@/shared/lib'
import { getPaletteByColor } from '@/shared/lib/porest/chart-palette'
import type { ExpenseCategory } from '@/entities/expense'
import type { ExpenseTemplate } from '@/entities/expense-template'

/**
 * 프리셋 상세 — 행 탭 → 읽기 전용 상세 → footer 에서 삭제·수정.
 *
 * 모바일 행에서 `✎`·`🗑` 를 걷어냈다. 탭이 그 자리를 대신하는 비제스처 경로다 —
 * 스와이프만 남기면 제스처 없이는 아무것도 못 한다(spec swipe-actions.md · WCAG 2.1.1).
 *
 * 프리셋은 예정일이 없다(`ExpenseTemplate` 은 useCount·lastUsedAt 만 갖는다). 그래서
 * 반복 거래 상세와 달리 "다음 예정일" 섹션이 없고, 지금 저장된 내용만 보여준다.
 */
export function PresetDetailDialog({
  preset,
  categories,
  mobile,
  onClose,
  onEdit,
  onDelete,
}: {
  preset: ExpenseTemplate
  categories: ExpenseCategory[]
  mobile: boolean
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const { t } = useTranslation('expense')
  const { t: tCommon } = useTranslation('common')

  const isExpense = preset.expenseType === 'EXPENSE'
  const cat = preset.categoryRowId != null
    ? categories.find(c => c.rowId === preset.categoryRowId)
    : undefined
  const palette = cat ? getPaletteByColor(cat.color) : null
  // 금액 고정(lockAmount)이 아니면 쓸 때마다 입력한다 — 값이 없는 게 정상이다.
  const locked = preset.lockAmount === 'Y'

  return (
    <ModalShell
      title={t('preset.detailTitle')}
      onClose={onClose}
      mobile={mobile}
      size="md"
      footer={
        <ModalViewFooter
          onDelete={onDelete}
          deleteLabel={tCommon('delete')}
          onEdit={onEdit}
          editLabel={tCommon('edit')}
        />
      }
    >
      <DetailHero
        icon={
          <span
            style={{
              width: 32, height: 32, borderRadius: tileRadius(32),
              background: palette ? palette.bg : 'var(--bg-sunken)',
              color: palette ? palette.color : 'var(--fg-tertiary)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
          >
            {renderIcon(cat?.icon ?? 'bookmark', cat?.categoryName?.charAt(0) ?? '·', 16)}
          </span>
        }
        title={preset.templateName}
        meta={t('preset.usedTimes', { count: preset.useCount ?? 0 })}
      >
        <span
          className="num"
          style={{
            color: locked
              ? (isExpense ? 'var(--fg-expense)' : 'var(--fg-income)')
              : 'var(--fg-tertiary)',
          }}
        >
          {locked && preset.amount != null
            ? `${isExpense ? '−' : '+'}${KRW(preset.amount)}`
            : t('preset.amountEmpty')}
        </span>
      </DetailHero>

      <DetailFieldGroup>
        <DetailField label={t('preset.typeLabel')}>
          {isExpense ? t('expense') : t('income')}
        </DetailField>
        <DetailField label={t('category')}>{preset.categoryName ?? '-'}</DetailField>
        <DetailField label={t('accountCard')}>{preset.assetName ?? '-'}</DetailField>
        {preset.merchant && (
          <DetailField label={t('preset.defaultMerchant')}>{preset.merchant}</DetailField>
        )}
        {preset.description && (
          <DetailField label={t('addTx.detail')}>{preset.description}</DetailField>
        )}
      </DetailFieldGroup>
    </ModalShell>
  )
}
