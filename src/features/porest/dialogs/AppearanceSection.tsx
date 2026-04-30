import { useEffect, useState } from 'react'
import { Check, Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from '@/shared/ui/theme-provider'

type DensityKey = 'compact' | 'comfortable' | 'spacious'
type CurrencyKey = 'KRW' | 'USD' | 'EUR' | 'JPY'

const DENSITY_STORAGE_KEY = 'pd-density'
const CURRENCY_STORAGE_KEY = 'pd-currency'

const THEME_OPTIONS: {
  k: 'light' | 'dark' | 'system'
  label: string
  desc: string
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>
}[] = [
  { k: 'light', label: '라이트', desc: '밝은 배경', Icon: Sun },
  { k: 'dark', label: '다크', desc: '어두운 배경', Icon: Moon },
  { k: 'system', label: '시스템', desc: 'OS 설정 따라가기', Icon: Monitor },
]

const DENSITY_OPTIONS: { k: DensityKey; label: string }[] = [
  { k: 'compact', label: '촘촘' },
  { k: 'comfortable', label: '보통' },
  { k: 'spacious', label: '여유' },
]

const CURRENCY_OPTIONS: { k: CurrencyKey; label: string; symbol: string }[] = [
  { k: 'KRW', label: '대한민국 원', symbol: '₩' },
  { k: 'USD', label: '미국 달러', symbol: '$' },
  { k: 'EUR', label: '유로', symbol: '€' },
  { k: 'JPY', label: '일본 엔', symbol: '¥' },
]

function readDensity(): DensityKey {
  try {
    const v = localStorage.getItem(DENSITY_STORAGE_KEY)
    if (v === 'compact' || v === 'comfortable' || v === 'spacious') return v
  } catch {
    /* ignore */
  }
  return 'comfortable'
}

function readCurrency(): CurrencyKey {
  try {
    const v = localStorage.getItem(CURRENCY_STORAGE_KEY)
    if (v === 'KRW' || v === 'USD' || v === 'EUR' || v === 'JPY') return v
  } catch {
    /* ignore */
  }
  return 'KRW'
}

export function AppearanceSection({ mobile }: { mobile: boolean }) {
  const { theme, setTheme } = useTheme()
  const [density, setDensityState] = useState<DensityKey>(readDensity)
  const [currency, setCurrencyState] = useState<CurrencyKey>(readCurrency)

  useEffect(() => {
    document.documentElement.setAttribute('data-density', density)
  }, [density])

  const setDensity = (d: DensityKey) => {
    setDensityState(d)
    try {
      localStorage.setItem(DENSITY_STORAGE_KEY, d)
    } catch {
      /* ignore */
    }
  }

  const setCurrency = (c: CurrencyKey) => {
    setCurrencyState(c)
    try {
      localStorage.setItem(CURRENCY_STORAGE_KEY, c)
    } catch {
      /* ignore */
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <section>
        <SectionLabel>테마</SectionLabel>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: mobile ? '1fr' : 'repeat(3, 1fr)',
            gap: 10,
          }}
        >
          {THEME_OPTIONS.map(opt => {
            const active = theme === opt.k
            const swatchBg =
              opt.k === 'dark'
                ? 'oklch(0.205 0.022 110)'
                : opt.k === 'light'
                ? '#ffffff'
                : 'linear-gradient(135deg, #fff 50%, oklch(0.205 0.022 110) 50%)'
            const swatchColor = opt.k === 'dark' ? '#fff' : 'var(--fg-primary)'
            return (
              <button
                key={opt.k}
                type="button"
                onClick={() => setTheme(opt.k)}
                style={{
                  padding: '16px 14px',
                  borderRadius: 12,
                  border: active
                    ? '1.5px solid var(--mossy-500, var(--fg-brand-strong))'
                    : '1px solid var(--border-subtle)',
                  background: active
                    ? 'color-mix(in oklch, var(--fg-brand-strong) 8%, transparent)'
                    : 'var(--bg-surface)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  transition: 'all 0.15s',
                  fontFamily: 'inherit',
                }}
              >
                <span
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: swatchBg,
                    border: '1px solid var(--border-subtle)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: swatchColor,
                    flexShrink: 0,
                  }}
                >
                  <opt.Icon size={18} strokeWidth={1.9} />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span
                    style={{
                      display: 'block',
                      fontSize: 13.5,
                      fontWeight: 600,
                      color: 'var(--fg-primary)',
                    }}
                  >
                    {opt.label}
                  </span>
                  <span
                    style={{
                      display: 'block',
                      fontSize: 11.5,
                      color: 'var(--fg-tertiary)',
                      marginTop: 2,
                    }}
                  >
                    {opt.desc}
                  </span>
                </span>
                {active && (
                  <Check
                    size={16}
                    strokeWidth={2.2}
                    style={{ color: 'var(--mossy-600, var(--fg-brand-strong))' }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </section>

      <section>
        <SectionLabel>밀도</SectionLabel>
        <div
          style={{
            display: 'flex',
            gap: 8,
            padding: 4,
            background: 'var(--bg-canvas)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 10,
          }}
        >
          {DENSITY_OPTIONS.map(opt => {
            const active = density === opt.k
            return (
              <button
                key={opt.k}
                type="button"
                onClick={() => setDensity(opt.k)}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: active ? 'var(--bg-surface)' : 'transparent',
                  border: 'none',
                  boxShadow: active ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                  color: active ? 'var(--fg-primary)' : 'var(--fg-secondary)',
                  fontSize: 13,
                  fontWeight: active ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  fontFamily: 'inherit',
                }}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </section>

      <section>
        <SectionLabel>기본 통화</SectionLabel>
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          {CURRENCY_OPTIONS.map((c, i, arr) => {
            const active = currency === c.k
            return (
              <button
                key={c.k}
                type="button"
                onClick={() => setCurrency(c.k)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom:
                    i < arr.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                <span
                  className="num"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: 'var(--bg-canvas)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 15,
                    fontWeight: 700,
                    color: 'var(--fg-primary)',
                    flexShrink: 0,
                  }}
                >
                  {c.symbol}
                </span>
                <span style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                  <span
                    style={{
                      display: 'block',
                      fontSize: 13.5,
                      fontWeight: 600,
                      color: 'var(--fg-primary)',
                    }}
                  >
                    {c.label}
                  </span>
                  <span
                    className="num"
                    style={{
                      display: 'block',
                      fontSize: 11.5,
                      color: 'var(--fg-tertiary)',
                      marginTop: 1,
                    }}
                  >
                    {c.k}
                  </span>
                </span>
                {active && (
                  <Check
                    size={16}
                    strokeWidth={2.2}
                    style={{ color: 'var(--mossy-600, var(--fg-brand-strong))' }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 12.5,
        fontWeight: 600,
        color: 'var(--fg-tertiary)',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        marginBottom: 10,
      }}
    >
      {children}
    </div>
  )
}
