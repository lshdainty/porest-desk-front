import { useTranslation } from 'react-i18next'
import { Search, X } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/lib'

interface MemoSearchProps {
  value: string
  onChange: (value: string) => void
}

export const MemoSearch = ({ value, onChange }: MemoSearchProps) => {
  const { t } = useTranslation('memo')

  return (
    <div className="relative">
      <Search
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('searchPlaceholder')}
        className={cn(
          'w-full rounded-md border bg-background py-2 pl-9 pr-8 text-sm outline-none',
          'focus:ring-2 focus:ring-primary/20 focus:border-primary'
        )}
      />
      {value && (
        <Button
          variant="ghost"
          size="xs"
          onClick={() => onChange('')}
          aria-label="검색 지우기"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full p-0"
        >
          <X size={14} />
        </Button>
      )}
    </div>
  )
}
