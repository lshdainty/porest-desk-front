import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { cn, renderIcon } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { ModalShell } from '@/shared/ui/porest/dialogs'
import { useIsMobile } from '@/shared/hooks'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/shared/ui/alert-dialog'
import { IconPicker } from '@/shared/ui/icon-picker'
import {
  useTodoProjects,
  useCreateTodoProject,
  useUpdateTodoProject,
  useDeleteTodoProject,
} from '@/features/todo-project'
import type { TodoProject, TodoProjectFormValues } from '@/entities/todo-project'

interface ProjectManagementDialogProps {
  onClose: () => void
}

const COLOR_OPTIONS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280',
]

export const ProjectManagementDialog = ({ onClose }: ProjectManagementDialogProps) => {
  const { t } = useTranslation('todo')
  const { t: tc } = useTranslation('common')
  const isMobile = useIsMobile()

  const { data: projects = [], isLoading } = useTodoProjects()
  const createProject = useCreateTodoProject()
  const updateProject = useUpdateTodoProject()
  const deleteProject = useDeleteTodoProject()

  const [editingProject, setEditingProject] = useState<TodoProject | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<TodoProjectFormValues>({
    projectName: '',
    color: '#3b82f6',
    icon: '',
    description: '',
  })
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  const openCreateForm = () => {
    setEditingProject(null)
    setFormData({ projectName: '', color: '#3b82f6', icon: '', description: '' })
    setShowForm(true)
  }

  const openEditForm = (project: TodoProject) => {
    setEditingProject(project)
    setFormData({
      projectName: project.projectName,
      color: project.color || '#3b82f6',
      icon: project.icon || '',
      description: project.description || '',
    })
    setShowForm(true)
  }

  const handleSave = () => {
    if (!formData.projectName.trim()) return
    if (editingProject) {
      updateProject.mutate(
        { id: editingProject.rowId, data: formData },
        { onSuccess: () => setShowForm(false) }
      )
    } else {
      createProject.mutate(formData, {
        onSuccess: () => setShowForm(false),
      })
    }
  }

  const handleDelete = (id: number) => {
    deleteProject.mutate(id, {
      onSuccess: () => setDeleteConfirm(null),
    })
  }

  const headerTitle = (
    <div className="flex items-center justify-between flex-1">
      <span>{t('projects')}</span>
      {!showForm && (
        <Button variant="outline" size="sm" onClick={openCreateForm} className="mr-2">
          <Plus size={14} className="mr-1" />
          {t('addProject')}
        </Button>
      )}
    </div>
  )

  return (
    <ModalShell title={headerTitle} onClose={onClose} mobile={isMobile} size="sm">
        <div>
          {showForm ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>{t('form.projectName')}</Label>
                <Input
                  value={formData.projectName}
                  onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                  placeholder={t('form.projectNamePlaceholder')}
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <Label>{t('form.description')}</Label>
                <Input
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t('form.descriptionPlaceholder')}
                />
              </div>

              <div className="space-y-1.5">
                <Label>{t('form.icon')}</Label>
                <IconPicker
                  value={formData.icon || ''}
                  onChange={(icon) => setFormData({ ...formData, icon })}
                />
              </div>

              <div className="space-y-1.5">
                <Label>{t('form.color')}</Label>
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
                  disabled={createProject.isPending || updateProject.isPending}
                >
                  {(createProject.isPending || updateProject.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
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
              ) : projects.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  {t('noProjects')}
                </p>
              ) : (
                projects.map((project) => (
                  <div
                    key={project.rowId}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full shrink-0"
                        style={{ backgroundColor: project.color || '#6b7280' }}
                      />
                      {project.icon && renderIcon(project.icon, '', 16)}
                      <div>
                        <span className="text-sm font-medium">{project.projectName}</span>
                        {project.description && (
                          <p className="text-xs text-muted-foreground">{project.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEditForm(project)}
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteConfirm(project.rowId)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                ))
              )}

            </div>
          )}
        </div>

        <AlertDialog open={deleteConfirm !== null} onOpenChange={(open) => { if (!open) setDeleteConfirm(null) }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{tc('delete')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('deleteConfirm.message')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{tc('cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteConfirm !== null && handleDelete(deleteConfirm)}
                disabled={deleteProject.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteProject.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {tc('delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </ModalShell>
  )
}
