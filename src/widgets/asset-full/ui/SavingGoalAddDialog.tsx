import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertCircle } from 'lucide-react'
import { DynamicIcon } from 'lucide-react/dynamic'
import type { IconName } from 'lucide-react/dynamic'
import { ModalShell } from '@/shared/ui/porest/dialogs'
import { ModalFooter } from '@/shared/ui/porest/modal-footer'
import { Input } from '@/shared/ui/input'
import { Field, FieldLabel } from '@/shared/ui/field'
import { InputDatePicker } from '@/shared/ui/input-date-picker'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog'
import {
  useContributeSavingGoal,
  useCreateSavingGoal,
  useDeleteSavingGoal,
  useUpdateSavingGoal,
} from '@/features/savingGoal'
import type { SavingGoal } from '@/entities/savingGoal'
import { tileRadius } from '@/shared/lib'
import { ColorSwatchGroup } from '@/shared/ui/color-swatch'
import { CAT_PALETTE } from '@/shared/lib/porest/chart-palette'
import { i18n } from '@/shared/i18n/config'

const GOAL_ICONS: { k: IconName; labelKey: string }[] = [
  { k: 'plane', labelKey: 'savingGoal.iconTravel' },
  { k: 'shield', labelKey: 'savingGoal.iconEmergency' },
  { k: 'laptop', labelKey: 'savingGoal.iconElectronics' },
  { k: 'home', labelKey: 'savingGoal.iconHousing' },
  { k: 'graduation-cap', labelKey: 'savingGoal.iconEducation' },
  { k: 'gift', labelKey: 'savingGoal.iconGift' },
  { k: 'car', labelKey: 'savingGoal.iconCar' },
  { k: 'heart', labelKey: 'savingGoal.iconHealth' },
  { k: 'piggy-bank', labelKey: 'savingGoal.iconSaving' },
  { k: 'wallet', labelKey: 'savingGoal.iconWallet' },
]

// 날짜는 현재 로케일로 포맷 — ko `2026년 3월` / en `March 2026`. 기한 없음은 asset ns.
function formatDeadlineLabel(iso: string): string {
  if (!iso) return i18n.t('asset:savingGoal.noDeadline')
  const d = new Date(iso)
  if (isNaN(d.getTime())) return i18n.t('asset:savingGoal.noDeadline')
  return new Intl.DateTimeFormat(i18n.language, { year: 'numeric', month: 'long' }).format(d)
}

function fmtNum(n: number): string {
  if (!n) return ''
  return n.toLocaleString('ko-KR')
}

function parseNum(v: string): number {
  const n = parseInt(v.replace(/[^0-9]/g, ''), 10)
  return isNaN(n) ? 0 : n
}

interface SavingGoalAddDialogProps {
  /** null/undefined → 생성 모드, 객체 → 수정 모드 */
  goal?: SavingGoal | null
  mobile: boolean
  onClose: () => void
}

