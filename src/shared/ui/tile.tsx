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
>(({ className, size = 'md', swatch, swatchClassName, label, description, style, ...props }, ref) => {
  const s = SIZE_STYLES[size]
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        // 세로 스택 타일(사용자 결정, 클로드 디자인) — swatch 위 중앙 + 라벨/설명 중앙, 체크 우상단.
        // 앱 PTile 동일 수정과 세트.
        'group/tile relative flex flex-col items-center text-center',
        s.padding,
        s.gap,
        // 카드 다이어트(사용자 결정) — 미선택은 투명(카드/그림자 없음), 선택만 brand 보더+subtle 틴트.
        // 보더 색은 앱 PTile(borderBrand — 다크 light swap) 정합.
        'rounded-[var(--radius-lg)] border border-transparent bg-transparent',
        'data-[state=checked]:border-[1.5px] data-[state=checked]:border-[var(--border-brand)]',
        'data-[state=checked]:bg-[var(--bg-brand-subtle)]',
        'transition-[border-color,background-color,box-shadow] duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-out)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className,
      )}
      style={style}
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
      <span className="w-full min-w-0">
        <span className="block text-body font-semibold text-text-primary truncate">{label}</span>
        {description != null && (
          <span className="block mt-0.5 text-caption text-text-tertiary truncate">{description}</span>
        )}
      </span>
      {/* 체크 색은 앱 fgBrand(다크 light swap) 정합 — primary(다크 진파랑)는 어두움. */}
      <RadioGroupPrimitive.Indicator className="absolute top-2 right-2 text-[var(--fg-brand)]">
        <Check size={s.check} strokeWidth={2.2} />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
})
TileItem.displayName = 'TileItem'

export { TileGroup, TileItem }
