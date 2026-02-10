import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { cn } from '@/shared/lib'
import { useIsMobile } from '@/shared/hooks'
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
    description: '',
  })
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  const openCreateForm = () => {
    setEditingProject(null)
    setFormData({ projectName: '', color: '#3b82f6', description: '' })
    setShowForm(true)
  }

  const openEditForm = (project: TodoProject) => {
    setEditingProject(project)
    setFormData({
      projectName: project.projectName,
      color: project.color || '#3b82f6',
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

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-end justify-center bg-black/40',
        !isMobile && 'items-center'
      )}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className={cn(
          'w-full bg-background shadow-lg',
          isMobile
            ? 'max-h-[85vh] overflow-y-auto rounded-t-2xl'
            : 'max-w-md rounded-lg'
        )}
      >
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="text-lg font-semibold">{t('projects')}</h3>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-muted">
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          {showForm ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t('form.projectName')}</label>
                <input
                  value={formData.projectName}
                  onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder={t('form.projectNamePlaceholder')}
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t('form.description')}</label>
                <input
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder={t('form.descriptionPlaceholder')}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t('form.color')}</label>
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
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
                >
                  {tc('cancel')}
                </button>
                <button
                  onClick={handleSave}
                  disabled={createProject.isPending || updateProject.isPending}
                  className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {(createProject.isPending || updateProject.isPending) ? tc('loading') : tc('save')}
                </button>
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
                      <div>
                        <span className="text-sm font-medium">{project.projectName}</span>
                        {project.description && (
                          <p className="text-xs text-muted-foreground">{project.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditForm(project)}
                        className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(project.rowId)}
                        className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}

              <button
                onClick={openCreateForm}
                className="flex w-full items-center justify-center gap-2 rounded-md border-2 border-dashed border-muted-foreground/20 py-2.5 text-sm text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
              >
                <Plus size={14} />
                {t('addProject')}
              </button>
            </div>
          )}
        </div>

        {deleteConfirm !== null && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40"
            onClick={() => setDeleteConfirm(null)}
          >
            <div
              className="mx-4 w-full max-w-xs rounded-lg bg-background p-5 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <h4 className="font-semibold">{tc('delete')}</h4>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {t('deleteConfirm.message')}
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
                >
                  {tc('cancel')}
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  disabled={deleteProject.isPending}
                  className="flex-1 rounded-md bg-destructive px-3 py-1.5 text-sm text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
                >
                  {deleteProject.isPending ? '...' : tc('delete')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
