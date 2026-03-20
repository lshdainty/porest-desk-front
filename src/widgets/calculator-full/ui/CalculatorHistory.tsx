import { useTranslation } from 'react-i18next'
import { Trash2, Clock } from 'lucide-react'
import type { CalculatorHistory as CalculatorHistoryType } from '@/entities/calculator'
import { formatDate } from '@/shared/lib'

interface CalculatorHistoryProps {
  histories: CalculatorHistoryType[]
  onSelectResult: (result: string) => void
  onClearAll: () => void
  isClearing?: boolean
}

export const CalculatorHistory = ({
  histories,
  onSelectResult,
  onClearAll,
  isClearing,
}: CalculatorHistoryProps) => {
  const { t } = useTranslation('calculator')

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-muted-foreground" />
          <span className="text-sm font-semibold">{t('history')}</span>
        </div>
        {histories.length > 0 && (
          <button
            onClick={onClearAll}
            disabled={isClearing}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
          >
            <Trash2 size={12} />
            {t('clearHistory')}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {histories.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            {t('noHistory')}
          </div>
        ) : (
          <div className="space-y-0.5 p-2">
            {[...histories].reverse().map((item) => (
              <button
                key={item.rowId}
                onClick={() => onSelectResult(item.result)}
                className="w-full rounded-md p-3 text-right hover:bg-muted transition-colors"
              >
                <p className="text-xs text-muted-foreground">{item.expression}</p>
                <p className="text-sm font-semibold">= {item.result}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {formatDate(item.createAt, 'MM.dd HH:mm')}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
