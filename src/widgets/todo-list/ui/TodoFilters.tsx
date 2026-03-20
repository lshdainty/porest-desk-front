import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib'
import type { TodoStatus, TodoPriority, TodoType } from '@/entities/todo'
import type { TodoProject } from '@/entities/todo-project'

interface TodoFiltersProps {
  typeFilter: TodoType | 'ALL'
  statusFilter: TodoStatus | 'ALL'
  priorityFilter: TodoPriority | 'ALL'
  projectFilter: number | null
  projects: TodoProject[]
  onTypeChange: (type: TodoType | 'ALL') => void
  onStatusChange: (status: TodoStatus | 'ALL') => void
  onPriorityChange: (priority: TodoPriority | 'ALL') => void
  onProjectChange: (projectId: number | null) => void
}

const typeOptions: (TodoType | 'ALL')[] = ['ALL', 'TASK', 'NOTE']
const statusOptions: (TodoStatus | 'ALL')[] = ['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED']
const priorityOptions: (TodoPriority | 'ALL')[] = ['ALL', 'HIGH', 'MEDIUM', 'LOW']

export const TodoFilters = ({
  typeFilter,
  statusFilter,
  priorityFilter,
  projectFilter,
  projects,
  onTypeChange,
  onStatusChange,
  onPriorityChange,
  onProjectChange,
}: TodoFiltersProps) => {
  const { t } = useTranslation('todo')

  const isNoteOnly = typeFilter === 'NOTE'

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {typeOptions.map((type) => (
          <button
            key={type}
            onClick={() => onTypeChange(type)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              typeFilter === type
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            {t(`type.${type}`)}
          </button>
        ))}
      </div>

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

      {!isNoteOnly && (
        <>
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
        </>
      )}
    </div>
  )
}
