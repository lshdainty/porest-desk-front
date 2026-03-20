import { TodoListWidget } from '@/widgets/todo-list'

export const TodoPage = () => {
  return (
    <div className="flex h-full flex-col p-4 md:p-6">
      <TodoListWidget />
    </div>
  )
}
