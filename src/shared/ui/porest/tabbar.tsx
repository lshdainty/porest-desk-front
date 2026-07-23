import * as React from 'react'
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { cn } from '@/shared/lib/index'

/*
 * Porest TabBar — iOS 26+ Liquid Glass 플로팅 하단 네비 (shadcn 서브컴포넌트 패턴).
 * design chrome.jsx MTabBar / app.css .m-tabbar SoT.
 *
 *   <TabBar modeKey={mode} onAddIntent={...}>
 *     <TabBarItem icon={Home} label="홈" active onClick={...} />
 *     <TabBarItem shared … />          — 모드 전환 안무에서 유지되는 공유 탭
 *     <TabBarFab onClick={...} />
 *     <TabBarBack onClick={...} />
 *   </TabBar>
 *
 * 규칙 (design 정합):
 * - 플로팅 필: left/right 14 · bottom 14 · h 66 · radius-full · surface 82% +
 *   backdrop blur(20) saturate(1.7) · 이중 그림자 + inset 1px 보더.
 * - compact (tabBarMinimizeBehavior .onScrollDown): 아래로 누적 20px → 축소
 *   (h 48 · left/right 36 · 라벨 숨김), 위로 누적 28px → 복원. 최상단(<40)은
 *   항상 확장. 방향 전환 시 누적 리셋(지터 방지). compact 상태서 바 탭 → 복원.
 * - 모드 전환 안무(토스): shared 탭은 유지, 나머지 0.13s 아웃(가라앉음) →
 *   교체 → 좌→우 40ms 스태거 인(mtabIn keyframes — porest.css).
 */

const TabBarCtx = createContext<{ compact: boolean }>({ compact: false })

/** 스크롤 방향 히스테리시스 — design DOWN_AT 20 / UP_AT 28 / 최상단 40. */
function useTabBarCompact() {
  const [compact, setCompact] = useState(false)
  useEffect(() => {
    const sc = document.querySelector('.m-app .m-scroll')
    if (!sc) return
    let last = sc.scrollTop
    let acc = 0
    const DOWN_AT = 20
    const UP_AT = 28
    const onScroll = () => {
      const st = sc.scrollTop
      const dy = st - last
      last = st
      if (st < 40) {
        acc = 0
        setCompact(false)
        return
      }
      if ((dy > 0 && acc < 0) || (dy < 0 && acc > 0)) acc = 0
      acc += dy
      if (acc > DOWN_AT) setCompact(true)
      else if (acc < -UP_AT) setCompact(false)
    }
    sc.addEventListener('scroll', onScroll, { passive: true })
    return () => sc.removeEventListener('scroll', onScroll)
  }, [])
  return [compact, setCompact] as const
}

export function TabBar({
  modeKey,
  className,
  children,
}: {
  /** 모드 식별자 — 바뀌면 shared 탭을 제외하고 아웃→스태거 인 안무. */
  modeKey?: string
  className?: string
  children: React.ReactNode
}) {
  const [compact, setCompact] = useTabBarCompact()

  // 모드 전환 안무 — out 단계에선 이전 children 을 유지해 가라앉힌 뒤 교체.
  const [phase, setPhase] = useState<'out' | 'in' | null>(null)
  const [rendered, setRendered] = useState(children)
  const prevMode = useRef(modeKey)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  useEffect(() => {
    if (prevMode.current === modeKey) {
      setRendered(children)
      return
    }
    prevMode.current = modeKey
    setPhase('out')
    timers.current.forEach(clearTimeout)
    timers.current = [
      setTimeout(() => {
        setRendered(children)
        setPhase('in')
        timers.current.push(setTimeout(() => setPhase(null), 420))
      }, 130),
    ]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modeKey, children])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const items = React.Children.toArray(rendered)

  return (
    <TabBarCtx.Provider value={{ compact }}>
      <nav
        className={cn(
          'absolute z-40 grid grid-cols-5 gap-[2px] shrink-0 rounded-full',
          'backdrop-blur-[20px] backdrop-saturate-[1.7]',
          'shadow-[0_10px_30px_rgba(10,16,36,0.18),0_2px_8px_rgba(10,16,36,0.08),inset_0_0_0_1px_color-mix(in_srgb,var(--border-subtle)_70%,transparent)]',
          'transition-[height,left,right,bottom,padding,background-color] duration-[var(--motion-duration-base)] ease-[var(--motion-ease-out)]',
          compact
            ? 'h-12 left-9 right-9 bottom-3 px-2 py-1 bg-[color-mix(in_srgb,var(--bg-surface)_68%,transparent)]'
            : 'h-[66px] left-3.5 right-3.5 bottom-3.5 px-2.5 py-1.5 bg-[color-mix(in_srgb,var(--bg-surface)_82%,transparent)]',
          className,
        )}
        onClick={() => {
          if (compact) setCompact(false)
        }}
      >
        {items.map((child, i) => {
          const shared =
            React.isValidElement<{ shared?: boolean }>(child) && child.props.shared === true
          const phaseCls =
            !phase || shared ? '' : phase === 'out' ? 'opacity-0 translate-y-1.5 scale-[0.92] pointer-events-none transition-[opacity,transform] duration-[130ms] ease-[var(--motion-ease-out)]' : 'animate-[mtabIn_0.24s_var(--motion-ease-out)_both]'
          return (
            <span
              key={i}
              className={cn('flex min-w-0', phaseCls)}
              style={phase === 'in' && !shared ? { animationDelay: `${i * 40}ms` } : undefined}
            >
              {child}
            </span>
          )
        })}
      </nav>
    </TabBarCtx.Provider>
  )
}

