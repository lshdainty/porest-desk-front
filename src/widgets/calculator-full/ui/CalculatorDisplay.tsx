import { cn } from '@/shared/lib'
import { formatDisplay } from '@/features/calculator'

interface CalculatorDisplayProps {
  expression: string
  result: string
}

export const CalculatorDisplay = ({ expression, result }: CalculatorDisplayProps) => {
  return (
    <div className="flex flex-col items-end justify-end rounded-lg bg-muted/50 p-4">
      {/* Expression */}
      <div className="w-full overflow-x-auto text-right">
        <p
          className={cn(
            'whitespace-nowrap text-sm text-muted-foreground',
            !expression && 'invisible'
          )}
        >
          {expression || '0'}
        </p>
      </div>
      {/* Result */}
      <div className="w-full overflow-x-auto text-right">
        <p className="whitespace-nowrap text-3xl font-bold md:text-4xl">
          {result === 'Error' ? result : formatDisplay(result) || '0'}
        </p>
      </div>
    </div>
  )
}
