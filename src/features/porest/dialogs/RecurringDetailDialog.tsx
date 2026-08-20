import { Calendar } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { ModalShell } from '@/shared/ui/porest/dialogs'
import { ModalViewFooter } from '@/shared/ui/porest/modal-footer'
import { DetailHero, DetailField, DetailFieldGroup, DetailSection } from '@/shared/ui/porest/detail'
import { MaskAmount } from '@/shared/lib/porest/hide-amounts'
import { KRW } from '@/shared/lib/porest/format'
import { renderIcon, tileRadius } from '@/shared/lib'
import { getPaletteByColor } from '@/shared/lib/porest/chart-palette'
import type { ExpenseCategory } from '@/entities/expense'
import type { RecurringTransaction } from '@/entities/recurring-transaction'
import { previewNextDates, formatKoreanMonthDay } from './recurring-date'
import { displayTitle, recurringSummary } from './RecurringManager'

/**
 * 반복 거래 상세 — 행 탭 → 읽기 전용 상세 → footer 에서 삭제·수정·일시정지.
 *
 * 목록의 `⋮` 메뉴를 대신한다. 메뉴는 액션만 주고 무엇이 언제 잡혀 있는지는 못 보여줬다.
 * 여기서는 **다음 예정일**을 추가 다이얼로그와 같은 계산(`previewNextDates`)으로 보여준다 —
 * 둘이 갈라지면 "추가할 때 본 날짜"와 "상세에서 보는 날짜"가 달라진다.
 */
export function RecurringDetailDialog({
  item,
  categories,
  mobile,
  onClose,
  onEdit,
  onToggle,
  onDelete,
}: {
  item: RecurringTransaction
  categories: ExpenseCategory[]
  mobile: boolean
  onClose: () => void
  onEdit: () => void
  onToggle: () => void
  onDelete: () => void
}) {
  const { t } = useTranslation('recurring')
  const { t: tCommon } = useTranslation('common')

  const isExpense = item.expenseType === 'EXPENSE'
  const isActive = item.isActive === 'Y'
  const cat = categories.find(c => c.rowId === item.categoryRowId)
  const palette = getPaletteByColor(cat?.color)

  // 기준은 서버가 준 nextExecutionDate 다. 오늘부터 세면 서버 스케줄과 어긋난다.
  // 백엔드 dayOfWeek 는 ISO 1=월~7=일, previewNextDates 는 0=일~6=토.
  const nextDates = item.nextExecutionDate
    ? previewNextDates(
        item.nextExecutionDate,
        item.frequency,
        (item.dayOfWeek ?? 7) % 7,
        item.dayOfMonth ?? Number(item.nextExecutionDate.slice(8, 10)),
        3,
      )
    : []

  return (
    <ModalShell title={t('detailTitle')} onClose={onClose} mobile={mobile} size="md"
      footer={
        // [삭제] … [수정][일시정지/시작] — 상세 footer 는 보통 액션 2개까지지만
        // 여기서는 `⋮` 가 갖고 있던 셋을 그대로 옮긴다(사용자 결정).
        <ModalViewFooter
          onDelete={onDelete}
          deleteLabel={tCommon('delete')}
          onEdit={onEdit}
          editLabel={tCommon('edit')}
          onConfirm={onToggle}
          confirmLabel={isActive ? t('pause') : t('start')}
        />
      }
    >
      <DetailHero
        icon={
          <span
            style={{
              width: 32, height: 32, borderRadius: tileRadius(32),
              background: palette.bg, color: palette.color,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
          >
            {renderIcon(cat?.icon ?? 'tag', cat?.categoryName?.charAt(0) ?? '·', 16)}
          </span>
        }
        title={displayTitle(item, t)}
        meta={recurringSummary(item, t)}
      >
        <span className="num" style={{ color: isExpense ? 'var(--fg-expense)' : 'var(--fg-income)' }}>
          <MaskAmount card="etc.recurring">
            {isExpense ? '−' : '+'}{KRW(Math.abs(item.amount))}
          </MaskAmount>
        </span>
      </DetailHero>

      <DetailFieldGroup>
        <DetailField label={t('categoryLabel')}>{item.categoryName ?? '-'}</DetailField>
        <DetailField label={t('assetLabel')}>{item.assetName ?? t('noAccount')}</DetailField>
        {item.maxOccurrences != null && (
          <DetailField label={t('endCountTitle')}>
            {t('occurrencesBadge', { done: item.executedCount, total: item.maxOccurrences })}
          </DetailField>
        )}
      </DetailFieldGroup>

      {/* 다음 예정일 — 추가 다이얼로그와 같은 필 칩. 무엇이 언제 잡혀 있는지 여기서
          바로 보이지 않으면 목록으로 나가 다음 실행일 하나만 보고 짐작해야 한다. */}
      {nextDates.length > 0 && (
        <DetailSection
          title={
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <Calendar size={13} />
              {t('nextDatesTitle')}
            </span>
          }
        >
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {nextDates.map((d, i) => (
              <span
                key={i}
                className="num"
                style={{
                  padding: '6px 12px',
                  background: 'var(--bg-sunken)',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: 'var(--text-caption)',
                  fontWeight: '600',
                  color: 'var(--fg-primary)',
                }}
              >
                {formatKoreanMonthDay(d)}
              </span>
            ))}
          </div>
        </DetailSection>
      )}
    </ModalShell>
  )
}
