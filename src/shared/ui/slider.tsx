import * as React from 'react'
import * as SliderPrimitive from '@radix-ui/react-slider'

import { cn } from '@/shared/lib'

/*
 * Slider — porest-design specs/components/slider.md SoT 정합.
 * Radix Slider 베이스. 키보드 / 마우스 / 터치 드래그.
 * track: 4px(h-1) + primary fill, thumb 16(h-4 w-4) + bg-text-on-accent(흰색 고정).
 */

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn('relative flex w-full touch-none select-none items-center', className)}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-1 w-full grow overflow-hidden rounded-full bg-surface-input">
      <SliderPrimitive.Range className="absolute h-full bg-primary" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border-2 border-primary bg-text-on-accent shadow-sm ring-offset-bg-page transition-[box-shadow,border-color] duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
