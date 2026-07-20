import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronUp, Repeat, Scissors, Split, Users } from 'lucide-react'
import { KRW, money, isEn } from '@/shared/lib/porest/format'
import { HideUnit, MaskAmount, WonUnit } from '@/shared/lib/porest/hide-amounts'
import { wonPre } from '@/shared/lib/porest/hide-amounts-core'
import { renderIcon } from '@/shared/lib'
import { ConfirmDialog, ModalShell } from '@/shared/ui/porest/dialogs'
import { ModalViewFooter } from '@/shared/ui/porest/modal-footer'
import { ExpenseRow } from '@/shared/ui/porest/expense-row'
import {
  useDeleteExpense,
  useExpenseCategories,
  useSearchExpenses,
} from '@/features/expense'
import { useExpenseSplits } from '@/features/expense-split'
import { useRecurringTransactions } from '@/features/recurring-transaction'
import { useDutchPays } from '@/features/dutch-pay'
import { useAssets } from '@/features/asset'
import type { Expense, ExpenseCategory } from '@/entities/expense'
import type { Asset } from '@/entities/asset'
import { getPaletteByColor } from './CategoryEditDialog'
import { SplitTxDialog } from './SplitTxDialog'
import { RecurringFromTxDialog } from './RecurringFromTxDialog'
import { DutchPayFromTxDialog } from './DutchPayFromTxDialog'
import { Skeleton as SkeletonBase } from '@/shared/ui/skeleton'

const toDayKey = (iso?: string | null): string => (iso ? iso.slice(0, 10) : '')
const toTimeKey = (iso?: string | null): string | null => {
  if (!iso || iso.length < 16) return null
  const t = iso.slice(11, 16)
  return t === '00:00' ? null : t
}

type Props = {
  expense: Expense
  onClose: () => void
  /** 부모가 AddTxSheet 편집 모드를 여는 콜백 */
  onEdit?: (expense: Expense) => void
  mobile: boolean
}

