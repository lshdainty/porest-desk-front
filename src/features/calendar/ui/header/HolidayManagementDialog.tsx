import { useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Edit3, Trash2, Plus, RotateCcw } from 'lucide-react'

import {
  useCalendarHolidays,
  useCreateHoliday,
  useUpdateHoliday,
  useDeleteHoliday,
} from '@/features/calendar/model/useCalendarHolidays'
import type { Holiday, HolidayType } from '@/entities/calendar'
import type { HolidayFormValues } from '@/features/calendar/api/holidayApi'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { InputDatePicker } from '@/shared/ui/input-date-picker'
import { Label } from '@/shared/ui/label'
import { Badge } from '@/shared/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { ModalShell } from '@/shared/ui/porest/dialogs'
import { useIsMobile } from '@/shared/hooks'
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

interface HolidayManagementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const HOLIDAY_TYPES: HolidayType[] = ['PUBLIC', 'SUBSTITUTE', 'CUSTOM']

export const HolidayManagementDialog = ({
  open,
  onOpenChange,
}: HolidayManagementDialogProps) => {
  const { t } = useTranslation('calendar')
  const { t: tc } = useTranslation('common')
  const isMobile = useIsMobile()

  const currentYear = new Date().getFullYear()
  const startDate = `${currentYear}-01-01`
  const endDate = `${currentYear}-12-31`

  const { data: holidays } = useCalendarHolidays(startDate, endDate, open)
  const createHoliday = useCreateHoliday()
  const updateHoliday = useUpdateHoliday()
  const deleteHoliday = useDeleteHoliday()

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Holiday | null>(null)
  const [formDate, setFormDate] = useState('')
  const [formName, setFormName] = useState('')
  const [formType, setFormType] = useState<HolidayType>('PUBLIC')
  const [formRecurring, setFormRecurring] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<Holiday | null>(null)

  const allHolidays = useMemo(() => {
    if (!holidays) return []
    return [...holidays].sort((a, b) => a.holidayDate.localeCompare(b.holidayDate))
  }, [holidays])

  const openCreateForm = useCallback(() => {
    setEditing(null)
    setFormDate('')
    setFormName('')
    setFormType('PUBLIC')
    setFormRecurring(true)
    setShowForm(true)
  }, [])

  const openEditForm = useCallback((holiday: Holiday) => {
    setEditing(holiday)
    setFormDate(holiday.holidayDate)
    setFormName(holiday.holidayName)
    setFormType(holiday.holidayType)
    setFormRecurring(holiday.isRecurring)
    setShowForm(true)
  }, [])

  const handleSubmit = useCallback(() => {
    if (!formName.trim() || !formDate) return
    const data: HolidayFormValues = {
      holidayDate: formDate,
      holidayName: formName.trim(),
      holidayType: formType,
      isRecurring: formRecurring,
    }
    if (editing) {
      updateHoliday.mutate(
        { id: editing.rowId, data },
        { onSuccess: () => setShowForm(false) },
      )
    } else {
      createHoliday.mutate(data, { onSuccess: () => setShowForm(false) })
    }
  }, [formDate, formName, formType, formRecurring, editing, createHoliday, updateHoliday])

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTarget) return
    deleteHoliday.mutate(deleteTarget.rowId, {
      onSuccess: () => setDeleteTarget(null),
    })
  }, [deleteTarget, deleteHoliday])

  const getTypeBadgeVariant = (type: HolidayType) => {
    switch (type) {
      case 'PUBLIC': return 'destructive' as const
      case 'SUBSTITUTE': return 'secondary' as const
      case 'CUSTOM': return 'outline' as const
    }
  }

  const headerTitle = (
    <div className="flex items-center justify-between flex-1">
      <span>{t('holiday.manage')}</span>
      <Button variant="outline" size="sm" className="gap-1.5 mr-2" onClick={openCreateForm}>
        <Plus size={14} />
        {t('holiday.add')}
      </Button>
    </div>
  )

  return (
    <>
      {open && (
        <ModalShell title={headerTitle} onClose={() => onOpenChange(false)} mobile={isMobile} size="sm">
          <div className="space-y-2">
            {allHolidays.map((holiday) => (
              <div
                key={holiday.rowId}
                className="flex items-center gap-2 rounded-md border px-3 py-2"
              >
                <span className="text-xs text-muted-foreground shrink-0">
                  {holiday.holidayDate}
                </span>
                <span className="flex-1 text-sm truncate">{holiday.holidayName}</span>
                <Badge variant={getTypeBadgeVariant(holiday.holidayType)} className="shrink-0 text-[10px] px-1.5 py-0">
                  {t(`holiday.type.${holiday.holidayType}`)}
                </Badge>
                {holiday.isRecurring && (
                  <RotateCcw size={12} className="shrink-0 text-muted-foreground" />
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => openEditForm(holiday)}
                >
                  <Edit3 size={12} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => setDeleteTarget(holiday)}
                >
                  <Trash2 size={12} />
                </Button>
              </div>
            ))}

            {allHolidays.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">-</p>
            )}
          </div>
        </ModalShell>
      )}

      {/* Add/Edit Form Dialog */}
      {showForm && (
        <ModalShell
          title={editing ? t('holiday.edit') : t('holiday.add')}
          onClose={() => setShowForm(false)}
          mobile={isMobile}
          size="sm"
          footer={
            <>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                {tc('cancel')}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!formName.trim() || !formDate}
                loading={createHoliday.isPending || updateHoliday.isPending}
              >
                {tc('save')}
              </Button>
            </>
          }
        >
          <div className="space-y-3">
            <div>
              <Label>{t('holiday.date')}</Label>
              <InputDatePicker
                value={formDate}
                onValueChange={(v) => setFormDate(v)}
              />
            </div>
            <div>
              <Label>{t('holiday.name')}</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder={t('holiday.namePlaceholder')}
              />
            </div>
            <div>
              <Label>{t('holiday.type')}</Label>
              <Select value={formType} onValueChange={(v) => setFormType(v as HolidayType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HOLIDAY_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(`holiday.type.${type}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                role="checkbox"
                aria-checked={formRecurring}
                onClick={() => setFormRecurring(!formRecurring)}
                className="flex size-4 shrink-0 items-center justify-center rounded-sm border border-primary transition-colors data-[state=checked]:bg-primary"
                data-state={formRecurring ? 'checked' : 'unchecked'}
                style={{
                  backgroundColor: formRecurring ? 'var(--primary)' : 'transparent',
                }}
              >
                {formRecurring && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-primary-foreground">
                    <path d="M8.5 2.5L3.5 7.5L1.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
              <Label className="cursor-pointer" onClick={() => setFormRecurring(!formRecurring)}>
                {t('holiday.recurring')}
              </Label>
            </div>
          </div>
        </ModalShell>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null) }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('holiday.deleteConfirm.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('holiday.deleteConfirm.message')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('holiday.deleteConfirm.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              loading={deleteHoliday.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('holiday.deleteConfirm.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
