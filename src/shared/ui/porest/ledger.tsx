import * as React from 'react'
import { useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/shared/lib/index'
import { Card } from '@/shared/ui/card'

/*
 * Porest Ledger — 모바일 "원장" 레이아웃 공용 컴포넌트 (shadcn 서브컴포넌트 패턴).
 *
 * 가계부(ExpensePage)·할일(TodoMobileLedger)이 공유하는 캘린더+일별 리스트 통합 뷰의
 * 큰 틀을 위에서 아래로 컴포넌트화한 것 (design tx-mobile.jsx / todo-mobile.jsx):
 *
 *   <LedgerShell ref={rootRef}>
 *     <LedgerPin ref={pinRef} compact={compact}>
 *       <LedgerMonthNav> <LedgerNavBtn/> <LedgerMonthLabel/> … </LedgerMonthNav>
 *       <LedgerCollapse>
 *         <LedgerHead> <LedgerTotal/> <LedgerSub/> <LedgerSumBtn/> </LedgerHead>
 *         <LedgerSummary> <LedgerSummaryRow/> … </LedgerSummary>
 *       </LedgerCollapse>
 *       <LedgerCalendar>
 *         <LedgerDow/> <LedgerWeek> <LedgerCell> <LedgerCellNum/> <LedgerCellAmt/> …
 *         <LedgerExpand/> <LedgerCellTip/>
 *       </LedgerCalendar>
 *       <LedgerDivider/>
 *     </LedgerPin>
 *     <LedgerList> <LedgerDayGroup day> <LedgerDayHead> … </LedgerList>
 *     <LedgerPrevBtn/>
 *   </LedgerShell>
 *
 * - 페이지 인셋은 Shell(--spacing-xl=24)이 담당, 내부 요소 인셋 0 (사용자 결정).
 *   Pin·Divider는 배경/구분선 풀블리드를 위해 negative margin full-bleed.
 * - 행(row)은 도메인별로 다르므로 children 슬롯 — 화면이 소유.
 * - 스크롤 동작(compact 히스테리시스·스파이·lock)은 useLedgerScroll 훅 공용.
 */

// ─── 스크롤 훅 ──────────────────────────────────────────────

const COMPACT_ENTER = 72
const COMPACT_EXIT = 24

/**
 * pin compact(72/24 히스테리시스 + 짧은 콘텐츠 플리커 가드) · 스크롤 스파이
 * ([data-ledger-day] 그룹 → 선택 동기) · lock/scrollToDay 공용 훅.
 */
export function useLedgerScroll({
  pinTop = 0,
  initialSelected = null,
  onCompactEnter,
}: {
  /** 상단 고정 헤더 높이(px) — sticky top·스크롤 보정 offset. */
  pinTop?: number
  initialSelected?: string | null
  /** compact 진입 순간 콜백 (예: 캘린더 월 전체 → 주 1줄 접기). */
  onCompactEnter?: () => void
}) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const pinRef = useRef<HTMLDivElement | null>(null)
  const [compact, setCompact] = useState(false)
  const [selected, setSelected] = useState<string | null>(initialSelected)
  const selectedRef = useRef<string | null>(initialSelected)
  useEffect(() => {
    selectedRef.current = selected
  }, [selected])

  const lockRef = useRef(false)
  const lockTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lock = (ms: number) => {
    lockRef.current = true
    if (lockTimer.current) clearTimeout(lockTimer.current)
    lockTimer.current = setTimeout(() => {
      lockRef.current = false
    }, ms)
  }

  const onCompactEnterRef = useRef(onCompactEnter)
  onCompactEnterRef.current = onCompactEnter

  const scroller = () =>
    rootRef.current?.closest('.m-scroll, .overflow-y-auto') as HTMLElement | null

  useEffect(() => {
    const p = scroller()
    if (!p) return
    const onScroll = () => {
      const st = p.scrollTop
      setCompact(prev => {
        // 콘텐츠가 짧으면 접힘(−collapse 높이) 순간 scrollTop이 해제 임계 아래로
        // clamp돼 접힘↔펼침 무한 플리커 발생 — 접힌 뒤에도 진입 임계 위에
        // 남을 수 있는 스크롤 여유가 있을 때만 진입.
        const collapseH =
          pinRef.current?.querySelector('[data-ledger-collapse]')?.scrollHeight ?? 0
        const canStay =
          p.scrollHeight - p.clientHeight - (prev ? 0 : collapseH) > COMPACT_ENTER
        const next = prev ? st > COMPACT_EXIT : st > COMPACT_ENTER && canStay
        if (next && !prev) onCompactEnterRef.current?.()
        return next
      })
      if (lockRef.current || !pinRef.current || !rootRef.current) return
      const bottom = pinRef.current.getBoundingClientRect().bottom
      const groups = rootRef.current.querySelectorAll('[data-ledger-day]')
      if (!groups.length) return
      let cur = groups[0]!.getAttribute('data-ledger-day')
      for (const g of groups) {
        if (g.getBoundingClientRect().top <= bottom + 28) cur = g.getAttribute('data-ledger-day')
        else break
      }
      if (cur && selectedRef.current !== cur) {
        selectedRef.current = cur
        setSelected(cur)
      }
    }
    p.addEventListener('scroll', onScroll, { passive: true })
    return () => p.removeEventListener('scroll', onScroll)
  }, [])

  const scrollToDay = (ds: string) => {
    const el = rootRef.current?.querySelector(`[data-ledger-day="${ds}"]`)
    const p = scroller()
    if (!el || !p) return
    const pinH = (pinRef.current?.offsetHeight ?? 0) + pinTop
    p.scrollTo({
      top: p.scrollTop + el.getBoundingClientRect().top - p.getBoundingClientRect().top - pinH - 6,
      behavior: 'smooth',
    })
  }
  const scrollToTop = () => scroller()?.scrollTo({ top: 0, behavior: 'smooth' })

  return { rootRef, pinRef, compact, selected, setSelected, lock, scrollToDay, scrollToTop }
}

