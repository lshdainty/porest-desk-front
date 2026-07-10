import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DynamicIcon } from 'lucide-react/dynamic'
import type { IconName } from 'lucide-react/dynamic'
import { Target } from 'lucide-react'
import { ConfirmDialog, ModalShell } from '@/shared/ui/porest/dialogs'
import { ModalViewFooter } from '@/shared/ui/porest/modal-footer'
import { useDeleteSavingGoal } from '@/features/savingGoal'
import type { SavingGoal } from '@/entities/savingGoal'
import { tileRadius } from '@/shared/lib'
import { money } from '@/shared/lib/porest/format'
import { formatYearMonth } from '@/shared/lib/date'

/** 목표 항목 클릭 → 읽기 전용 상세. TxDetailDialog 패턴 미러 (hero + 필드 행 + 뷰 footer). */
export function SavingGoalDetailDialog({
  goal,
  mobile,
  onClose,
  onEdit,
}: {
  goal: SavingGoal
  mobile: boolean
  onClose: () => void
  onEdit: (goal: SavingGoal) => void
}) {
  const { t } = useTranslation('asset')
  const { t: tc } = useTranslation('common')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const deleteMut = useDeleteSavingGoal()

  const pct = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0
  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount)
  const color = goal.color ?? 'var(--bg-brand)'
  const iconName = (goal.icon && goal.icon.trim().length > 0 ? goal.icon : 'piggy-bank') as IconName
  const deadline = (() => {
    if (!goal.deadlineDate) return null
    const d = new Date(goal.deadlineDate)
    return isNaN(d.getTime()) ? null : formatYearMonth(d)
  })()

  const Footer = (
    <ModalViewFooter
      onDelete={() => setConfirmDelete(true)}
      deleting={deleteMut.isPending}
      onEdit={() => onEdit(goal)}
      onConfirm={onClose}
    />
  )

  return (
    <>
      <ModalShell
        title={t('savingGoal.detailTitle')}
        onClose={onClose}
        size="md"
        footer={Footer}
        mobile={mobile}
      >
        {/* Hero — 목표 색 틴트 + 진행률 */}
        <div
          style={{
            background: `linear-gradient(135deg, oklch(from ${color} l c h / 0.12), var(--bg-surface))`,
            border: `1px solid color-mix(in oklch, ${color} 20%, transparent)`,
            borderRadius: 'var(--radius-xl)',
            padding: 22,
            marginBottom: 18,
            textAlign: 'center',
          }}
        >
          <div style={{ display: 'inline-flex', marginBottom: 12 }}>
            <span
              style={{
                width: 40,
                height: 40,
                borderRadius: tileRadius(40),
                background: `oklch(from ${color} l c h / 0.12)`,
                color,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <DynamicIcon name={iconName} size={19} fallback={() => <Target size={19} />} />
            </span>
          </div>
          <div
            style={{
              fontSize: 'var(--text-title-md)',
              fontWeight: '800',
              letterSpacing: '-0.015em',
              color: 'var(--fg-primary)',
              overflowWrap: 'anywhere',
            }}
          >
            {goal.title}
            {goal.isAchieved === 'Y' && (
              <span
                style={{
                  marginLeft: 8,
                  padding: '1px 6px',
                  background: 'var(--bg-brand-subtle)',
                  color: 'var(--fg-brand-strong)',
                  fontSize: 'var(--text-badge)',
                  fontWeight: '600',
                  borderRadius: 'var(--radius-sm)',
                  verticalAlign: 'middle',
                }}
              >
                {t('achieved')}
              </span>
            )}
          </div>
          <div
            className="num"
            style={{
              fontSize: 'var(--text-display-md)',
              fontWeight: '800',
              letterSpacing: '-0.022em',
              color: 'var(--fg-primary)',
              marginTop: 4,
            }}
          >
            {pct.toFixed(0)}%
          </div>
          <div
            style={{
              height: 6,
              background: 'var(--bg-sunken)',
              borderRadius: 'var(--radius-pill)',
              overflow: 'hidden',
              marginTop: 12,
            }}
          >
            <div
              style={{
                width: `${Math.min(100, pct)}%`,
                height: '100%',
                background: color,
                borderRadius: 'var(--radius-pill)',
              }}
            />
          </div>
        </div>

        {/* Field rows */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
          }}
        >
          <FieldRow
            label={t('savingGoal.targetAmount')}
            value={
              <span className="num" style={{ fontWeight: '700' }}>
                {money(goal.targetAmount)}
              </span>
            }
          />
          <FieldRow
            label={t('savingGoal.currentAmount')}
            value={
              <span className="num" style={{ fontWeight: '700', color }}>
                {money(goal.currentAmount)}
              </span>
            }
          />
          <FieldRow
            label={t('savingGoal.remaining')}
            value={
              <span className="num" style={{ fontWeight: '600' }}>
                {money(remaining)}
              </span>
            }
          />
          <FieldRow
            label={t('savingGoal.deadline')}
            value={<span style={{ fontWeight: '500' }}>{deadline ?? t('anytime')}</span>}
          />
          {goal.isAchieved === 'Y' && goal.achievedAt && (
            <FieldRow
              label={t('savingGoal.achievedAt')}
              value={
                <span style={{ fontWeight: '500' }}>{goal.achievedAt.slice(0, 10)}</span>
              }
            />
          )}
        </div>
      </ModalShell>

      {confirmDelete && (
        <ConfirmDialog
          title={t('savingGoal.deleteTitle')}
          message={t('savingGoal.deleteConfirm', { title: goal.title })}
          confirmLabel={tc('delete')}
          danger
          loading={deleteMut.isPending}
          onCancel={() => !deleteMut.isPending && setConfirmDelete(false)}
          onConfirm={() => deleteMut.mutate(goal.rowId, { onSuccess: onClose })}
        />
      )}
    </>
  )
}

/** 상세 필드 행 — TxDetailDialog FieldRow 미러. */
function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '14px 16px',
        background: 'var(--bg-surface)',
        fontSize: 'var(--text-label-sm)',
        gap: 12,
      }}
    >
      <span style={{ color: 'var(--fg-tertiary)', minWidth: 72, flexShrink: 0 }}>{label}</span>
      <div style={{ marginLeft: 'auto' }}>{value}</div>
    </div>
  )
}
