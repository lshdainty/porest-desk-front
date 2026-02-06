import { useTranslation } from 'react-i18next'
import { Search, X } from 'lucide-react'
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
        <button
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:bg-muted"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}