// ─── 큰 틀 ──────────────────────────────────────────────────

/** 페이지 루트 — 좌우 spacing-xl(24) 인셋 담당, 하단 28. */
export const LedgerShell = React.forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('px-[var(--spacing-xl)] pb-[28px]', className)} {...props} />
  ),
)
LedgerShell.displayName = 'LedgerShell'

/** 상단 고정 영역 — sticky + surface 배경(풀블리드), compact 시 Collapse 접힘. */
export const LedgerPin = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & { compact?: boolean; top?: number }
>(({ className, compact = false, top, style, ...props }, ref) => (
  <div
    ref={ref}
    data-compact={compact}
    className={cn(
      'group/pin sticky z-[5] bg-[var(--bg-surface)] pt-[10px]',
      '-mx-[var(--spacing-xl)] px-[var(--spacing-xl)]',
      className,
    )}
    style={{ top: top ?? 0, ...style }}
    {...props}
  />
))
LedgerPin.displayName = 'LedgerPin'

/** compact 시 접히는 영역 (총액/인사이트/요약 등). */
export function LedgerCollapse({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-ledger-collapse
      className={cn(
        'overflow-hidden max-h-[340px] opacity-100',
        'transition-[max-height,opacity] duration-[220ms] ease-[var(--motion-ease-out)]',
        'group-data-[compact=true]/pin:max-h-0 group-data-[compact=true]/pin:opacity-0 group-data-[compact=true]/pin:pointer-events-none',
        className,
      )}
      {...props}
    />
  )
}

/** 구분선 — 풀블리드. */
export function LedgerDivider({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('h-px bg-[var(--border-default)] -mx-[var(--spacing-xl)]', className)}
      {...props}
    />
  )
}

// ─── 월 네비 ────────────────────────────────────────────────

export function LedgerMonthNav({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('flex items-center gap-[2px]', className)} {...props} />
}

