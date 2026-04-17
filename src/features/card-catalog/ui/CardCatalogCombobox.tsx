import { useState, useMemo } from 'react'
import { Check, ChevronsUpDown, X } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/shared/ui/command'
import { cn } from '@/shared/lib'
import { useCardCatalogs } from '../model/useCardCatalogs'
import type { CardType } from '@/entities/card'

interface Props {
  value?: number | null
  onChange: (rowId: number | null, cardName?: string, imgUrl?: string | null) => void
  /** AssetForm 의 assetType 이 CREDIT_CARD/CHECK_CARD 일 때 해당 타입으로 제한 */
  cardTypeFilter?: CardType
  disabled?: boolean
}

export function CardCatalogCombobox({ value, onChange, cardTypeFilter, disabled }: Props) {
  const [open, setOpen] = useState(false)
  const [keyword, setKeyword] = useState('')

  const { data, isFetching } = useCardCatalogs({
    keyword: keyword.trim() || undefined,
    cardType: cardTypeFilter,
    page: 0,
    size: 30,
  })

  const items = data?.content ?? []
  const selected = useMemo(
    () => items.find((c) => c.rowId === value),
    [items, value]
  )

  return (
    <div className="flex items-center gap-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="w-full justify-between font-normal"
          >
            {selected ? (
              <span className="flex items-center gap-2 truncate">
                {selected.imgUrl && (
                  <img src={selected.imgUrl} alt="" className="h-5 w-8 rounded object-cover" />
                )}
                <span className="truncate">
                  {selected.company?.name ?? ''} · {selected.cardName}
                </span>
              </span>
            ) : value ? (
              <span className="text-muted-foreground">카드 로드 중…</span>
            ) : (
              <span className="text-muted-foreground">카드 선택</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="카드명 또는 발급사로 검색"
              value={keyword}
              onValueChange={setKeyword}
            />
            <CommandList>
              {isFetching && <div className="py-3 text-center text-sm text-muted-foreground">검색 중…</div>}
              {!isFetching && items.length === 0 && <CommandEmpty>검색 결과가 없습니다</CommandEmpty>}
              <CommandGroup>
                {items.map((c) => (
                  <CommandItem
                    key={c.rowId}
                    value={`${c.rowId}`}
                    onSelect={() => {
                      onChange(c.rowId, c.cardName, c.imgUrl)
                      setOpen(false)
                    }}
                    className="flex items-center gap-2"
                  >
                    {c.imgUrl && (
                      <img src={c.imgUrl} alt="" className="h-6 w-10 rounded object-cover" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-sm">{c.cardName}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {c.company?.name} · {c.cardType === 'CREDIT' ? '신용' : '체크'}
                      </div>
                    </div>
                    <Check
                      className={cn(
                        'ml-2 h-4 w-4 shrink-0',
                        value === c.rowId ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {value != null && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="카드 선택 해제"
          onClick={() => onChange(null)}
          disabled={disabled}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
