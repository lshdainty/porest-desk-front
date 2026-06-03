import * as React from 'react'
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'
import { Check } from 'lucide-react'

import { cn } from '@/shared/lib/index'

/*
 * RadioList — porest-design spec radio-list.md SoT 정합.
 * full-width row stack + divide-y single-select.
 * 사용처: 통화/언어/국가/지역 등 목록형 선택.
 */

const RadioList = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, style, ...props }, ref) => (
  <RadioGroupPrimitive.Root
    ref={ref}
    className={cn(
      // shadow 카드 — border 대신 elevation. 내부 행 구분은 divide-y 유지.
      'rounded-[var(--radius-lg)] bg-surface-default overflow-hidden',
      'divide-y divide-[var(--border-subtle)]',
      className,
    )}
    style={{ boxShadow: 'var(--shadow-sm)', ...style }}
    {...props}
  />
))
RadioList.displayName = 'RadioList'

type RadioListItemProps = React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> & {
  size?: 'sm' | 'md' | 'lg'
  pill?: React.ReactNode
  pillClassName?: string
  label: React.ReactNode
  subLabel?: React.ReactNode
}

const SIZE_STYLES = {
  sm: { padding: 'px-3 py-[10px]', pill: 'h-7 w-7', gap: 'gap-2.5', check: 14 },
  md: { padding: 'px-4 py-[14px]', pill: 'h-8 w-8', gap: 'gap-3', check: 16 },
  lg: { padding: 'px-5 py-4', pill: 'h-10 w-10', gap: 'gap-[14px]', check: 18 },
}

const RadioListItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  RadioListItemProps
>(({ className, size = 'md', pill, pillClassName, label, subLabel, ...props }, ref) => {
  const s = SIZE_STYLES[size]
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        'w-full flex items-center text-left bg-transparent',
        s.padding,
        s.gap,
        'hover:bg-surface-input transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-[-2px]',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className,
      )}
      {...props}
    >
      {pill != null && (
        <span
          className={cn(
            'inline-flex items-center justify-center flex-shrink-0',
            'rounded-[var(--radius-md)] bg-[var(--bg-canvas)]',
            'text-body-lg font-bold text-text-primary',
            s.pill,
            pillClassName,
          )}
        >
          {pill}
        </span>
      )}
      <span className="flex-1 min-w-0">
        <span className="block text-body font-semibold text-text-primary">{label}</span>
        {subLabel != null && (
          <span className="block mt-0.5 text-caption text-text-tertiary">{subLabel}</span>
        )}
      </span>
      <RadioGroupPrimitive.Indicator className="flex-shrink-0 text-primary">
        <Check size={s.check} strokeWidth={2.2} />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
})
RadioListItem.displayName = 'RadioListItem'

export { RadioList, RadioListItem }
