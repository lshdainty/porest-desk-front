import { Spinner } from '@/shared/ui/spinner'
import { useSubtasks } from '@/features/todo'
import type { Todo } from '@/entities/todo'
import { TodoItem } from './TodoItem'

interface SubtaskListProps {
  parentId: number
  onToggle: (id: number) => void
  onEdit: (todo: Todo) => void
  onDelete: (id: number) => void
}

export const SubtaskList = ({ parentId, onToggle, onEdit, onDelete }: SubtaskListProps) => {
  const { data: subtasks, isLoading } = useSubtasks(parentId)

  if (isLoading) {
    return (
      <div className="ml-6 flex items-center py-2">
        <Spinner size="sm" />
      </div>
    )
  }

  if (!subtasks || subtasks.length === 0) return null

  return (
    <div className="space-y-1.5">
      {subtasks.map((subtask) => (
        <TodoItem
          key={subtask.rowId}
          todo={subtask}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
          isSubtask
        />
      ))}
    </div>
  )
}
