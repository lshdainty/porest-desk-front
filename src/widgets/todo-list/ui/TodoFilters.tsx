import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Filter, X } from 'lucide-react'
import { cn } from '@/shared/lib'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'
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

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (statusFilter !== 'ALL') count++
    if (priorityFilter !== 'ALL') count++
    if (projectFilter !== null) count++
    return count
  }, [statusFilter, priorityFilter, projectFilter])

  const handleReset = () => {
    onStatusChange('ALL')
    onPriorityChange('ALL')
    onProjectChange(null)
  }

  const selectedProjectName = useMemo(() => {
    if (projectFilter === null) return null
    return projects.find((p) => p.rowId === projectFilter)?.projectName ?? null
  }, [projectFilter, projects])

  return (
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-1.5">
            <Filter size={14} />
            {t('filter')}
            {activeFilterCount > 0 && (
              <Badge variant="default" className="ml-0.5 h-5 w-5 rounded-full p-0 text-[10px] flex items-center justify-center">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-56 p-3">
          <div className="space-y-3">
            {/* Status */}
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">{t('filter.status')}</p>
              <div className="flex flex-wrap gap-1">
                {statusOptions.map((status) => (
                  <button
                    key={status}
                    onClick={() => onStatusChange(status)}
                    className={cn(
                      'rounded-md px-2 py-1 text-xs font-medium transition-colors',
                      statusFilter === status
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    )}
                  >
                    {t(`status.${status}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority */}
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">{t('filter.priority')}</p>
              <div className="flex flex-wrap gap-1">
                {priorityOptions.map((priority) => (
                  <button
                    key={priority}
                    onClick={() => onPriorityChange(priority)}
                    className={cn(
                      'rounded-md px-2 py-1 text-xs font-medium transition-colors',
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

            {/* Project */}
            {projects.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">{t('filter.project')}</p>
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={() => onProjectChange(null)}
                    className={cn(
                      'rounded-md px-2 py-1 text-xs font-medium transition-colors',
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
                        'rounded-md px-2 py-1 text-xs font-medium transition-colors',
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
              </div>
            )}

            {/* Reset */}
            {activeFilterCount > 0 && (
              <button
                onClick={handleReset}
                className="flex w-full items-center justify-center gap-1 rounded-md border border-dashed py-1.5 text-xs text-muted-foreground hover:bg-muted transition-colors"
              >
                <X size={12} />
                {t('filter.reset')}
              </button>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Active filter badges */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          {statusFilter !== 'ALL' && (
            <Badge variant="secondary" className="gap-1 text-xs font-normal">
              {t(`status.${statusFilter}`)}
              <button onClick={() => onStatusChange('ALL')} className="ml-0.5 hover:text-foreground">
                <X size={10} />
              </button>
            </Badge>
          )}
          {priorityFilter !== 'ALL' && (
            <Badge variant="secondary" className="gap-1 text-xs font-normal">
              {t(`priority.${priorityFilter}`)}
              <button onClick={() => onPriorityChange('ALL')} className="ml-0.5 hover:text-foreground">
                <X size={10} />
              </button>
            </Badge>
          )}
          {selectedProjectName && (
            <Badge variant="secondary" className="gap-1 text-xs font-normal">
              {selectedProjectName}
              <button onClick={() => onProjectChange(null)} className="ml-0.5 hover:text-foreground">
                <X size={10} />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
