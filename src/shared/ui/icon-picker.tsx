import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import type { UIEvent, WheelEvent } from 'react'
import { DynamicIcon, iconNames } from 'lucide-react/dynamic'
import type { IconName } from 'lucide-react/dynamic'
import { Search } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Input } from '@/shared/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'

// 초기 표시 개수 및 스크롤로 더 로드할 때의 증분.
const STEP = 120

interface IconPickerProps {
  value: string
  onChange: (iconName: string) => void
  className?: string
  icons?: readonly string[]
}

export const IconPicker = ({ value, onChange, className, icons }: IconPickerProps) => {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [visibleCount, setVisibleCount] = useState(STEP)
  const searchRef = useRef<HTMLInputElement>(null)

  // Popover 열릴 때 검색창 포커스
  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 0)
    }
  }, [open])

  const handleOpenChange = useCallback((next: boolean) => {
    setOpen(next)
    if (!next) {
      setSearch('')
      setVisibleCount(STEP)
    }
  }, [])

  const source = useMemo<readonly string[]>(() => icons ?? (iconNames as readonly string[]), [icons])

  // 검색어로 필터링한 전체 결과(표시 제한 없음).
  const matched = useMemo(() => {
    const query = search.toLowerCase().trim()
    if (!query) return source
    return source.filter((name) => name.includes(query))
  }, [search, source])

  // 검색어가 바뀌면 표시 개수를 초기화(맨 위부터 다시).
  useEffect(() => {
    setVisibleCount(STEP)
  }, [search])

  // 실제로 렌더할 만큼만 잘라낸다(스크롤로 점진 확장 — 1892개 한 번에 안 그림).
  const visible = useMemo(() => matched.slice(0, visibleCount), [matched, visibleCount])

  // 스크롤이 하단 근처에 오면 STEP 만큼 더 렌더.
  const maybeLoadMore = useCallback(
    (el: HTMLDivElement) => {
      if (el.scrollHeight - el.scrollTop - el.clientHeight < 150) {
        setVisibleCount((c) => (c < matched.length ? c + STEP : c))
      }
    },
    [matched.length],
  )

  const handleScroll = useCallback(
    (e: UIEvent<HTMLDivElement>) => maybeLoadMore(e.currentTarget),
    [maybeLoadMore],
  )

  // Dialog(react-remove-scroll)가 Popover 내부 커스텀 스크롤 div 의 휠을 막는 문제 우회 —
  // 휠 델타로 scrollTop 을 직접 조작한다(스크롤바 드래그만 되고 휠이 안 먹던 버그).
  const handleWheel = useCallback(
    (e: WheelEvent<HTMLDivElement>) => {
      const el = e.currentTarget
      const canScroll = el.scrollHeight > el.clientHeight
      if (!canScroll) return
      const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY
      el.scrollTop += delta
      maybeLoadMore(el)
    },
    [maybeLoadMore],
  )

  const handleSelect = useCallback(
    (iconName: string) => {
      onChange(iconName)
      setOpen(false)
    },
    [onChange],
  )

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-md border border-border-default bg-bg-page shadow-sm transition-colors hover:bg-surface-input',
            className,
          )}
        >
          {value ? (
            <DynamicIcon name={value as IconName} size={18} className="text-text-primary" />
          ) : (
            <span className="text-xs text-text-secondary">—</span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-3" align="start">
        {/* 검색 */}
        <div className="relative mb-3">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-secondary" size={14} />
          <Input
            search
            ref={searchRef}
            placeholder="아이콘 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        {/* 없음 옵션 */}
        <button
          type="button"
          onClick={() => handleSelect('')}
          className={cn(
            'w-full rounded-sm px-2 py-1 text-left text-xs text-text-secondary hover:bg-surface-input transition-colors mb-2',
            !value && 'bg-surface-input',
          )}
        >
          없음
        </button>

        <div className="h-px bg-border-default mb-2" />

        {/* 아이콘 그리드 (검색 없이도 스크롤로 전체 탐색 — 점진 로드) */}
        <div
          className="max-h-60 overflow-y-auto overscroll-contain pr-1"
          onScroll={handleScroll}
          onWheel={handleWheel}
        >
          {visible.length > 0 ? (
            <div className="grid grid-cols-8 gap-1">
              {visible.map((name) => (
                <button
                  key={name}
                  type="button"
                  title={name}
                  onClick={() => handleSelect(name)}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-sm transition-all hover:bg-surface-input hover:scale-110',
                    value === name && 'bg-surface-input ring-2 ring-primary ring-offset-1 ring-offset-background',
                  )}
                >
                  <DynamicIcon name={name as IconName} size={16} />
                </button>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-xs text-text-secondary">
              검색 결과가 없습니다
            </p>
          )}
        </div>

        {/* 결과 카운트 */}
        <p className="mt-2 text-[10px] text-text-secondary text-center">
          {search
            ? `${matched.length}개 결과`
            : `전체 ${iconNames.length}개 · 스크롤해서 더 보기`}
        </p>
      </PopoverContent>
    </Popover>
  )
}
