import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard,
  StickyNote,
  CheckSquare,
  CalendarDays,
  Wallet,
  Sun,
  Moon,
  Plus,
  Search,
} from 'lucide-react'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from '@/shared/ui/command'
import { useTheme } from '@/shared/ui/theme-provider'
import { useCreateTodo } from '@/features/todo'
import { useMemos } from '@/features/memo'
import { toast } from 'sonner'

export const CommandPalette = () => {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [mode, setMode] = useState<'default' | 'todo'>('default')
  const navigate = useNavigate()
  const { t } = useTranslation('layout')
  const { t: tc } = useTranslation('common')
  const { t: tm } = useTranslation('memo')
  const { t: tt } = useTranslation('todo')
  const { theme, setTheme } = useTheme()
  const createTodo = useCreateTodo()

  const { data: memos } = useMemos(
    search.length >= 2 ? { search } : undefined
  )

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  useEffect(() => {
    if (!open) {
      setSearch('')
      setMode('default')
    }
  }, [open])

  const runAction = useCallback((action: () => void) => {
    setOpen(false)
    action()
  }, [])

  const handleCreateTodo = useCallback(() => {
    if (!search.trim()) return
    createTodo.mutate(
      { title: search.trim(), priority: 'MEDIUM' },
      {
        onSuccess: () => {
          toast.success(tt('createTodo'))
          setOpen(false)
        },
        onError: () => {
          toast.error(tc('error'))
        },
      }
    )
  }, [search, createTodo, tt, tc])

  const pages = [
    { label: t('dashboard'), url: '/desk', icon: LayoutDashboard },
    { label: t('memo'), url: '/desk/memo', icon: StickyNote },
    { label: t('todo'), url: '/desk/todo', icon: CheckSquare },
    { label: t('calendar'), url: '/desk/calendar', icon: CalendarDays },
    { label: t('expense'), url: '/desk/expense', icon: Wallet },
  ]

  if (mode === 'todo') {
    return (
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder={tt('quickAdd.placeholder')}
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          <CommandEmpty>{tt('empty')}</CommandEmpty>
          {search.trim() && (
            <CommandGroup>
              <CommandItem onSelect={handleCreateTodo}>
                <Plus className="mr-2 h-4 w-4" />
                {tt('addTodo')}: {search}
                <CommandShortcut>Enter</CommandShortcut>
              </CommandItem>
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    )
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder={`${tc('search')}... (${t('menu')}, ${tm('title')}, ...)`}
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>{tc('noData')}</CommandEmpty>

        {/* Navigation */}
        <CommandGroup heading={t('menu')}>
          {pages.map((page) => (
            <CommandItem
              key={page.url}
              onSelect={() => runAction(() => navigate(page.url))}
            >
              <page.icon className="mr-2 h-4 w-4" />
              {page.label}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {/* Quick actions */}
        <CommandGroup heading={tc('create')}>
          <CommandItem onSelect={() => setMode('todo')}>
            <Plus className="mr-2 h-4 w-4" />
            {tt('addTodo')}
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Theme */}
        <CommandGroup heading={t('settings')}>
          <CommandItem
            onSelect={() => runAction(() => setTheme(theme === 'dark' ? 'light' : 'dark'))}
          >
            {theme === 'dark' ? (
              <Sun className="mr-2 h-4 w-4" />
            ) : (
              <Moon className="mr-2 h-4 w-4" />
            )}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </CommandItem>
        </CommandGroup>

        {/* Memo search results */}
        {search.length >= 2 && memos && memos.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading={`${tm('search')} (${memos.length})`}>
              {memos.slice(0, 5).map((memo) => (
                <CommandItem
                  key={memo.rowId}
                  onSelect={() => runAction(() => navigate('/desk/memo'))}
                >
                  <Search className="mr-2 h-4 w-4" />
                  {memo.title || tm('untitled')}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}