export function SavingGoalAddDialog({ goal, mobile, onClose }: SavingGoalAddDialogProps) {
  const { t } = useTranslation('asset')
  const { t: tc } = useTranslation('common')
  const isEdit = !!goal

  const [title, setTitle] = useState<string>(goal?.title ?? '')
  const [targetStr, setTargetStr] = useState<string>(
    goal?.targetAmount ? fmtNum(goal.targetAmount) : '',
  )
  const [currentStr, setCurrentStr] = useState<string>(
    goal?.currentAmount ? fmtNum(goal.currentAmount) : '',
  )
  const [deadlineDate, setDeadlineDate] = useState<string>(goal?.deadlineDate ?? '')
  const [icon, setIcon] = useState<IconName>(((goal?.icon as IconName) || 'piggy-bank') as IconName)
  const [color, setColor] = useState<string>(goal?.color ?? CAT_PALETTE[0]!.baseHex)
  const [err, setErr] = useState<string>('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const createMut = useCreateSavingGoal()
  const updateMut = useUpdateSavingGoal()
  const contributeMut = useContributeSavingGoal()
  const deleteMut = useDeleteSavingGoal()

  const target = parseNum(targetStr)
  const current = parseNum(currentStr)
  const pct = target > 0 ? (current / target) * 100 : 0

  const handleSubmit = () => {
    const trimmed = title.trim()
    if (!trimmed) {
      setErr(t('savingGoal.errName'))
      return
    }
    if (target <= 0) {
      setErr(t('savingGoal.errAmount'))
      return
    }
    if (current > target) {
      setErr(t('savingGoal.errCurrentExceeds'))
      return
    }
    setErr('')

    if (isEdit && goal) {
      updateMut.mutate(
        {
          id: goal.rowId,
          data: {
            title: trimmed,
            targetAmount: target,
            deadlineDate: deadlineDate || null,
            icon,
            color,
          },
        },
        {
          onSuccess: () => {
            const diff = current - goal.currentAmount
            if (diff !== 0) {
              contributeMut.mutate(
                { id: goal.rowId, data: { amount: diff } },
                { onSuccess: () => onClose() },
              )
            } else {
              onClose()
            }
          },
        },
      )
    } else {
      createMut.mutate(
        {
          title: t,
          targetAmount: target,
          deadlineDate: deadlineDate || null,
          icon,
          color,
          currency: 'KRW',
        },
        {
          onSuccess: created => {
            if (current > 0) {
              contributeMut.mutate(
                { id: created.rowId, data: { amount: current } },
                { onSuccess: () => onClose() },
              )
            } else {
              onClose()
            }
          },
        },
      )
    }
  }

  const handleDelete = () => {
    if (!goal) return
    setShowDeleteConfirm(true)
  }

  const handleConfirmDelete = () => {
    if (!goal) return
    deleteMut.mutate(goal.rowId, {
      onSuccess: () => {
        setShowDeleteConfirm(false)
        onClose()
      },
    })
  }

  const Footer = (
    <ModalFooter
      onSave={handleSubmit}
      saveLabel={isEdit ? tc('save') : tc('add')}
      saving={createMut.isPending || updateMut.isPending || contributeMut.isPending}
      onCancel={onClose}
      onDelete={isEdit ? handleDelete : undefined}
      deleting={deleteMut.isPending}
    />
  )

  return (
    <ModalShell
      title={isEdit ? t('savingGoal.titleEdit') : t('savingGoal.titleAdd')}
      onClose={onClose}
      mobile={mobile}
      size="md"
      footer={Footer}
    >
      {/* Preview */}
      <div
        style={{
          padding: 16,
          background: 'var(--bg-canvas)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          marginBottom: 18,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <span
            style={{
              width: 36,
              height: 36,
              borderRadius: tileRadius(36),
              background: `oklch(from ${color} l c h / 0.12)`,
              color,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <DynamicIcon name={icon} size={17} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 'var(--text-body-sm)',
                fontWeight: '700',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {title || t('savingGoal.name')}
            </div>
            <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)' }}>
              {formatDeadlineLabel(deadlineDate)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="num" style={{ fontSize: 'var(--text-body-sm)', fontWeight: '700' }}>
              {pct.toFixed(0)}%
            </div>
            <div className="num" style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)' }}>
              {current.toLocaleString('ko-KR')} / {target.toLocaleString('ko-KR')}
            </div>
          </div>
        </div>
        <div
          style={{
            height: 6,
            background: 'var(--bg-sunken)',
            borderRadius: 'var(--radius-pill)',
            overflow: 'hidden',
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

      <Field style={{ marginBottom: 14 }}>
        <FieldLabel>{t('savingGoal.name')}</FieldLabel>
        <Input
          value={title}
          onChange={e => {
            setTitle(e.target.value)
            setErr('')
          }}
          placeholder={t('savingGoal.namePlaceholder')}
          autoFocus
        />
      </Field>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          marginBottom: 14,
        }}
      >
        <Field>
          <FieldLabel>{t('savingGoal.targetAmount')}</FieldLabel>
          <div style={{ position: 'relative' }}>
            <Input
              className="num"
              value={fmtNum(parseNum(targetStr))}
              onChange={e => {
                setTargetStr(e.target.value)
                setErr('')
              }}
              placeholder="0"
              inputMode="numeric"
              style={{ paddingRight: 28, textAlign: 'right' }}
            />
            <span
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 'var(--text-label-sm)',
                color: 'var(--fg-tertiary)',
                pointerEvents: 'none',
              }}
            >
              원
            </span>
          </div>
        </Field>
        <Field>
          <FieldLabel>{t('savingGoal.currentAmount')}</FieldLabel>
          <div style={{ position: 'relative' }}>
            <Input
              className="num"
              value={fmtNum(parseNum(currentStr))}
              onChange={e => {
                setCurrentStr(e.target.value)
                setErr('')
              }}
              placeholder="0"
              inputMode="numeric"
              style={{ paddingRight: 28, textAlign: 'right' }}
            />
            <span
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 'var(--text-label-sm)',
                color: 'var(--fg-tertiary)',
                pointerEvents: 'none',
              }}
            >
              원
            </span>
          </div>
        </Field>
      </div>

      <Field style={{ marginBottom: 14 }}>
        <FieldLabel>
          {t('savingGoal.deadline')} <span style={{ color: 'var(--fg-tertiary)', fontWeight: '400' }}>{t('savingGoal.optional')}</span>
        </FieldLabel>
        <InputDatePicker
          value={deadlineDate}
          onValueChange={v => setDeadlineDate(v ?? '')}
        />
      </Field>

      <Field style={{ marginBottom: 14 }}>
        <FieldLabel>{t('form.icon')}</FieldLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 6 }}>
          {GOAL_ICONS.map(g => {
            const active = icon === g.k
            return (
              <button
                key={g.k}
                type="button"
                title={t(g.labelKey)}
                onClick={() => setIcon(g.k)}
                style={{
                  aspectRatio: '1 / 1',
                  borderRadius: 'var(--radius-tile)',
                  background: active
                    ? `oklch(from ${color} l c h / 0.14)`
                    : 'var(--bg-surface)',
                  border: active
                    ? `1.5px solid ${color}`
                    : '1px solid var(--border-subtle)',
                  color: active ? color : 'var(--fg-secondary)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'inherit',
                }}
              >
                <DynamicIcon name={g.k} size={16} />
              </button>
            )
          })}
        </div>
      </Field>

      <Field>
        <FieldLabel>{t('form.color')}</FieldLabel>
        <ColorSwatchGroup
          columns={5}
          value={color}
          onValueChange={setColor}
          options={CAT_PALETTE.map((p, i) => ({
            value: p.baseHex,
            bg: p.bg,
            fg: p.color,
            label: t('savingGoal.colorSwatch', { n: i + 1 }),
          }))}
        />
      </Field>

      {err && (
        <div
          style={{
            marginTop: 14,
            padding: '10px 12px',
            background: 'oklch(0.96 0.04 20)',
            border: '1px solid color-mix(in oklch, var(--fg-expense) 30%, transparent)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--text-label-sm)',
            color: 'var(--fg-expense)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <AlertCircle size={13} /> {err}
        </div>
      )}

      <AlertDialog
        open={showDeleteConfirm}
        onOpenChange={(open) => {
          if (!open) setShowDeleteConfirm(false)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('savingGoal.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {goal ? t('savingGoal.deleteConfirm', { title: goal.title }) : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tc('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              loading={deleteMut.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {tc('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ModalShell>
  )
}
