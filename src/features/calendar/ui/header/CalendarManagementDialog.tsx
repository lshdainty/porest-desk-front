import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Edit3, Trash2, Plus } from 'lucide-react'

import {
  useUserCalendars,
  useCreateUserCalendar,
  useUpdateUserCalendar,
  useDeleteUserCalendar,
} from '@/features/user-calendar'
import type { UserCalendar, UserCalendarFormValues } from '@/entities/user-calendar'
import { Button } from '@/shared/ui/button'
import { ColorSwatchGroup } from '@/shared/ui/color-swatch'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { ModalShell } from '@/shared/ui/porest/dialogs'
import { CAT_PALETTE, getPaletteByColor } from '@/shared/lib/porest/chart-palette'
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

interface CalendarManagementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// 캘린더 기본색 = 팔레트 blue #2c70bf (token 매핑 정합).
const DEFAULT_CALENDAR_COLOR =
  CAT_PALETTE.find(p => p.baseHex === '#2c70bf')!.baseHex

export const CalendarManagementDialog = ({
  open,
  onOpenChange,
}: CalendarManagementDialogProps) => {
  const { t } = useTranslation('calendar')
  const { t: tc } = useTranslation('common')
  const isMobile = useIsMobile()
  const { data: calendars } = useUserCalendars()
  const createCalendar = useCreateUserCalendar()
  const updateCalendar = useUpdateUserCalendar()
  const deleteCalendar = useDeleteUserCalendar()

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<UserCalendar | null>(null)
  const [formName, setFormName] = useState('')
  const [formColor, setFormColor] = useState(DEFAULT_CALENDAR_COLOR)
  const [deleteTarget, setDeleteTarget] = useState<UserCalendar | null>(null)

  const allCalendars = calendars ?? []

  const openCreateForm = useCallback(() => {
    setEditing(null)
    setFormName('')
    setFormColor(DEFAULT_CALENDAR_COLOR)
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

  const headerTitle = (
    <div className="flex items-center justify-between flex-1">
      <span>{t('manage')}</span>
      <Button variant="outline" size="sm" className="gap-1.5 mr-2" onClick={openCreateForm}>
        <Plus size={14} />
        {t('add')}
      </Button>
    </div>
  )

  return (
    <>
      {open && (
        <ModalShell title={headerTitle} onClose={() => onOpenChange(false)} mobile={isMobile} size="sm">
          <div className="space-y-2">
            {allCalendars.map((cal) => (
              <div
                key={cal.rowId}
                className="flex items-center gap-2 rounded-md border px-3 py-2"
              >
                <div
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: getPaletteByColor(cal.color).color }}
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
        </ModalShell>
      )}

      {/* Add/Edit Form Dialog */}
      {showForm && (
        <ModalShell
          title={editing ? t('edit') : t('add')}
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
                disabled={!formName.trim()}
                loading={createCalendar.isPending || updateCalendar.isPending}
              >
                {tc('save')}
              </Button>
            </>
          }
        >
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
              <ColorSwatchGroup
                columns={5}
                value={String(
                  Math.max(0, CAT_PALETTE.findIndex(p => p.baseHex === formColor)),
                )}
                onValueChange={(v) => setFormColor(CAT_PALETTE[Number(v)]!.baseHex)}
                options={CAT_PALETTE.map((p, i) => ({
                  value: String(i),
                  bg: p.bg,
                  fg: p.color,
                  label: `색상 ${i + 1}`,
                }))}
              />
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
                loading={deleteCalendar.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {tc('delete')}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
