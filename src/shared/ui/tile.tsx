import * as React from 'react'
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'
import { Check } from 'lucide-react'

import { cn } from '@/shared/lib/index'

/*
 * Tile — porest-design spec tile.md SoT 정합.
 * swatch + label + desc + active check 의 큰 카드 single-select.
 * 사용처: 테마/기본 단위/시작 화면 등 시각 미리보기가 의미인 선택.
 */

type TileGroupProps = React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root> & {
  columns?: number | string
}

const TileGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  TileGroupProps
>(({ className, columns, style, ...props }, ref) => (
  <RadioGroupPrimitive.Root
    ref={ref}
    className={cn('grid gap-[var(--spacing-sm)]', className)}
    style={{
      gridTemplateColumns:
        typeof columns === 'number' ? `repeat(${columns}, minmax(0, 1fr))` : columns,
      ...style,
    }}
    {...props}
  />
))
TileGroup.displayName = 'TileGroup'

type TileItemProps = React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> & {
  size?: 'sm' | 'md' | 'lg'
  swatch?: React.ReactNode
  swatchClassName?: string
  label: React.ReactNode
  description?: React.ReactNode
}

const SIZE_STYLES = {
  sm: { padding: 'px-3 py-2.5', swatch: 'h-8 w-8', gap: 'gap-2.5', check: 14 },
  md: { padding: 'px-[14px] py-[16px]', swatch: 'h-10 w-10', gap: 'gap-3', check: 16 },
  lg: { padding: 'px-[18px] py-[20px]', swatch: 'h-12 w-12', gap: 'gap-[14px]', check: 18 },
}

const TileItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  TileItemProps
>(({ className, size = 'md', swatch, swatchClassName, label, description, ...props }, ref) => {
  const s = SIZE_STYLES[size]
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        'group/tile relative flex items-center text-left',
        s.padding,
        s.gap,
        'rounded-[var(--radius-lg)] border bg-surface-default',
        'border-[var(--border-subtle)] hover:border-[var(--border-default)]',
        'data-[state=checked]:border-[1.5px] data-[state=checked]:border-primary',
        'data-[state=checked]:bg-[color-mix(in_oklch,var(--color-primary)_8%,transparent)]',
        'transition-[border-color,background-color] duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-out)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className,
      )}
      {...props}
    >
      {swatch != null && (
        <span
          className={cn(
            'inline-flex items-center justify-center flex-shrink-0',
            'rounded-[var(--radius-tile)] border border-[var(--border-subtle)] overflow-hidden',
            s.swatch,
            swatchClassName,
          )}
        >
          {swatch}
        </span>
      )}
      <span className="flex-1 min-w-0">
        <span className="block text-body font-semibold text-text-primary">{label}</span>
        {description != null && (
          <span className="block mt-0.5 text-caption text-text-tertiary">{description}</span>
        )}
      </span>
      <RadioGroupPrimitive.Indicator className="flex-shrink-0 text-primary">
        <Check size={s.check} strokeWidth={2.2} />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
})
TileItem.displayName = 'TileItem'

export { TileGroup, TileItem }
