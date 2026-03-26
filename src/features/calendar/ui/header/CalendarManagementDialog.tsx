import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Edit3, Trash2, Plus, Loader2 } from 'lucide-react'

import {
  useUserCalendars,
  useCreateUserCalendar,
  useUpdateUserCalendar,
  useDeleteUserCalendar,
} from '@/features/user-calendar'
import type { UserCalendar, UserCalendarFormValues } from '@/entities/user-calendar'
import { Button } from '@/shared/ui/button'
import { ColorPicker } from '@/shared/ui/color-picker'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/ui/dialog'
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

interface CalendarManagementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const CalendarManagementDialog = ({
  open,
  onOpenChange,
}: CalendarManagementDialogProps) => {
  const { t } = useTranslation('calendar')
  const { t: tc } = useTranslation('common')
  const { data: calendars } = useUserCalendars()
  const createCalendar = useCreateUserCalendar()
  const updateCalendar = useUpdateUserCalendar()
  const deleteCalendar = useDeleteUserCalendar()

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<UserCalendar | null>(null)
  const [formName, setFormName] = useState('')
  const [formColor, setFormColor] = useState('#3B82F6')
  const [deleteTarget, setDeleteTarget] = useState<UserCalendar | null>(null)

  const allCalendars = calendars ?? []

  const openCreateForm = useCallback(() => {
    setEditing(null)
    setFormName('')
    setFormColor('#3B82F6')
    setShowForm(true)
  }, [])

  const openEditForm = useCallback((cal: UserCalendar) => {
    setEditing(cal)
    setFormName(cal.calendarName)
    setFormColor(cal.color)
    setShowForm(true)
  }, [])

  const handleSubmit = useCallback(() => {
    if (!formName.trim()) return
    const data: UserCalendarFormValues = {
      calendarName: formName.trim(),
      color: formColor,
    }
    if (editing) {
      updateCalendar.mutate(
        { id: editing.rowId, data },
        { onSuccess: () => setShowForm(false) },
      )
    } else {
      createCalendar.mutate(data, { onSuccess: () => setShowForm(false) })
    }
  }, [formName, formColor, editing, createCalendar, updateCalendar])

  const handleDeleteRequest = useCallback((cal: UserCalendar) => {
    if (cal.isDefault) return
    setDeleteTarget(cal)
  }, [])

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTarget) return
    deleteCalendar.mutate(deleteTarget.rowId, {
      onSuccess: () => setDeleteTarget(null),
    })
  }, [deleteTarget, deleteCalendar])

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>{t('manage')}</DialogTitle>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={openCreateForm}
              >
                <Plus size={14} />
                {t('add')}
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-2">
            {allCalendars.map((cal) => (
              <div
                key={cal.rowId}
                className="flex items-center gap-2 rounded-md border px-3 py-2"
              >
                <div
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: cal.color }}
                />
                <span className="flex-1 text-sm">{cal.calendarName}</span>
                {cal.isDefault && (
                  <span className="rounded-sm bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {t('default')}
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => openEditForm(cal)}
                >
                  <Edit3 size={12} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  disabled={cal.isDefault}
                  onClick={() => handleDeleteRequest(cal)}
                >
                  <Trash2 size={12} />
                </Button>
              </div>
            ))}

            {allCalendars.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">-</p>
            )}
          </div>

        </DialogContent>
      </Dialog>

      {/* Add/Edit Form Dialog */}
      <Dialog open={showForm} onOpenChange={(o) => { if (!o) setShowForm(false) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {editing ? t('edit') : t('add')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>{t('name')}</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder={t('namePlaceholder')}
              />
            </div>
            <div>
              <Label>{t('form.color')}</Label>
              <ColorPicker value={formColor} onChange={setFormColor} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              {tc('cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formName.trim() || createCalendar.isPending || updateCalendar.isPending}
            >
              {(createCalendar.isPending || updateCalendar.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
              {tc('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null) }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.isDefault
                ? t('cannotDeleteDefault')
                : t('deleteConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tc('cancel')}</AlertDialogCancel>
            {!deleteTarget?.isDefault && (
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteCalendar.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {tc('delete')}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
