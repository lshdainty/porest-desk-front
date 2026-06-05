import * as React from 'react'
import * as SliderPrimitive from '@radix-ui/react-slider'

import { cn } from '@/shared/lib'

/*
 * Slider — porest-design specs/components/slider.md SoT 정합.
 * Radix Slider 베이스. 키보드 / 마우스 / 터치 드래그.
 * track: 4px(h-1) + primary fill, thumb 16(h-4 w-4) + bg-text-on-accent(흰색 고정).
 * ticks: 트랙 위 균등 간격 눈금 점 — step 단위 선택 가능함을 시각화 (앱 divisions 정합).
 */

type SliderProps = React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
  /** 트랙 위 눈금 점 개수 (구간 수 + 1). 예: 50~100 step 5 → 11. */
  ticks?: number
}

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({ className, ticks, ...props }, ref) => {
  // 채움 비율 — 틱 점이 채움 구간 위에선 흰색, 바깥에선 중립색으로 보이게.
  const v = props.value?.[0] ?? props.defaultValue?.[0]
  const min = props.min ?? 0
  const max = props.max ?? 100
  const pct = v == null ? 0 : (v - min) / (max - min || 1)

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn('relative flex w-full touch-none select-none items-center', className)}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1 w-full grow overflow-hidden rounded-full bg-surface-input">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
        {ticks != null && ticks > 1 &&
          Array.from({ length: ticks }).map((_, i) => {
            const p = i / (ticks - 1)
            return (
              <span
                key={i}
                aria-hidden
                style={{
                  position: 'absolute',
                  // 양 끝 점이 잘리지 않게 2px 인셋.
                  left: `calc(2px + ${p} * (100% - 4px))`,
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 2,
                  height: 2,
                  borderRadius: 999,
                  background: p <= pct ? 'var(--fg-on-brand)' : 'var(--fg-tertiary)',
                  opacity: 0.6,
                  pointerEvents: 'none',
                }}
              />
            )
          })}
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border-2 border-primary bg-text-on-accent shadow-sm ring-offset-bg-page transition-[box-shadow,border-color] duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
    </SliderPrimitive.Root>
  )
})
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
