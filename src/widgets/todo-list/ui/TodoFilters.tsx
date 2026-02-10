import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib'
import type { TodoStatus, TodoPriority } from '@/entities/todo'
import type { TodoProject } from '@/entities/todo-project'

interface TodoFiltersProps {
  statusFilter: TodoStatus | 'ALL'
  priorityFilter: TodoPriority | 'ALL'
  projectFilter: number | null
  projects: TodoProject[]
  onStatusChange: (status: TodoStatus | 'ALL') => void
  onPriorityChange: (priority: TodoPriority | 'ALL') => void
  onProjectChange: (projectId: number | null) => void
}

const statusOptions: (TodoStatus | 'ALL')[] = ['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED']
const priorityOptions: (TodoPriority | 'ALL')[] = ['ALL', 'HIGH', 'MEDIUM', 'LOW']

export const TodoFilters = ({
  statusFilter,
  priorityFilter,
  projectFilter,
  projects,
  onStatusChange,
  onPriorityChange,
  onProjectChange,
}: TodoFiltersProps) => {
  const { t } = useTranslation('todo')

  return (
    <div className="space-y-3">
      {projects.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => onProjectChange(null)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              projectFilter === null
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            {t('allProjects')}
          </button>
          {projects.map((project) => (
            <button
              key={project.rowId}
              onClick={() => onProjectChange(project.rowId)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                projectFilter === project.rowId
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
              style={
                projectFilter === project.rowId && project.color
                  ? { backgroundColor: project.color }
                  : undefined
              }
            >
              {project.projectName}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {statusOptions.map((status) => (
          <button
            key={status}
            onClick={() => onStatusChange(status)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              statusFilter === status
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            {t(`status.${status}`)}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {priorityOptions.map((priority) => (
          <button
            key={priority}
            onClick={() => onPriorityChange(priority)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              priorityFilter === priority
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            {t(`priority.${priority}`)}
          </button>
        ))}
      </div>
    </div>
  )
}
