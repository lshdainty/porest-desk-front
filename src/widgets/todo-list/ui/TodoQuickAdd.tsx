import { useState, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Spinner } from '@/shared/ui/spinner'
import { cn } from '@/shared/lib'

interface TodoQuickAddProps {
  onAdd: (title: string) => void
  isLoading?: boolean
}

export const TodoQuickAdd = ({ onAdd, isLoading }: TodoQuickAddProps) => {
  const { t } = useTranslation('todo')
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = useCallback(() => {
    const trimmed = title.trim()
    if (!trimmed || isLoading) return
    onAdd(trimmed)
    setTitle('')
    inputRef.current?.focus()
  }, [title, isLoading, onAdd])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleSubmit()
      }
      if (e.key === 'Escape') {
        setTitle('')
        setIsOpen(false)
      }
    },
    [handleSubmit]
  )

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        onClick={() => {
          setIsOpen(true)
          setTimeout(() => inputRef.current?.focus(), 0)
        }}
        className="w-full justify-start gap-2 px-3 py-2.5 text-muted-foreground hover:text-foreground"
      >
        <Plus size={16} />
        {t('addTodo')}
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border bg-card p-2">
      <div
        className={cn(
          'flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 border-muted-foreground/30'
        )}
      />
      <input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (!title.trim()) setIsOpen(false)
        }}
        placeholder={t('quickAdd.placeholder')}
        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
        autoFocus
      />
      {isLoading && <Spinner size="sm" />}
    </div>
  )
}