/** 월 이동/필터/추가 등 36px 아이콘 버튼 — active 시 브랜드 틴트. */
export function LedgerNavBtn({
  className,
  active = false,
  type = 'button',
  ...props
}: React.ComponentProps<'button'> & { active?: boolean }) {
  return (
    <button
      type={type}
      className={cn(
        'w-9 h-9 inline-flex items-center justify-center border-0 bg-transparent',
        'text-[var(--fg-secondary)] cursor-pointer rounded-[10px]',
        'disabled:opacity-30 disabled:cursor-default',
        active && 'bg-[var(--bg-brand-subtle)] text-[var(--fg-brand-strong)]',
        className,
      )}
      {...props}
    />
  )
}

export function LedgerMonthLabel({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      className={cn(
        'text-[17px] font-extrabold tracking-[-0.01em] text-[var(--fg-primary)] px-1 tabular-nums',
        className,
      )}
      {...props}
    />
  )
}

// ─── 헤드(총액/타이틀 + 우측 토글) ──────────────────────────

export function LedgerHead({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('flex items-start gap-3 pt-2', className)} {...props} />
}

export function LedgerTotal({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'text-[28px] font-extrabold tracking-[-0.02em] text-[var(--fg-primary)] leading-[1.15]',
        className,
      )}
      {...props}
    />
  )
}

export function LedgerSub({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'text-[length:var(--text-label-sm)] text-[var(--fg-secondary)] mt-[7px]',
        className,
      )}
      {...props}
    />
  )
}

/** 헤드 우측 토글 버튼 (소비 요약 / 밤하늘). */
export function LedgerSumBtn({
  className,
  active = false,
  type = 'button',
  ...props
}: React.ComponentProps<'button'> & { active?: boolean }) {
  return (
    <button
      type={type}
      className={cn(
        'ml-auto shrink-0 border border-[var(--border-default)] bg-transparent',
        'text-[var(--fg-primary)] text-[length:var(--text-label-sm)] font-semibold',
        'px-3.5 py-[9px] rounded-xl cursor-pointer',
        'transition-colors duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-out)]',
        'active:bg-[var(--bg-brand-subtle)] active:border-[var(--border-brand)] active:text-[var(--fg-brand-strong)]',
        active &&
          'bg-[var(--bg-brand-subtle)] border-[var(--border-brand)] text-[var(--fg-brand-strong)]',
        className,
      )}
      {...props}
    />
  )
}

// ─── 접힘 영역 내부 카드(요약 rows / 히어로 등) ─────────────

/** 헤드 아래 드롭 카드 — raised + 진입 애니메이션 (요약 rows 컨테이너). */
export function LedgerSummary({ className, ...props }: React.ComponentProps<typeof Card>) {
  return (
    <Card
      variant="raised"
      className={cn(
        'mt-[14px] px-4 py-1 animate-[txmDrop_0.18s_var(--motion-ease-out)]',
        className,
      )}
      {...props}
    />
  )
}

export function LedgerSummaryRow({
  className,
  total = false,
  ...props
}: React.ComponentProps<'div'> & { total?: boolean }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between py-3 text-[length:var(--text-body-sm)] text-[var(--fg-secondary)]',
        'border-t border-[var(--border-subtle)] first:border-t-0',
        '[&_.num]:text-[length:var(--text-body-md)] [&_.num]:font-bold',
        total && 'text-[var(--fg-primary)] font-semibold [&_.num]:text-[var(--fg-primary)]',
        className,
      )}
      {...props}
    />
  )
}

/** 헤드 아래 드롭 콘텐츠(밤하늘 히어로 등) — 카드 없이 진입 애니메이션만. */
export function LedgerDrop({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('mt-[14px] animate-[txmDrop_0.18s_var(--motion-ease-out)]', className)}
      {...props}
    />
  )
}

// ─── 캘린더 ─────────────────────────────────────────────────

