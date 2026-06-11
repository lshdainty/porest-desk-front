import { useEffect, useState } from 'react'
import { Monitor, Moon, Sun } from 'lucide-react'
import { RadioList, RadioListItem } from '@/shared/ui/radio-list'
import { TileGroup, TileItem } from '@/shared/ui/tile'
import { useTheme } from '@/shared/ui/theme-provider'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'

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
        <TileGroup columns={mobile ? 1 : 3} value={theme} onValueChange={v => setTheme(v as typeof theme)}>
          {THEME_OPTIONS.map(opt => {
            const swatchBg =
              opt.k === 'dark'
                ? 'oklch(0.205 0.022 110)'
                : opt.k === 'light'
                ? '#ffffff'
                : 'linear-gradient(135deg, #fff 50%, oklch(0.205 0.022 110) 50%)'
            const swatchColor = opt.k === 'dark' ? '#fff' : 'var(--fg-primary)'
            return (
              <TileItem
                key={opt.k}
                value={opt.k}
                label={opt.label}
                description={opt.desc}
                swatch={
                  <span
                    style={{
                      width: '100%',
                      height: '100%',
                      background: swatchBg,
                      color: swatchColor,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <opt.Icon size={18} strokeWidth={1.9} />
                  </span>
                }
              />
            )
          })}
        </TileGroup>
      </section>

      <section>
        <SectionLabel>밀도</SectionLabel>
        <Tabs
          value={density}
          onValueChange={(v) => v && setDensity(v as DensityKey)}
        >
          <TabsList variant="pill" size="sm" className="w-full">
            {DENSITY_OPTIONS.map((opt) => (
              <TabsTrigger key={opt.k} value={opt.k} className="flex-1">
                {opt.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </section>

      <section>
        <SectionLabel>기본 통화</SectionLabel>
        <RadioList value={currency} onValueChange={v => setCurrency(v as CurrencyKey)}>
          {CURRENCY_OPTIONS.map(c => (
            <RadioListItem
              key={c.k}
              value={c.k}
              pill={<span className="num">{c.symbol}</span>}
              label={c.label}
              subLabel={<span className="num">{c.k}</span>}
            />
          ))}
        </RadioList>
      </section>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 'var(--text-label-sm)',
        fontWeight: '600',
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
