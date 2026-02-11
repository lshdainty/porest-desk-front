import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Plus,
  Loader2,
  Users,
  Check,
  CheckCheck,
  Trash2,
  Pencil,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { cn } from '@/shared/lib'
import { useIsMobile } from '@/shared/hooks'
import { Button } from '@/shared/ui/button'
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
import type { DutchPay, DutchPayFormValues } from '@/entities/dutch-pay'
import {
  useDutchPays,
  useCreateDutchPay,
  useUpdateDutchPay,
  useDeleteDutchPay,
  useMarkParticipantPaid,
  useSettleAll,
} from '@/features/dutch-pay'
import { DutchPayForm } from './DutchPayForm'

export const DutchPayFullWidget = () => {
  const { t } = useTranslation('dutchPay')
  const { t: tc } = useTranslation('common')
  const isMobile = useIsMobile()

  const { data: dutchPays = [], isLoading } = useDutchPays()
  const createDutchPay = useCreateDutchPay()
  const updateDutchPay = useUpdateDutchPay()
  const deleteDutchPay = useDeleteDutchPay()
  const markPaid = useMarkParticipantPaid()
  const settleAll = useSettleAll()

  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<DutchPay | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'settled'>('all')

  const filteredDutchPays = dutchPays.filter(dp => {
    if (filter === 'active') return !dp.isSettled
    if (filter === 'settled') return dp.isSettled
    return true
  })

  const handleCreate = useCallback((data: DutchPayFormValues) => {
    createDutchPay.mutate(data, {
      onSuccess: () => setShowForm(false),
    })
  }, [createDutchPay])

  const handleUpdate = useCallback((data: DutchPayFormValues) => {
    if (!editingItem) return
    updateDutchPay.mutate(
      { id: editingItem.rowId, data },
      {
        onSuccess: () => {
          setEditingItem(null)
          setShowForm(false)
        },
      }
    )
  }, [editingItem, updateDutchPay])

  const handleFormSubmit = useCallback((data: DutchPayFormValues) => {
    if (editingItem) {
      handleUpdate(data)
    } else {
      handleCreate(data)
    }
  }, [editingItem, handleUpdate, handleCreate])

  const handleFormClose = useCallback(() => {
    setShowForm(false)
    setEditingItem(null)
  }, [])

  const handleEdit = useCallback((dp: DutchPay) => {
    setEditingItem(dp)
    setShowForm(true)
  }, [])

  const handleDelete = useCallback(() => {
    if (showDeleteConfirm === null) return
    deleteDutchPay.mutate(showDeleteConfirm, {
      onSuccess: () => setShowDeleteConfirm(null),
    })
  }, [showDeleteConfirm, deleteDutchPay])

  const handleMarkPaid = useCallback((dutchPayId: number, participantId: number) => {
    markPaid.mutate({ dutchPayId, participantId })
  }, [markPaid])

  const handleSettleAll = useCallback((id: number) => {
    settleAll.mutate(id)
  }, [settleAll])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex items-center gap-2">
        {(['all', 'active', 'settled'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              filter === f
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            {t(`filter.${f}`)}
          </button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground">
          {filteredDutchPays.length}{t('count')}
        </span>
      </div>

      {/* Dutch pay list */}
      {filteredDutchPays.length === 0 ? (
        <div className="py-12 text-center">
          <Users className="mx-auto mb-2 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">{t('empty')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDutchPays.map(dp => {
            const paidCount = dp.participants.filter(p => p.isPaid).length
            const totalParticipants = dp.participants.length
            const isExpanded = expandedId === dp.rowId

            return (
              <div
                key={dp.rowId}
                className={cn(
                  'rounded-lg border transition-colors',
                  dp.isSettled && 'border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20'
                )}
              >
                {/* Header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : dp.rowId)}
                  className="flex w-full items-center gap-3 p-3 text-left"
                >
                  <div
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                      dp.isSettled
                        ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
                        : 'bg-primary/10 text-primary'
                    )}
                  >
                    {dp.isSettled ? <CheckCheck size={18} /> : <Users size={18} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">{dp.title}</p>
                      {dp.isSettled && (
                        <span className="shrink-0 rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900 dark:text-green-300">
                          {t('settled')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{dp.dutchPayDate}</span>
                      <span>{paidCount}/{totalParticipants} {t('participants')}</span>
                    </div>
                  </div>
                  <span className="shrink-0 text-sm font-semibold">
                    {formatCurrency(dp.totalAmount)}{t('currency')}
                  </span>
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t px-3 pb-3 pt-2 space-y-2">
                    {dp.description && (
                      <p className="text-xs text-muted-foreground">{dp.description}</p>
                    )}

                    <div className="text-xs text-muted-foreground">
                      {t(`splitMethod.${dp.splitMethod}`)} | {t('perPerson')}: {formatCurrency(Math.round(dp.totalAmount / Math.max(totalParticipants, 1)))}{t('currency')}
                    </div>

                    {/* Progress bar */}
                    <div className="h-1.5 w-full rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-green-500 transition-all"
                        style={{ width: `${totalParticipants > 0 ? (paidCount / totalParticipants) * 100 : 0}%` }}
                      />
                    </div>

                    {/* Participants */}
                    <div className="space-y-1">
                      {dp.participants.map(p => (
                        <div
                          key={p.rowId}
                          className="flex items-center gap-2 rounded-md border px-2.5 py-1.5"
                        >
                          <button
                            onClick={() => !p.isPaid && handleMarkPaid(dp.rowId, p.rowId)}
                            disabled={p.isPaid || markPaid.isPending}
                            className={cn(
                              'flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors',
                              p.isPaid
                                ? 'border-green-500 bg-green-500 text-white'
                                : 'border-muted-foreground/40 hover:border-primary'
                            )}
                          >
                            {p.isPaid && <Check size={12} />}
                          </button>
                          <span className={cn(
                            'flex-1 text-sm',
                            p.isPaid && 'text-muted-foreground line-through'
                          )}>
                            {p.participantName}
                          </span>
                          <span className="text-xs font-medium">
                            {formatCurrency(p.amount)}{t('currency')}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                      {!dp.isSettled && (
                        <Button
                          size="sm"
                          className="h-7 bg-green-600 text-xs hover:bg-green-700"
                          onClick={() => handleSettleAll(dp.rowId)}
                          disabled={settleAll.isPending}
                        >
                          <CheckCheck size={12} />
                          {t('settleAll')}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => handleEdit(dp)}
                      >
                        <Pencil size={12} />
                        {tc('edit')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs text-destructive hover:bg-destructive/10"
                        onClick={() => setShowDeleteConfirm(dp.rowId)}
                      >
                        <Trash2 size={12} />
                        {tc('delete')}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add button */}
      {isMobile ? (
        <button
          onClick={() => setShowForm(true)}
          className={cn(
            'fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center',
            'rounded-full bg-primary text-primary-foreground shadow-lg',
            'hover:bg-primary/90 active:scale-95 transition-all'
          )}
        >
          <Plus size={24} />
        </button>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/20 py-3 text-sm text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
        >
          <Plus size={16} />
          {t('addDutchPay')}
        </button>
      )}

      {/* Form dialog */}
      {showForm && (
        <DutchPayForm
          dutchPay={editingItem}
          onSubmit={handleFormSubmit}
          onClose={handleFormClose}
          isLoading={createDutchPay.isPending || updateDutchPay.isPending}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteConfirm !== null} onOpenChange={() => setShowDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteConfirm.title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteConfirm.message')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tc('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteDutchPay.isPending}>
              {deleteDutchPay.isPending ? '...' : tc('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