export const LedgerCalendar = React.forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(
  ({ className, ...props }, ref) => (
    // -mx-2: 셀 콘텐츠가 중앙정렬이라 그리드를 페이지 라인보다 8px 바깥으로 —
    // 첫/끝 셀(일·토)이 다른 요소와 같은 라인에서 시작해 보이게 (design txm-cal 정합).
    <div ref={ref} className={cn('relative pt-3 -mx-2', className)} {...props} />
  ),
)
LedgerCalendar.displayName = 'LedgerCalendar'

/** 요일 헤더 — colorFor(i)로 일/토 색 지정 (도메인별 상이). */
export function LedgerDow({
  labels,
  colorFor,
  className,
}: {
  labels: string[]
  colorFor?: (i: number) => string | undefined
  className?: string
}) {
  return (
    <div className={cn('grid grid-cols-7', className)}>
      {labels.map((d, i) => (
        <span
          key={i}
          className="text-center text-[length:var(--text-caption)] font-semibold text-[var(--fg-tertiary)] pt-1.5 pb-2"
          style={{ color: colorFor?.(i) }}
        >
          {d}
        </span>
      ))}
    </div>
  )
}

export function LedgerWeek({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('grid grid-cols-7', className)} {...props} />
}

const cellClass =
  'border-0 bg-transparent px-0 pt-1 pb-2 flex flex-col items-center gap-[3px] rounded-xl min-h-[56px] [-webkit-tap-highlight-color:transparent]'

/** 날짜 셀 — empty면 자리 채움 div, 아니면 클릭 가능한 button. */
export function LedgerCell({
  className,
  empty = false,
  selected = false,
  ...props
}: React.ComponentProps<'button'> & { empty?: boolean; selected?: boolean }) {
  if (empty) return <div className={cn(cellClass, className)} />
  return (
    <button
      type="button"
      data-sel={selected}
      className={cn(cellClass, 'group/cell cursor-pointer active:bg-[var(--bg-muted)]', className)}
      {...props}
    />
  )
}

export function LedgerCellNum({
  className,
  selected = false,
  ...props
}: React.ComponentProps<'span'> & { selected?: boolean }) {
  return (
    <span
      className={cn(
        'w-[33px] h-[33px] rounded-full inline-flex items-center justify-center',
        'text-[length:var(--text-body-md)] font-semibold tabular-nums',
        selected && 'bg-[var(--bg-brand)] text-[var(--fg-on-brand)] font-bold',
        className,
      )}
      {...props}
    />
  )
}

export function LedgerCellAmt({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      className={cn(
        'text-[10px] font-semibold text-[var(--fg-tertiary)] tabular-nums tracking-[-0.02em]',
        'min-h-3 max-w-full whitespace-nowrap overflow-hidden text-ellipsis',
        'group-data-[sel=true]/cell:font-bold',
        className,
      )}
      {...props}
    />
  )
}