export function TxDetailDialog({ expense, onClose, onEdit, mobile }: Props) {
  const { t } = useTranslation('expense')
  const { t: tc } = useTranslation('common')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [openSub, setOpenSub] = useState<'split' | 'recurring' | 'dutch' | null>(null)
  const [splitExpanded, setSplitExpanded] = useState(true)
  const deleteMut = useDeleteExpense()

  const categoriesQ = useExpenseCategories()
  const assetsQ = useAssets()
  const splitsQ = useExpenseSplits(expense.rowId)
  const recurringsQ = useRecurringTransactions()
  const dutchPaysQ = useDutchPays()

  const isLoading =
    categoriesQ.isLoading ||
    assetsQ.isLoading ||
    splitsQ.isLoading ||
    recurringsQ.isLoading ||
    dutchPaysQ.isLoading

  const linkedRecurring = (recurringsQ.data ?? []).filter(
    r => r.sourceExpenseRowId === expense.rowId,
  )
  const linkedDutchPays = (dutchPaysQ.data ?? []).filter(
    d => d.sourceExpenseRowId === expense.rowId,
  )
  const splitCount = splitsQ.data?.length ?? 0

  const category: ExpenseCategory | undefined = (categoriesQ.data ?? []).find(
    c => c.rowId === expense.categoryRowId,
  )
  const palette = getPaletteByColor(category?.color)
  const asset: Asset | undefined = (assetsQ.data?.assets ?? []).find(
    a => a.rowId === expense.assetRowId,
  )

  const isIncome = expense.expenseType === 'INCOME'

  // 같은 가맹점의 같은 달 거래 (상세 제외)
  const merchantKey = expense.merchant?.trim() ?? ''
  const [yStr, mStr] = (expense.expenseDate ?? '').slice(0, 7).split('-')
  const year = Number(yStr)
  const month = Number(mStr)
  const pad = (n: number) => String(n).padStart(2, '0')
  const startDate = year && month ? `${year}-${pad(month)}-01` : undefined
  const endDate = year && month
    ? `${year}-${pad(month)}-${pad(new Date(year, month, 0).getDate())}`
    : undefined

  const historyQ = useSearchExpenses(
    merchantKey
      ? { merchant: merchantKey, startDate, endDate }
      : {},
  )

  const history = useMemo(() => {
    if (!historyQ.data) return []
    return historyQ.data
      .filter(t => t.rowId !== expense.rowId)
      .sort((a, b) => b.expenseDate.localeCompare(a.expenseDate))
      .slice(0, 5)
  }, [historyQ.data, expense.rowId])

  const merchantMonthCount = historyQ.data?.length ?? 0
  const merchantMonthTotal = (historyQ.data ?? []).reduce(
    (s, t) => s + Math.abs(t.amount),
    0,
  )

  const day = toDayKey(expense.expenseDate)
  const time = toTimeKey(expense.expenseDate)
  const paymentMethodLabel = (() => {
    switch (expense.paymentMethod) {
      case 'CASH': return t('form.paymentMethod.CASH')
      case 'CARD': return t('form.paymentMethod.CARD')
      case 'TRANSFER': return t('paymentTransferFull')
      case 'OTHER': return t('form.paymentMethod.OTHER')
      default: return null
    }
  })()

  const handleEdit = () => {
    if (!onEdit) return
    onEdit(expense)
  }

  const handleConfirmDelete = () => {
    deleteMut.mutate(expense.rowId, {
      onSuccess: () => {
        setConfirmDelete(false)
        onClose()
      },
    })
  }

  const Footer = (
    <ModalViewFooter
      onDelete={() => setConfirmDelete(true)}
      deleting={deleteMut.isPending}
      onEdit={onEdit ? handleEdit : undefined}
      onConfirm={onClose}
    />
  )

  const title = isIncome ? t('txDetail.incomeTitle') : t('txDetail.expenseTitle')
  const amountColor = isIncome ? 'var(--fg-brand)' : 'var(--fg-primary)'
  const displayMerchant = expense.merchant ?? expense.description ?? category?.categoryName ?? t('transaction')

  return (
    <>
      <ModalShell
        title={title}
        onClose={onClose}
        size="md"
        footer={Footer}
        mobile={mobile}
      >
        {isLoading ? (
          <TxDetailSkeleton />
        ) : (
        <>
        {/* Hero */}
        <div
          style={{
            background: `linear-gradient(135deg, ${palette.bg}, var(--bg-surface))`,
            border: `1px solid color-mix(in oklch, ${palette.color} 20%, transparent)`,
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
                borderRadius: 'var(--radius-tile)',
                background: palette.bg,
                color: palette.color,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {renderIcon(category?.icon ?? 'tag', category?.categoryName?.charAt(0) ?? '·', 20)}
            </span>
          </div>
          <div
            style={{
              fontSize: 'var(--text-label-sm)',
              color: 'var(--fg-secondary)',
              fontWeight: '500',
              marginBottom: 4,
            }}
          >
            {displayMerchant}
          </div>
          <div
            className="num"
            style={{
              fontSize: 'var(--text-display-md)',
              fontWeight: '800',
              letterSpacing: '-0.022em',
              color: amountColor,
            }}
          >
            <MaskAmount>
              {isIncome ? '+' : '−'}
              {wonPre()}
              {KRW(expense.amount, { abs: true })}
            </MaskAmount>
            {!isEn() && (
              <HideUnit>
                <span style={{ fontSize: 'var(--text-title-md)', marginLeft: 2 }}>원</span>
              </HideUnit>
            )}
          </div>
          {(day || time) && (
            <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', marginTop: 6 }}>
              {day}
              {time && ` · ${time}`}
            </div>
          )}
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
            label={t('category')}
            value={
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 'var(--radius-xs)',
                    background: palette.color,
                  }}
                />
                <span style={{ fontWeight: '600' }}>
                  {category?.categoryName ?? t('txDetail.uncategorized')}
                </span>
              </div>
            }
          />
          <FieldRow
            label={t('form.amount')}
            value={
              <span className="num" style={{ fontWeight: '700' }}>
                <MaskAmount>
                  {isIncome ? '+' : '−'}
                  {wonPre()}
                  {KRW(expense.amount, { abs: true })}
                </MaskAmount>
                <WonUnit />
              </span>
            }
          />
          {asset && (
            <FieldRow
              label={t('accountCard')}
              value={
                <span style={{ fontWeight: '500' }}>
                  {asset.institution
                    ? `${asset.institution} · ${asset.assetName}`
                    : asset.assetName}
                </span>
              }
            />
          )}
          {paymentMethodLabel && (
            <FieldRow
              label={t('paymentMethodLabel')}
              value={<span style={{ fontWeight: '500' }}>{paymentMethodLabel}</span>}
            />
          )}
          <FieldRow
            label={t('dateTime')}
            value={
              <span style={{ fontWeight: '500' }}>
                {day}
                {time && ` ${time}`}
              </span>
            }
          />
          <FieldRow
            label={t('memo')}
            value={
              <span
                style={{
                  fontWeight: '500',
                  color: expense.description
                    ? 'var(--fg-primary)'
                    : 'var(--fg-tertiary)',
                }}
              >
                {expense.description || t('txDetail.empty')}
              </span>
            }
          />
        </div>

        {/* Quick actions — 분할/반복/더치페이 진입 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginTop: 16 }}>
          <QuickBtn
            Icon={Scissors}
            label={t('splitTitle')}
            badge={splitCount > 0 ? t('txDetail.countItems', { count: splitCount }) : null}
            onClick={() => setOpenSub('split')}
          />
          <QuickBtn
            Icon={Repeat}
            label={t('txDetail.recurring')}
            badge={linkedRecurring.length > 0 ? t('txDetail.linked') : null}
            onClick={() => setOpenSub('recurring')}
          />
          <QuickBtn
            Icon={Users}
            label={t('txDetail.dutchPay')}
            badge={linkedDutchPays.length > 0 ? t('txDetail.countCases', { count: linkedDutchPays.length }) : null}
            onClick={() => setOpenSub('dutch')}
          />
        </div>

        {/* 분할 내역 요약 — 분할이 있으면 접을 수 있는 카드로 항목·비율 표시 */}
        {splitCount > 0 && (
          <div style={{ marginTop: 12, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <button
              type="button"
              onClick={() => setSplitExpanded(v => !v)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <Split size={16} style={{ color: 'var(--fg-brand)', flexShrink: 0 }} />
              <span style={{ fontSize: 'var(--text-label-sm)', fontWeight: '700', color: 'var(--fg-primary)' }}>{t('splitTitle')} {t('txDetail.countItems', { count: splitCount })}</span>
              <span className="num" style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)' }}>{t('txDetail.sumLabel')} {money(Math.abs(expense.amount))}</span>
              <span style={{ marginLeft: 'auto', color: 'var(--fg-tertiary)', display: 'inline-flex' }}>
                {splitExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </span>
            </button>
            {splitExpanded && (
              <div style={{ padding: '0 14px 12px' }}>
                <div style={{ display: 'flex', height: 8, borderRadius: 'var(--radius-pill)', overflow: 'hidden', background: 'var(--bg-sunken)' }}>
                  {(splitsQ.data ?? []).map(s => {
                    const total = Math.abs(expense.amount)
                    const ratio = total > 0 ? s.amount / total : 0
                    const cat = (categoriesQ.data ?? []).find(c => c.rowId === s.categoryRowId)
                    return ratio > 0 ? (
                      <div key={s.rowId} style={{ width: `${ratio * 100}%`, background: getPaletteByColor(cat?.color).color }} />
                    ) : null
                  })}
                </div>
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {(splitsQ.data ?? []).map(s => {
                    const total = Math.abs(expense.amount)
                    const pct = total > 0 ? Math.round((s.amount / total) * 100) : 0
                    const cat = (categoriesQ.data ?? []).find(c => c.rowId === s.categoryRowId)
                    const pal = getPaletteByColor(cat?.color)
                    return (
                      <div key={s.rowId} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: 'var(--radius-xs)', background: pal.color, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 'var(--text-label-sm)', fontWeight: '600', color: 'var(--fg-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {(s.label && s.label.trim()) ? s.label : (s.categoryName ?? t('item'))}
                          </div>
                          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)' }}>{s.categoryName ?? '-'} · {pct}%</div>
                        </div>
                        <div className="num" style={{ fontSize: 'var(--text-label-sm)', fontWeight: '700', color: isIncome ? 'var(--fg-income)' : 'var(--fg-expense)' }}>
                          {isIncome ? '+' : '−'}{money(s.amount)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Merchant history */}
        {merchantKey && history.length > 0 && (
          <div style={{ marginTop: 22 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 8 }}>
              <h4 style={{ fontSize: 'var(--text-label-sm)', fontWeight: '700', margin: 0 }}>
                {t('txDetail.prevAtMerchant', { merchant: merchantKey })}
              </h4>
              <span style={{ marginLeft: 'auto', fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)' }}>
                {t('txDetail.thisMonth')}{' '}
                <b className="num" style={{ color: 'var(--fg-secondary)' }}>
                  {t('txDetail.countTimes', { count: merchantMonthCount })} · <MaskAmount>{wonPre()}{KRW(merchantMonthTotal)}</MaskAmount>
                  <WonUnit />
                </b>
              </span>
            </div>
            <div
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '4px 14px',
              }}
            >
              {history.map(t => (
                <ExpenseRow key={t.rowId} expense={t} />
              ))}
            </div>
          </div>
        )}
        </>
        )}
      </ModalShell>

      {confirmDelete && (
        <ConfirmDialog
          title={t('deleteConfirm.title')}
          message={t('txDetail.deleteMessage', { name: `"${displayMerchant}"` })}
          confirmLabel={tc('delete')}
          danger
          loading={deleteMut.isPending}
          onCancel={() => !deleteMut.isPending && setConfirmDelete(false)}
          onConfirm={handleConfirmDelete}
        />
      )}

      {openSub === 'split' && (
        <SplitTxDialog expense={expense} onClose={() => setOpenSub(null)} mobile={mobile} />
      )}
      {openSub === 'recurring' && (
        <RecurringFromTxDialog expense={expense} onClose={() => setOpenSub(null)} mobile={mobile} />
      )}
      {openSub === 'dutch' && (
        <DutchPayFromTxDialog expense={expense} onClose={() => setOpenSub(null)} mobile={mobile} />
      )}
    </>
  )
}

/** TxDetail skeleton — hero(아이콘+가맹점+금액+날짜) + 필드 5행 + quick actions 3개. */
function TxDetailSkeleton() {
  return (
    <>
      {/* Hero */}
      <div
        style={{
          background: 'var(--bg-sunken)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          padding: 22,
          marginBottom: 18,
          textAlign: 'center',
        }}
      >
        <div style={{ display: 'inline-flex', marginBottom: 12 }}>
          <SkeletonBase className="h-10 w-10 rounded-lg" />
        </div>
        <SkeletonBase className="h-4 w-32 mx-auto mb-2" />
        <SkeletonBase className="h-10 w-48 mx-auto" />
        <SkeletonBase className="h-3 w-28 mx-auto mt-2" />
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
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '14px 16px',
              gap: 12,
              borderTop: i === 0 ? 'none' : '1px solid var(--border-subtle)',
            }}
          >
            <SkeletonBase className="h-4 w-16" />
            <SkeletonBase className="h-4 w-24 ml-auto" />
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginTop: 16 }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              padding: '16px 4px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <SkeletonBase className="h-5 w-5 rounded-md" />
            <SkeletonBase className="h-3 w-14" />
          </div>
        ))}
      </div>
    </>
  )
}

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
      <span style={{ color: 'var(--fg-tertiary)', minWidth: 72, flexShrink: 0 }}>
        {label}
      </span>
      <div style={{ marginLeft: 'auto' }}>{value}</div>
    </div>
  )
}

function QuickBtn({
  Icon,
  label,
  onClick,
  badge,
}: {
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number; color?: string }>
  label: string
  onClick?: () => void
  badge?: string | null
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        padding: '16px 4px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        cursor: onClick ? 'pointer' : 'not-allowed',
        fontFamily: 'inherit',
        color: 'var(--fg-secondary)',
        opacity: onClick ? 1 : 0.55,
      }}
      disabled={!onClick}
    >
      <Icon size={18} strokeWidth={1.9} />
      <span style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-secondary)', fontWeight: '600' }}>
        {label}
      </span>
      {badge && (
        <span
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            fontSize: 'var(--text-badge)',
            fontWeight: '700',
            padding: '2px 6px',
            borderRadius: 'var(--radius-pill)',
            background: 'var(--bg-brand-subtle)',
            color: 'var(--fg-brand-strong)',
          }}
        >
          {badge}
        </span>
      )}
    </button>
  )
}
