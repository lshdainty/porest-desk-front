import { useEffect, useRef, useState } from 'react'
import { Calendar, ChevronDown, ChevronLeft, ChevronRight, TrendingDown, TrendingUp } from 'lucide-react'
import { CATEGORIES, type CategoryKey, type Tx, type Account } from '@/shared/lib/porest/data'
import { KRW } from '@/shared/lib/porest/format'
import { HideUnit, MaskAmount } from '@/shared/lib/porest/hide-amounts'
import * as LucideIcons from 'lucide-react'
import { TX_ROW } from './tx-row-tokens'

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

// CatIcon: data-cat 매트릭스를 컴포넌트 안 룩업으로 이전.
// 기존 .cat-ico[data-cat="..."] CSS 색상 spec 그대로 보존.
const CAT_ICO_PALETTE: Record<string, { bg: string; color: string }> = {
  food:      { bg: 'oklch(0.96 0.03 70)',   color: 'oklch(0.48 0.12 55)' },
  transport: { bg: 'oklch(0.96 0.02 230)',  color: 'oklch(0.48 0.1 230)' },
  shopping:  { bg: 'oklch(0.96 0.035 340)', color: 'oklch(0.48 0.12 340)' },
  cafe:      { bg: 'oklch(0.96 0.03 60)',   color: 'oklch(0.44 0.08 50)' },
  income:    { bg: 'var(--mossy-100)',      color: 'var(--mossy-800)' },
  living:    { bg: 'oklch(0.96 0.025 135)', color: 'oklch(0.48 0.1 140)' },
  medical:   { bg: 'oklch(0.96 0.03 25)',   color: 'oklch(0.52 0.13 25)' },
  leisure:   { bg: 'oklch(0.96 0.035 290)', color: 'oklch(0.48 0.12 290)' },
  bill:      { bg: 'var(--mist-200)',       color: 'var(--mist-700)' },
  edu:       { bg: 'oklch(0.96 0.03 210)',  color: 'oklch(0.5 0.1 215)' },
  saving:    { bg: 'var(--bark-100)',       color: 'var(--bark-700)' },
}

const CAT_ICO_DIMS = {
  sm: { w: 32, r: 10, icon: 16 },
  md: { w: 40, r: 12, icon: 18 },
  lg: { w: 48, r: 14, icon: 22 },
} as const

export function CatIcon({ cat, size = 'md' }: { cat: CategoryKey; size?: 'sm' | 'md' | 'lg' }) {
  const def = CATEGORIES[cat]
  if (!def) return null
  const dim = CAT_ICO_DIMS[size]
  const palette = CAT_ICO_PALETTE[cat] ?? { bg: 'var(--bg-surface)', color: 'var(--fg-secondary)' }
  return (
    <span
      data-cat={cat}
      style={{
        width: dim.w,
        height: dim.w,
        borderRadius: dim.r,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        background: palette.bg,
        color: palette.color,
      }}
    >
      <Icon name={def.icon} size={dim.icon} strokeWidth={1.9} />
    </span>
  )
}

// tx-row CSS spec: tx-row-tokens.ts (TX_ROW) 토큰 재사용.
// (별도 파일로 분리한 것은 react-refresh/only-export-components 를 만족하기 위함.)
export function TxRow({ tx, onClick }: { tx: Tx; onClick?: (tx: Tx) => void }) {
  const c = CATEGORIES[tx.cat]
  const isIncome = tx.amt > 0
  return (
    <div className={TX_ROW.className} onClick={() => onClick?.(tx)}>
      <CatIcon cat={tx.cat} />
      <div style={TX_ROW.metaStyle}>
        <div style={TX_ROW.titleStyle}>{tx.title}</div>
        <div style={TX_ROW.subStyle}>
          <span>{c?.label}</span>
          <span style={TX_ROW.sepStyle} />
          <span>{tx.account}</span>
          {tx.time && (
            <>
              <span style={TX_ROW.sepStyle} />
              <span>{tx.time}</span>
            </>
          )}
        </div>
      </div>
      <div>
        <div style={TX_ROW.amtStyle(isIncome)}>
          <MaskAmount>{isIncome ? '+' : '-'}{KRW(tx.amt, { abs: true })}</MaskAmount>
          <HideUnit>원</HideUnit>
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
      style={{
        background: acc.color,
        width: size,
        height: size,
        fontSize: size * 0.35,
        borderRadius: 10,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 800,
        letterSpacing: '-0.02em',
        color: '#fff',
        flexShrink: 0,
      }}
    >
      {letter}
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
                    border: isSel ? '1px solid var(--border-brand)' : '1px solid transparent',
                    background: isSel ? 'var(--bg-brand-subtle)' : 'transparent',
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
