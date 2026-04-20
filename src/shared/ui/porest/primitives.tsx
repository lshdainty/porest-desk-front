import { useEffect, useRef, useState } from 'react'
import { Calendar, ChevronDown, ChevronLeft, ChevronRight, TrendingDown, TrendingUp } from 'lucide-react'
import { CATEGORIES, type CategoryKey, type Tx, type Account } from '@/shared/lib/porest/data'
import { KRW } from '@/shared/lib/porest/format'
import { useHideAmounts } from '@/shared/lib/porest/hide-amounts'
import * as LucideIcons from 'lucide-react'

type LucideIconName = keyof typeof LucideIcons

const iconNameToPascal = (name: string): string =>
  name.split('-').map(s => (s[0] ?? '').toUpperCase() + s.slice(1)).join('')

export function Icon({
  name,
  size = 16,
  strokeWidth = 2,
  className = '',
  style = {},
}: {
  name: string
  size?: number
  strokeWidth?: number
  className?: string
  style?: React.CSSProperties
}) {
  const pascal = iconNameToPascal(name) as LucideIconName
  const Comp = LucideIcons[pascal] as React.ComponentType<{
    size?: number
    strokeWidth?: number
    className?: string
    style?: React.CSSProperties
  }> | undefined
  if (!Comp) {
    return <span className={className} style={{ width: size, height: size, display: 'inline-block', ...style }} />
  }
  return <Comp size={size} strokeWidth={strokeWidth} className={className} style={{ flexShrink: 0, ...style }} />
}

export function CatIcon({ cat, size = 'md' }: { cat: CategoryKey; size?: 'sm' | 'md' | 'lg' }) {
  const def = CATEGORIES[cat]
  if (!def) return null
  const sizeCls = size === 'sm' ? 'cat-ico--sm' : size === 'lg' ? 'cat-ico--lg' : ''
  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 22 : 18
  return (
    <span className={`cat-ico ${sizeCls}`} data-cat={cat}>
      <Icon name={def.icon} size={iconSize} strokeWidth={1.9} />
    </span>
  )
}

export function TxRow({ tx, onClick }: { tx: Tx; onClick?: (tx: Tx) => void }) {
  const c = CATEGORIES[tx.cat]
  const isIncome = tx.amt > 0
  const hidden = useHideAmounts()
  return (
    <div className="tx-row" onClick={() => onClick?.(tx)}>
      <CatIcon cat={tx.cat} />
      <div className="tx-row__meta">
        <div className="tx-row__title">{tx.title}</div>
        <div className="tx-row__sub">
          <span>{c?.label}</span>
          <span className="sep" />
          <span>{tx.account}</span>
          {tx.time && (
            <>
              <span className="sep" />
              <span>{tx.time}</span>
            </>
          )}
        </div>
      </div>
      <div>
        <div className={`tx-row__amt ${isIncome ? 'income' : ''}`}>
          {hidden ? '••••••' : <>{isIncome ? '+' : '-'}{KRW(tx.amt, { abs: true })}원</>}
        </div>
      </div>
    </div>
  )
}

export function SegPicker<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="seg">
      {options.map(o => (
        <button key={o.value} className={value === o.value ? 'active' : ''} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Delta({ pct, amt, small }: { pct: number; amt?: number; small?: boolean }) {
  const up = pct > 0
  const color = up ? 'var(--mossy-700)' : 'var(--berry-500)'
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 2,
        color,
        fontWeight: 600,
        fontVariantNumeric: 'tabular-nums',
        fontSize: small ? 11.5 : 12.5,
        letterSpacing: '-0.005em',
      }}
    >
      {up ? <TrendingUp size={small ? 12 : 14} strokeWidth={2.2} /> : <TrendingDown size={small ? 12 : 14} strokeWidth={2.2} />}
      {up ? '+' : ''}
      {pct.toFixed(1)}%
      {amt != null && (
        <span style={{ color: 'var(--fg-tertiary)', marginLeft: 4, fontWeight: 500 }}>
          ({up ? '+' : '−'}
          {KRW(amt, { abs: true })}원)
        </span>
      )}
    </span>
  )
}

export function BankLogo({ acc, size = 40 }: { acc: Account; size?: number }) {
  const letter = acc.bank[0]
  return (
    <span
      className="acc-card__logo"
      style={{ background: acc.color, width: size, height: size, fontSize: size * 0.35 }}
    >
      {letter}
    </span>
  )
}