/** 주 1줄 ↔ 월 전체 토글. */
export function LedgerExpand({
  expanded = false,
  className,
  type = 'button',
  ...props
}: React.ComponentProps<'button'> & { expanded?: boolean }) {
  return (
    <button
      type={type}
      className={cn(
        'w-full border-0 bg-transparent text-[var(--fg-tertiary)] pt-[2px] pb-2.5',
        'flex items-center justify-center cursor-pointer',
        className,
      )}
      {...props}
    >
      {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
    </button>
  )
}

/** 차트형 셀 툴팁 — 통계 PorestChartTooltip 시각 미러. */
export function LedgerCellTip({
  left,
  top,
  title,
  rows,
}: {
  left: number
  top: number
  title: React.ReactNode
  rows: { label: React.ReactNode; color: string; value: React.ReactNode }[]
}) {
  return (
    <div
      className={cn(
        'absolute z-20 pointer-events-none min-w-[150px]',
        'bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-tile)]',
        'shadow-[var(--shadow-md)] px-3 py-2.5 text-[length:var(--text-caption)]',
      )}
      style={{ left, top, transform: 'translate(-50%, calc(-100% - 8px))' }}
    >
      <div className="text-[length:var(--text-badge)] text-[var(--fg-tertiary)] font-semibold mb-1.5">
        {title}
      </div>
      {rows.map((row, i) => (
        <div key={i} className="flex items-center gap-2 mt-0.5">
          <span
            className="w-2.5 h-2.5 rounded-[var(--radius-xs)] shrink-0"
            style={{ background: row.color }}
          />
          <span className="text-[length:var(--text-caption)] text-[var(--fg-secondary)]">
            {row.label}
          </span>
          <span className="num ml-auto font-bold" style={{ color: row.color }}>
            {row.value}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── 일별 리스트 ────────────────────────────────────────────

export function LedgerList({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={className} {...props} />
}

/** 날짜 그룹 — day를 주면 스크롤 스파이·scrollToDay 앵커([data-ledger-day]). */
export function LedgerDayGroup({
  day,
  className,
  ...props
}: React.ComponentProps<'div'> & { day?: string }) {
  return <div data-ledger-day={day} className={cn('pt-6', className)} {...props} />
}

export function LedgerDayHead({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'flex items-baseline pb-1.5 text-[length:var(--text-label-sm)] text-[var(--fg-secondary)]',
        className,
      )}
      {...props}
    />
  )
}

export function LedgerDayDate({ className, ...props }: React.ComponentProps<'span'>) {
  return <span className={cn('font-semibold tabular-nums', className)} {...props} />
}

export function LedgerDayRel({ className, ...props }: React.ComponentProps<'span'>) {
  return <span className={cn('text-[var(--fg-tertiary)]', className)} {...props} />
}

export function LedgerDaySum({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      className={cn('ml-auto text-[length:var(--text-caption)] tabular-nums', className)}
      {...props}
    />
  )
}

// ─── 리스트 행 골격 (tx-row spec 공용화) ────────────────────
// leading(카테고리 칩/체크) · Main(Title+Sub) · trailing(금액/뱃지)은 화면이 소유.

export function LedgerRow({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 cursor-pointer rounded-lg pl-1.5 pr-1 -ml-1 -mr-1 py-3',
        'transition-[background] duration-[var(--motion-duration-fast)]',
        'hover:bg-[var(--bg-muted)] active:bg-[var(--bg-muted)]',
        '[-webkit-tap-highlight-color:transparent]',
        className,
      )}
      {...props}
    />
  )
}

export function LedgerRowMain({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('flex-1 min-w-0', className)} {...props} />
}

export function LedgerRowTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'text-[14px] font-semibold text-[var(--fg-primary)] tracking-[-0.005em]',
        'whitespace-nowrap overflow-hidden text-ellipsis',
        className,
      )}
      {...props}
    />
  )
}

export function LedgerRowSub({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'text-[12px] text-[var(--fg-tertiary)] mt-[2px] flex items-center gap-1',
        className,
      )}
      {...props}
    />
  )
}

/** sub 안 구분점(·). */
export function LedgerRowSep({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      className={cn('w-[2px] h-[2px] rounded-full bg-[var(--border-strong)]', className)}
      {...props}
    />
  )
}

/** 우측 금액 — income이면 fg-income, 아니면 fg-expense. */
export function LedgerRowAmt({
  className,
  income = false,
  ...props
}: React.ComponentProps<'div'> & { income?: boolean }) {
  return (
    <div
      className={cn(
        'text-[14px] font-bold tabular-nums tracking-[-0.01em] text-right shrink-0',
        income ? 'text-[var(--fg-income)]' : 'text-[var(--fg-expense)]',
        className,
      )}
      {...props}
    />
  )
}

/** 리스트 하단 이전 달 로드 버튼. */
export function LedgerPrevBtn({
  className,
  type = 'button',
  ...props
}: React.ComponentProps<'button'>) {
  return (
    <button
      type={type}
      className={cn(
        'block mt-7 w-full h-[52px] rounded-[14px] border-0 bg-[var(--bg-sunken)]',
        'text-[var(--fg-primary)] text-[length:var(--text-body-md)] font-semibold cursor-pointer',
        'active:bg-[var(--bg-muted)]',
        className,
      )}
      {...props}
    />
  )
}
