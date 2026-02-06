import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Calculator, ArrowRight } from 'lucide-react'

export const CalculatorMiniWidget = () => {
  const { t } = useTranslation('dashboard')
  const navigate = useNavigate()
  const [display, setDisplay] = useState('0')
  const [expression, setExpression] = useState('')

  const handleInput = (value: string) => {
    if (value === 'C') {
      setDisplay('0')
      setExpression('')
      return
    }

    if (value === '=') {
      try {
        const sanitized = expression.replace(/[^0-9+\-*/.() ]/g, '')
        const result = new Function(`return ${sanitized}`)()
        const formatted = Number.isFinite(result) ? String(Number(result.toFixed(10))) : 'Error'
        setDisplay(formatted)
        setExpression(formatted)
      } catch {
        setDisplay('Error')
        setExpression('')
      }
      return
    }

    if (['+', '-', '*', '/'].includes(value)) {
      setExpression((prev) => prev + value)
      setDisplay(value)
      return
    }

    setExpression((prev) => (prev === '0' ? value : prev + value))
    setDisplay((prev) => {
      if (['+', '-', '*', '/', '0'].includes(prev) && prev !== '0.') {
        return value
      }
      return prev + value
    })
  }

  const buttons = ['7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', 'C', '0', '=', '+']

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b p-3">
        <Calculator size={16} className="text-primary" />
        <h3 className="text-sm font-semibold">{t('calculator.title')}</h3>
      </div>

      <div className="flex-1 p-3">
        <div className="space-y-2">
          <div className="rounded-md bg-muted/50 px-3 py-2 text-right">
            <p className="text-xs text-muted-foreground truncate">{expression || '\u00A0'}</p>
            <p className="text-xl font-bold font-mono truncate">{display}</p>
          </div>

          <div className="grid grid-cols-4 gap-1">
            {buttons.map((btn) => (
              <button
                key={btn}
                onClick={() => handleInput(btn)}
                className={
                  'rounded-md p-1.5 text-xs font-medium transition-colors ' +
                  (btn === '=' ? 'bg-primary text-primary-foreground hover:bg-primary/90' :
                   btn === 'C' ? 'bg-destructive/10 text-destructive hover:bg-destructive/20' :
                   ['+', '-', '*', '/'].includes(btn) ? 'bg-muted hover:bg-muted/80 text-foreground' :
                   'bg-muted/50 hover:bg-muted text-foreground')
                }
              >
                {btn}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={() => navigate('/desk/calculator')}
        className="flex items-center justify-center gap-1 border-t p-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        {t('calculator.openFull')}
        <ArrowRight size={12} />
      </button>
    </div>
  )
}