export function Amt({
  value,
  children,
  mask = '••••',
  className = '',
  style = {},
}: {
  value?: number
  children?: React.ReactNode
  mask?: string
  className?: string
  style?: React.CSSProperties
}) {
  const hidden = useHideAmounts()
  if (hidden)
    return (
      <span className={className} style={style}>
        {mask}
      </span>
    )
  if (value != null)
    return (
      <span className={className} style={style}>
        {KRW(value)}
      </span>
    )
  return (
    <span className={className} style={style}>
      {children}
    </span>
  )
}

export function MonthPicker({
  value,
  onChange,
  align = 'right',
}: {
  value: string
  onChange: (v: string) => void
  align?: 'right' | 'left'
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const parts = value.split('-').map(Number)
  const y = parts[0] ?? new Date().getFullYear()
  const m = parts[1] ?? 1
  const [viewY, setViewY] = useState<number>(y)

  const now = new Date()
  const curY = now.getFullYear()
  const curM = now.getMonth() + 1

  const label = `${y}년 ${m}월`

  const pick = (nm: number) => {
    onChange(`${viewY}-${String(nm).padStart(2, '0')}`)
    setOpen(false)
  }

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(v => !v)}
        className="month-picker__trigger"
        style={{
          background: 'transparent',
          border: '1px solid var(--border-subtle)',
          borderRadius: 10,
          padding: '6px 12px',
          fontSize: 12.5,
          fontWeight: 600,
          color: 'var(--fg-secondary)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        <Calendar size={13} /> {label} <ChevronDown size={12} />
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            [align]: 0,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 14,
            boxShadow: 'var(--shadow-lg)',
            padding: 14,
            zIndex: 100,
            width: 260,
          } as React.CSSProperties}
        >
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
            <button
              onClick={() => setViewY(viewY - 1)}
              style={{
                background: 'transparent',
                border: 0,
                color: 'var(--fg-secondary)',
                padding: 4,
                cursor: 'pointer',
                display: 'inline-flex',
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <div style={{ flex: 1, textAlign: 'center', fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em' }}>
              {viewY}년
            </div>
            <button
              onClick={() => setViewY(viewY + 1)}
              disabled={viewY >= curY}
              style={{
                background: 'transparent',
                border: 0,
                color: viewY >= curY ? 'var(--fg-tertiary)' : 'var(--fg-secondary)',
                padding: 4,
                cursor: viewY >= curY ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                opacity: viewY >= curY ? 0.4 : 1,
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map(mm => {
              const isSel = viewY === y && mm === m
              const isFuture = viewY > curY || (viewY === curY && mm > curM)
              return (
                <button
                  key={mm}
                  disabled={isFuture}
                  onClick={() => pick(mm)}
                  style={{
                    padding: '10px 0',
                    borderRadius: 8,
                    border: isSel ? '1px solid var(--mossy-500)' : '1px solid transparent',
                    background: isSel ? 'var(--mossy-100)' : 'transparent',
                    color: isFuture ? 'var(--fg-tertiary)' : isSel ? 'var(--fg-brand-strong)' : 'var(--fg-primary)',
                    fontSize: 13,
                    fontWeight: isSel ? 700 : 500,
                    cursor: isFuture ? 'not-allowed' : 'pointer',
                    opacity: isFuture ? 0.4 : 1,
                    fontFamily: 'inherit',
                  }}
                >
                  {mm}월
                </button>
              )
            })}
          </div>
          <div
            style={{
              display: 'flex',
              gap: 6,
              marginTop: 10,
              paddingTop: 10,
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <button
              onClick={() => {
                onChange(`${curY}-${String(curM).padStart(2, '0')}`)
                setOpen(false)
              }}
              style={{
                flex: 1,
                padding: 8,
                borderRadius: 8,
                border: '1px solid var(--border-subtle)',
                background: 'transparent',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                color: 'var(--fg-primary)',
              }}
            >
              이번 달
            </button>
            <button
              onClick={() => {
                let ly = curY
                let lm = curM - 1
                if (lm < 1) {
                  lm = 12
                  ly -= 1
                }
                onChange(`${ly}-${String(lm).padStart(2, '0')}`)
                setOpen(false)
              }}
              style={{
                flex: 1,
                padding: 8,
                borderRadius: 8,
                border: '1px solid var(--border-subtle)',
                background: 'transparent',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                color: 'var(--fg-primary)',
              }}
            >
              지난 달
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
