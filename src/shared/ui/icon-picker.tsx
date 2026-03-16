import { useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '@/shared/lib/cn'
import { getIconEntries } from '@/shared/lib/icon-map'

interface IconPickerProps {
  value: string
  onChange: (iconName: string) => void
  className?: string
}

const iconEntries = getIconEntries()

export const IconPicker = ({ value, onChange, className }: IconPickerProps) => {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const handleSelect = useCallback(
    (iconName: string) => {
      onChange(iconName)
      setOpen(false)
    },
    [onChange],
  )

  const SelectedIcon = value
    ? iconEntries.find(([name]) => name === value)?.[1] ?? null
    : null

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-10 w-10 items-center justify-center rounded-md border border-input bg-background shadow-sm transition-colors hover:bg-accent"
      >
        {SelectedIcon ? (
          <SelectedIcon size={18} className="text-foreground" />
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-md border bg-popover p-3 shadow-md">
          <div className="space-y-2">
            {/* 없음 옵션 */}
            <button
              type="button"
              onClick={() => handleSelect('')}
              className={cn(
                'w-full rounded-sm px-2 py-1 text-left text-xs text-muted-foreground hover:bg-accent transition-colors',
                !value && 'bg-accent',
              )}
            >
              없음
            </button>

            <div className="h-px bg-border" />

            {/* 아이콘 그리드 */}
            <div className="grid grid-cols-7 gap-1">
              {iconEntries.map(([name, Icon]) => (
                <button
                  key={name}
                  type="button"
                  title={name}
                  onClick={() => handleSelect(name)}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-sm transition-all hover:bg-accent hover:scale-110',
                    value === name && 'bg-accent ring-2 ring-primary ring-offset-1 ring-offset-background',
                  )}
                >
                  <Icon size={16} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
