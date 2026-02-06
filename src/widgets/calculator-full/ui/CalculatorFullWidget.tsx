import { useState, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { History, ChevronUp, ChevronDown, FlaskConical } from 'lucide-react'
import { cn } from '@/shared/lib'
import { useIsMobile } from '@/shared/hooks'
import {
  useCalculatorHistories,
  useSaveCalculatorHistory,
  useDeleteAllCalculatorHistories,
  evaluate,
} from '@/features/calculator'
import { CalculatorDisplay } from './CalculatorDisplay'
import { CalculatorKeypad } from './CalculatorKeypad'
import { ScientificKeypad } from './ScientificKeypad'
import { CalculatorHistory } from './CalculatorHistory'

export const CalculatorFullWidget = () => {
  const { t } = useTranslation('calculator')
  const isMobile = useIsMobile()

  const [expression, setExpression] = useState('')
  const [result, setResult] = useState('0')
  const [isNewInput, setIsNewInput] = useState(true)
  const [showScientific, setShowScientific] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const { data: histories } = useCalculatorHistories()
  const saveHistory = useSaveCalculatorHistory()
  const deleteAllHistories = useDeleteAllCalculatorHistories()

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      if (/^\d$/.test(e.key)) {
        handleInput(e.key)
      } else if (e.key === '.') {
        handleInput('.')
      } else if (['+', '-', '*', '/'].includes(e.key)) {
        handleOperator(e.key)
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault()
        handleEquals()
      } else if (e.key === 'Backspace') {
        handleBackspace()
      } else if (e.key === 'Escape') {
        handleClear()
      } else if (e.key === '(' || e.key === ')') {
        handleParenthesis(e.key)
      } else if (e.key === '%') {
        handlePercent()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expression, isNewInput])

  const handleInput = useCallback((value: string) => {
    setExpression((prev) => {
      if (isNewInput && value !== '.') {
        setIsNewInput(false)
        return value
      }
      // Prevent multiple dots in the same number
      if (value === '.') {
        const parts = prev.split(/[+\-*/^()]/)
        const lastPart = parts[parts.length - 1]
        if (lastPart.includes('.')) return prev
      }
      return prev + value
    })
    setResult((prev) => {
      const newExpr = isNewInput && value !== '.' ? value : expression + value
      const evaluated = evaluate(newExpr)
      return evaluated !== 'Error' ? evaluated : prev
    })
  }, [expression, isNewInput])

  const handleOperator = useCallback((op: string) => {
    setIsNewInput(false)
    setExpression((prev) => {
      if (!prev) return ''
      // Replace last operator if there is one
      const lastChar = prev[prev.length - 1]
      if (['+', '-', '*', '/', '^'].includes(lastChar)) {
        return prev.slice(0, -1) + op
      }
      return prev + op
    })
  }, [])

  const handleEquals = useCallback(() => {
    if (!expression) return
    const evaluated = evaluate(expression)
    if (evaluated !== 'Error') {
      saveHistory.mutate({ expression, result: evaluated })
    }
    setResult(evaluated)
    setExpression('')
    setIsNewInput(true)
  }, [expression, saveHistory])

  const handleClear = useCallback(() => {
    setExpression('')
    setResult('0')
    setIsNewInput(true)
  }, [])

  const handleClearEntry = useCallback(() => {
    setExpression('')
    setIsNewInput(true)
  }, [])

  const handleBackspace = useCallback(() => {
    setExpression((prev) => {
      const newExpr = prev.slice(0, -1)
      if (newExpr) {
        const evaluated = evaluate(newExpr)
        if (evaluated !== 'Error') {
          setResult(evaluated)
        }
      } else {
        setResult('0')
      }
      return newExpr
    })
  }, [])

  const handleToggleSign = useCallback(() => {
    setExpression((prev) => {
      if (!prev) return '-'
      if (prev.startsWith('-')) return prev.slice(1)
      return '-' + prev
    })
  }, [])

  const handlePercent = useCallback(() => {
    setExpression((prev) => prev + '%')
  }, [])

  const handleParenthesis = useCallback((paren: string) => {
    setIsNewInput(false)
    setExpression((prev) => prev + paren)
  }, [])

  const handleFunction = useCallback((fn: string) => {
    setIsNewInput(false)
    setExpression((prev) => prev + fn + '(')
  }, [])

  const handleConstant = useCallback((constant: string) => {
    setIsNewInput(false)
    setExpression((prev) => prev + constant)
    const evaluated = evaluate(expression + constant)
    if (evaluated !== 'Error') {
      setResult(evaluated)
    }
  }, [expression])

  const handlePower = useCallback(() => {
    setIsNewInput(false)
    setExpression((prev) => prev + '^')
  }, [])

  const handleSelectResult = useCallback((value: string) => {
    setExpression(value)
    setResult(value)
    setIsNewInput(true)
    if (isMobile) {
      setShowHistory(false)
    }
  }, [isMobile])

  const handleClearAllHistories = useCallback(() => {
    setShowClearConfirm(true)
  }, [])

  const confirmClearHistories = useCallback(() => {
    deleteAllHistories.mutate(undefined, {
      onSuccess: () => {
        setShowClearConfirm(false)
      },
    })
  }, [deleteAllHistories])

  // Mobile layout
  if (isMobile) {
    return (
      <div className="relative flex h-full flex-col">
        {/* Display */}
        <div className="p-4">
          <CalculatorDisplay expression={expression} result={result} />
        </div>

        {/* Mode toggles */}
        <div className="flex items-center justify-between px-4 pb-2">
          <button
            onClick={() => setShowScientific(!showScientific)}
            className={cn(
              'flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors',
              showScientific
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            <FlaskConical size={12} />
            {showScientific ? t('standard') : t('scientific')}
          </button>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={cn(
              'flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors',
              showHistory
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            <History size={12} />
            {t('history')}
          </button>
        </div>

        {/* Scientific keypad (collapsible) */}
        {showScientific && (
          <div className="px-4 pb-2">
            <ScientificKeypad
              onFunction={handleFunction}
              onConstant={handleConstant}
              onPower={handlePower}
            />
          </div>
        )}

        {/* Standard keypad */}
        <div className="mt-auto p-4">
          <CalculatorKeypad
            onInput={handleInput}
            onOperator={handleOperator}
            onEquals={handleEquals}
            onClear={handleClear}
            onClearEntry={handleClearEntry}
            onBackspace={handleBackspace}
            onToggleSign={handleToggleSign}
            onPercent={handlePercent}
            onParenthesis={handleParenthesis}
          />
        </div>

        {/* History bottom sheet */}
        {showHistory && (
          <div
            className="fixed inset-0 z-50 bg-black/40"
            onClick={() => setShowHistory(false)}
          >
            <div
              className="absolute bottom-0 left-0 right-0 max-h-[60vh] rounded-t-2xl bg-background shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-center py-2">
                <button
                  onClick={() => setShowHistory(false)}
                  className="rounded-full p-1 text-muted-foreground"
                >
                  <ChevronDown size={20} />
                </button>
              </div>
              <div className="h-[50vh]">
                <CalculatorHistory
                  histories={histories || []}
                  onSelectResult={handleSelectResult}
                  onClearAll={handleClearAllHistories}
                  isClearing={deleteAllHistories.isPending}
                />
              </div>
            </div>
          </div>
        )}

        {/* Clear history confirmation */}
        {showClearConfirm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={() => setShowClearConfirm(false)}
          >
            <div
              className="mx-4 w-full max-w-sm rounded-lg bg-background p-6 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold">{t('clearHistoryConfirm.title')}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {t('clearHistoryConfirm.message')}
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
                >
                  {t('clearHistoryConfirm.cancel')}
                </button>
                <button
                  onClick={confirmClearHistories}
                  disabled={deleteAllHistories.isPending}
                  className="flex-1 rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
                >
                  {deleteAllHistories.isPending ? '...' : t('clearHistoryConfirm.confirm')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Desktop layout
  return (
    <div className="flex gap-4">
      {/* Calculator */}
      <div className="w-full max-w-md space-y-4">
        {/* Display */}
        <CalculatorDisplay expression={expression} result={result} />

        {/* Mode toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowScientific(!showScientific)}
            className={cn(
              'flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors',
              showScientific
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            <FlaskConical size={12} />
            {showScientific ? t('standard') : t('scientific')}
          </button>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={cn(
              'flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors md:hidden',
              showHistory
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            <History size={12} />
            {t('history')}
          </button>
        </div>

        {/* Scientific keypad */}
        {showScientific && (
          <ScientificKeypad
            onFunction={handleFunction}
            onConstant={handleConstant}
            onPower={handlePower}
          />
        )}

        {/* Standard keypad */}
        <CalculatorKeypad
          onInput={handleInput}
          onOperator={handleOperator}
          onEquals={handleEquals}
          onClear={handleClear}
          onClearEntry={handleClearEntry}
          onBackspace={handleBackspace}
          onToggleSign={handleToggleSign}
          onPercent={handlePercent}
          onParenthesis={handleParenthesis}
        />
      </div>

      {/* History sidebar (desktop only) */}
      <div className="hidden w-72 shrink-0 overflow-hidden rounded-lg border md:block">
        <CalculatorHistory
          histories={histories || []}
          onSelectResult={handleSelectResult}
          onClearAll={handleClearAllHistories}
          isClearing={deleteAllHistories.isPending}
        />
      </div>

      {/* Clear history confirmation */}
      {showClearConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowClearConfirm(false)}
        >
          <div
            className="mx-4 w-full max-w-sm rounded-lg bg-background p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold">{t('clearHistoryConfirm.title')}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('clearHistoryConfirm.message')}
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
              >
                {t('clearHistoryConfirm.cancel')}
              </button>
              <button
                onClick={confirmClearHistories}
                disabled={deleteAllHistories.isPending}
                className="flex-1 rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
              >
                {deleteAllHistories.isPending ? '...' : t('clearHistoryConfirm.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
