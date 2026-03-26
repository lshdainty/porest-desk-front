import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Todo } from '@/entities/todo'
import { TodoItem } from './TodoItem'

interface SortableTodoItemProps {
  todo: Todo
  onToggle: (id: number) => void
  onEdit: (todo: Todo) => void
  onDelete: (id: number) => void
  onAddSubtask?: (parentId: number) => void
  onExpandSubtasks?: (todoId: number) => void
  onTogglePin?: (id: number) => void
}

export const SortableTodoItem = ({
  todo,
  ...props
}: SortableTodoItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.rowId })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <TodoItem
      ref={setNodeRef}
      style={style}
      {...attributes}
      todo={todo}
      isDragging={isDragging}
      dragHandleProps={listeners}
      {...props}
    />
  )
}
