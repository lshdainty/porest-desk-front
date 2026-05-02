import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { cn } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { ModalShell } from '@/shared/ui/porest/dialogs'
import { useIsMobile } from '@/shared/hooks'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/shared/ui/alert-dialog'
import {
  useGroupTypes,
  useCreateGroupType,
  useUpdateGroupType,
  useDeleteGroupType,
} from '@/features/group'
import type { GroupTypeItem, GroupTypeFormValues } from '@/entities/group'

interface GroupTypeManagementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const COLOR_OPTIONS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280',
]

export const GroupTypeManagementDialog = ({ open, onOpenChange }: GroupTypeManagementDialogProps) => {
  const { t } = useTranslation('group')
  const { t: tc } = useTranslation('common')
  const isMobile = useIsMobile()

  const { data: groupTypes = [], isLoading } = useGroupTypes()
  const createGroupType = useCreateGroupType()
  const updateGroupType = useUpdateGroupType()
  const deleteGroupType = useDeleteGroupType()

  const [editingType, setEditingType] = useState<GroupTypeItem | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<GroupTypeFormValues>({
    typeName: '',
    color: '#3b82f6',
  })
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  const openCreateForm = () => {
    setEditingType(null)
    setFormData({ typeName: '', color: '#3b82f6' })
    setShowForm(true)
  }

  const openEditForm = (groupType: GroupTypeItem) => {
    setEditingType(groupType)
    setFormData({
      typeName: groupType.typeName,
      color: groupType.color || '#3b82f6',
    })
    setShowForm(true)
  }

  const handleSave = () => {
    if (!formData.typeName.trim()) return
    if (editingType) {
      updateGroupType.mutate(
        { id: editingType.rowId, data: formData },
        { onSuccess: () => setShowForm(false) }
      )
    } else {
      createGroupType.mutate(formData, {
        onSuccess: () => setShowForm(false),
      })
    }
  }

  const handleDelete = (id: number) => {
    deleteGroupType.mutate(id, {
      onSuccess: () => setDeleteConfirm(null),
    })
  }

  if (!open) return null

  const headerTitle = (
    <div className="flex items-center justify-between flex-1">
      <span>{t('groupTypeManagement')}</span>
      {!showForm && (
        <Button variant="outline" size="sm" onClick={openCreateForm} className="mr-2">
          <Plus size={14} className="mr-1" />
          {t('addGroupType')}
        </Button>
      )}
    </div>
  )

  return (
    <ModalShell title={headerTitle} onClose={() => onOpenChange(false)} mobile={isMobile} size="sm">
        <div>
          {showForm ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Input
                  value={formData.typeName}
                  onChange={(e) => setFormData({ ...formData, typeName: e.target.value })}
                  placeholder={t('groupTypeNamePlaceholder')}
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={cn(
                        'h-7 w-7 rounded-full transition-all',
                        formData.color === color && 'ring-2 ring-offset-2 ring-primary'
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowForm(false)}
                >
                  {tc('cancel')}
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSave}
                  loading={createGroupType.isPending || updateGroupType.isPending}
                >
                  {tc('save')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {isLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : groupTypes.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  {t('noGroupType')}
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {groupTypes.map((groupType) => (
                    <div
                      key={groupType.rowId}
                      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5"
                      style={{
                        borderColor: groupType.color || undefined,
                        backgroundColor: groupType.color ? `${groupType.color}10` : undefined,
                      }}
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: groupType.color || '#6b7280' }}
                      />
                      <span className="text-sm font-medium">{groupType.typeName}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => openEditForm(groupType)}
                      >
                        <Pencil size={12} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteConfirm(groupType.rowId)}
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}
        </div>

        <AlertDialog open={deleteConfirm !== null} onOpenChange={(open) => { if (!open) setDeleteConfirm(null) }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('deleteGroupType')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('groupTypeDeleteConfirm')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{tc('cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteConfirm !== null && handleDelete(deleteConfirm)}
                disabled={deleteGroupType.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteGroupType.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {tc('delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </ModalShell>
  )
}
