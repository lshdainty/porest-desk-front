import { cn } from '@/shared/lib'

interface ScientificKeypadProps {
  onFunction: (fn: string) => void
  onConstant: (value: string) => void
  onPower: () => void
}

interface SciKeyConfig {
  label: string
  action: () => void
}

export const ScientificKeypad = ({
  onFunction,
  onConstant,
  onPower,
}: ScientificKeypadProps) => {
  const keys: SciKeyConfig[] = [
    { label: 'sin', action: () => onFunction('sin') },
    { label: 'cos', action: () => onFunction('cos') },
    { label: 'tan', action: () => onFunction('tan') },
    { label: 'log', action: () => onFunction('log') },
    { label: 'ln', action: () => onFunction('ln') },
    { label: 'sqrt', action: () => onFunction('sqrt') },
    { label: 'x^y', action: onPower },
    { label: 'pi', action: () => onConstant('pi') },
    { label: 'e', action: () => onConstant('e') },
  ]

  return (
    <div className="grid grid-cols-3 gap-2">
      {keys.map((key) => (
        <button
          key={key.label}
          onClick={key.action}
          className={cn(
            'flex items-center justify-center rounded-lg border bg-card px-2 py-2.5 text-xs font-medium transition-colors',
            'hover:bg-muted active:scale-95 min-h-[44px]'
          )}
        >
          {key.label === 'sqrt' ? '\u221A' : key.label === 'pi' ? '\u03C0' : key.label}
        </button>
      ))}
    </div>
  )
}
