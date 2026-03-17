import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { DynamicIcon, iconNames } from 'lucide-react/dynamic'
import type { IconName } from 'lucide-react/dynamic'
import { Search } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Input } from '@/shared/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'

const MAX_VISIBLE = 100

interface IconPickerProps {
  value: string
  onChange: (iconName: string) => void
  className?: string
}

export const IconPicker = ({ value, onChange, className }: IconPickerProps) => {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  // Popover 열릴 때 검색창 포커스
  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 0)
    } else {
      setSearch('')
    }
  }, [open])

  const filtered = useMemo(() => {
    const query = search.toLowerCase().trim()
    if (!query) return iconNames.slice(0, MAX_VISIBLE)
    return iconNames
      .filter((name) => name.includes(query))
      .slice(0, MAX_VISIBLE)
  }, [search])

  const totalMatched = useMemo(() => {
    const query = search.toLowerCase().trim()
    if (!query) return iconNames.length
    return iconNames.filter((name) => name.includes(query)).length
  }, [search])

  const handleSelect = useCallback(
    (iconName: string) => {
      onChange(iconName)
      setOpen(false)
    },
    [onChange],
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-md border border-input bg-background shadow-sm transition-colors hover:bg-accent',
            className,
          )}
        >
          {value ? (
            <DynamicIcon name={value as IconName} size={18} className="text-foreground" />
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-3" align="start">
        {/* 검색 */}
        <div className="relative mb-3">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
          <Input
            ref={searchRef}
            placeholder="아이콘 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-sm"
          />
        </div>

        {/* 없음 옵션 */}
        <button
          type="button"
          onClick={() => handleSelect('')}
          className={cn(
            'w-full rounded-sm px-2 py-1 text-left text-xs text-muted-foreground hover:bg-accent transition-colors mb-2',
            !value && 'bg-accent',
          )}
        >
          없음
        </button>

        <div className="h-px bg-border mb-2" />

        {/* 아이콘 그리드 */}
        <div className="max-h-60 overflow-y-auto">
          {filtered.length > 0 ? (
            <div className="grid grid-cols-8 gap-1">
              {filtered.map((name) => (
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
                  <DynamicIcon name={name as IconName} size={16} />
                </button>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-xs text-muted-foreground">
              검색 결과가 없습니다
            </p>
          )}
        </div>

        {/* 결과 카운트 */}
        <p className="mt-2 text-[10px] text-muted-foreground text-center">
          {search
            ? `${totalMatched > MAX_VISIBLE ? `${MAX_VISIBLE}개+ 표시 중 (총 ${totalMatched}개)` : `${totalMatched}개 결과`}`
            : `검색으로 ${iconNames.length}개 아이콘을 찾아보세요`}
        </p>
      </PopoverContent>
    </Popover>
  )
}
