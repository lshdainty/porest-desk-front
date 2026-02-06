import { cn } from '@/shared/lib'

interface CalculatorKeypadProps {
  onInput: (value: string) => void
  onOperator: (op: string) => void
  onEquals: () => void
  onClear: () => void
  onClearEntry: () => void
  onBackspace: () => void
  onToggleSign: () => void
  onPercent: () => void
  onParenthesis: (paren: string) => void
}

interface KeyConfig {
  label: string
  action: () => void
  variant: 'number' | 'operator' | 'action' | 'equals'
  span?: number
}

export const CalculatorKeypad = ({
  onInput,
  onOperator,
  onEquals,
  onClear,
  onClearEntry,
  onBackspace,
  onToggleSign,
  onPercent,
  onParenthesis,
}: CalculatorKeypadProps) => {
  const keys: KeyConfig[][] = [
    [
      { label: '(', action: () => onParenthesis('('), variant: 'action' },
      { label: ')', action: () => onParenthesis(')'), variant: 'action' },
      { label: 'C', action: onClearEntry, variant: 'action' },
      { label: 'AC', action: onClear, variant: 'action' },
    ],
    [
      { label: '%', action: onPercent, variant: 'action' },
      { label: '+/-', action: onToggleSign, variant: 'action' },
      { label: 'DEL', action: onBackspace, variant: 'action' },
      { label: '/', action: () => onOperator('/'), variant: 'operator' },
    ],
    [
      { label: '7', action: () => onInput('7'), variant: 'number' },
      { label: '8', action: () => onInput('8'), variant: 'number' },
      { label: '9', action: () => onInput('9'), variant: 'number' },
      { label: '*', action: () => onOperator('*'), variant: 'operator' },
    ],
    [
      { label: '4', action: () => onInput('4'), variant: 'number' },
      { label: '5', action: () => onInput('5'), variant: 'number' },
      { label: '6', action: () => onInput('6'), variant: 'number' },
      { label: '-', action: () => onOperator('-'), variant: 'operator' },
    ],
    [
      { label: '1', action: () => onInput('1'), variant: 'number' },
      { label: '2', action: () => onInput('2'), variant: 'number' },
      { label: '3', action: () => onInput('3'), variant: 'number' },
      { label: '+', action: () => onOperator('+'), variant: 'operator' },
    ],
    [
      { label: '0', action: () => onInput('0'), variant: 'number', span: 2 },
      { label: '.', action: () => onInput('.'), variant: 'number' },
      { label: '=', action: onEquals, variant: 'equals' },
    ],
  ]

  const getButtonClasses = (variant: KeyConfig['variant']) => {
    const base = 'flex items-center justify-center rounded-lg text-base font-medium transition-colors active:scale-95 min-h-[48px] md:min-h-[52px]'
    switch (variant) {
      case 'number':
        return cn(base, 'bg-card border hover:bg-muted')
      case 'operator':
        return cn(base, 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20')
      case 'action':
        return cn(base, 'bg-muted text-muted-foreground hover:bg-muted/80')
      case 'equals':
        return cn(base, 'bg-primary text-primary-foreground hover:bg-primary/90')
    }
  }

  return (
    <div className="grid grid-cols-4 gap-2">
      {keys.flat().map((key, index) => (
        <button
          key={index}
          onClick={key.action}
          className={cn(
            getButtonClasses(key.variant),
            key.span === 2 && 'col-span-2'
          )}
        >
          {key.label === '*' ? '\u00D7' : key.label === '/' ? '\u00F7' : key.label}
        </button>
      ))}
    </div>
  )
}