export function TabBarItem({
  icon: Icon,
  label,
  active = false,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  shared: _shared,
  className,
  ...props
}: React.ComponentProps<'button'> & {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>
  label: string
  active?: boolean
  /** 모드 전환 안무에서 유지(아웃/인 제외)되는 공유 탭. */
  shared?: boolean
}) {
  const { compact } = useContext(TabBarCtx)
  return (
    <button
      type="button"
      className={cn(
        'flex flex-1 flex-col items-center justify-center border-0 bg-transparent cursor-pointer',
        'rounded-[var(--radius-md)] text-[10.5px] font-medium text-[var(--fg-tertiary)]',
        'transition-colors duration-[var(--motion-duration-fast)]',
        '[&>svg]:text-[var(--fg-tertiary)]',
        active && 'font-semibold text-[var(--fg-brand-strong)] [&>svg]:text-[var(--fg-brand-strong)]',
        compact ? 'gap-0 p-0' : 'gap-[3px] px-0.5 py-1.5',
        className,
      )}
      {...props}
    >
      <Icon size={22} strokeWidth={active ? 2.2 : 1.9} />
      {!compact && <span className="max-h-3.5 overflow-hidden">{label}</span>}
    </button>
  )
}

/** 중앙 + 버튼 — primary 고정 원 (다크에서도 primary, bg-brand 금지). */
export function TabBarFab({
  className,
  ...props
}: React.ComponentProps<'button'>) {
  const { compact } = useContext(TabBarCtx)
  return (
    <button
      type="button"
      className={cn('flex flex-1 items-center justify-center border-0 bg-transparent cursor-pointer', className)}
      {...props}
    >
      <span
        className={cn(
          'inline-flex items-center justify-center rounded-full',
          'bg-[var(--color-primary)] text-[var(--fg-on-brand)] shadow-[var(--shadow-sm)]',
          'transition-[width,height,margin] duration-[var(--motion-duration-base)] ease-[var(--motion-ease-out)]',
          compact ? 'w-9 h-9 mt-0' : 'w-11 h-11 -mt-1.5',
        )}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14" />
          <path d="M12 5v14" />
        </svg>
      </span>
    </button>
  )
}

/** money 모드 ← 버튼 — sunken 필. */
export function TabBarBack({
  className,
  ...props
}: React.ComponentProps<'button'>) {
  const { compact } = useContext(TabBarCtx)
  return (
    <button
      type="button"
      className={cn('flex flex-1 items-center justify-center border-0 bg-transparent cursor-pointer', className)}
      {...props}
    >
      <span
        className={cn(
          'inline-flex items-center justify-center rounded-full',
          'bg-[var(--bg-sunken)] text-[var(--fg-secondary)]',
          'transition-[width,height,background-color] duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-out)]',
          'hover:bg-[var(--bg-muted)]',
          compact ? 'w-8 h-8' : 'w-9 h-9',
        )}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m12 19-7-7 7-7" />
          <path d="M19 12H5" />
        </svg>
      </span>
    </button>
  )
}
