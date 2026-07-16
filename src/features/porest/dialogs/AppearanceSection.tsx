import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff, Monitor, Moon, Sun } from 'lucide-react'
import { Card } from '@/shared/ui/card'
import { RadioList, RadioListItem } from '@/shared/ui/radio-list'
import { Switch } from '@/shared/ui/switch'
import { TileGroup, TileItem } from '@/shared/ui/tile'
import { useTheme } from '@/shared/ui/theme-provider'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import {
  disablePdHideAmounts,
  enablePdHideAmounts,
  useHideAmounts,
} from '@/shared/lib/porest/hide-amounts'
import { HideAmountsUnlockDialog } from '@/features/porest/dialogs/HideAmountsUnlockDialog'

type CurrencyKey = 'KRW' | 'USD' | 'EUR' | 'JPY'

const CURRENCY_STORAGE_KEY = 'pd-currency'

const THEME_OPTIONS: {
  k: 'light' | 'dark' | 'system'
  labelKey: string
  descKey: string
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>
}[] = [
  { k: 'light', labelKey: 'theme.light', descKey: 'theme.lightDesc', Icon: Sun },
  { k: 'dark', labelKey: 'theme.dark', descKey: 'theme.darkDesc', Icon: Moon },
  { k: 'system', labelKey: 'theme.system', descKey: 'theme.systemDesc', Icon: Monitor },
]

const CURRENCY_OPTIONS: { k: CurrencyKey; labelKey: string; symbol: string }[] = [
  { k: 'KRW', labelKey: 'currency.KRW', symbol: '₩' },
  { k: 'USD', labelKey: 'currency.USD', symbol: '$' },
  { k: 'EUR', labelKey: 'currency.EUR', symbol: '€' },
  { k: 'JPY', labelKey: 'currency.JPY', symbol: '¥' },
]

function readCurrency(): CurrencyKey {
  try {
    const v = localStorage.getItem(CURRENCY_STORAGE_KEY)
    if (v === 'KRW' || v === 'USD' || v === 'EUR' || v === 'JPY') return v
  } catch {
    /* ignore */
  }
  return 'KRW'
}

// 모바일 카드 다이어트 — 설정 행 셸: 모바일은 플랫 행, 데스크톱은 Card (.m-subpage 정합).
function RowShell({ mobile, children }: { mobile: boolean; children: React.ReactNode }) {
  const inner: React.CSSProperties = { display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12 }
  return mobile
    ? <div style={{ ...inner, padding: '14px 4px' }}>{children}</div>
    : <Card style={{ ...inner, padding: '14px 16px' }}>{children}</Card>
}

export function AppearanceSection({ mobile }: { mobile: boolean }) {
  const { t, i18n } = useTranslation('settings')
  const { theme, setTheme } = useTheme()
  const [currency, setCurrencyState] = useState<CurrencyKey>(readCurrency)
  const hidden = useHideAmounts()
  const [unlockOpen, setUnlockOpen] = useState(false)

  // 켜기는 즉시, 끄기는 비밀번호 인증 (헤더 눈 버튼 제거 후 설정 진입점)
  const handleHideChange = (checked: boolean) => {
    if (checked) {
      enablePdHideAmounts()
    } else {
      setUnlockOpen(true)
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2xl)' }}>
      <section>
        <SectionLabel>{t('theme.label')}</SectionLabel>
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
                label={t(opt.labelKey)}
                description={t(opt.descKey)}
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
        <SectionLabel>{t('privacy.label')}</SectionLabel>
        {/* 금액 가리기 — 클로드 디자인 settings 행 (아이콘 박스 + 라벨/설명 + 스위치).
            모바일 카드 다이어트 — 셸 카드 벗기고 플랫 행 (.m-subpage). */}
        <RowShell mobile={mobile}>
          <span
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-md)',
              flexShrink: 0,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--bg-sunken)',
              color: 'var(--fg-secondary)',
            }}
          >
            {hidden ? <EyeOff size={17} /> : <Eye size={17} />}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 'var(--text-label-sm)', fontWeight: 600, color: 'var(--fg-primary)' }}>
              {t('hideAmounts.label')}
            </div>
            <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', marginTop: 2 }}>
              {t('hideAmounts.desc')}
            </div>
          </div>
          <Switch checked={hidden} onCheckedChange={handleHideChange} aria-label={t('hideAmounts.label')} />
        </RowShell>
        <HideAmountsUnlockDialog
          open={unlockOpen}
          onOpenChange={setUnlockOpen}
          onVerified={disablePdHideAmounts}
        />
      </section>

      <section>
        <SectionLabel>{t('language.label')}</SectionLabel>
        <Tabs
          value={i18n.language?.startsWith('en') ? 'en' : 'ko'}
          onValueChange={(v) => v && i18n.changeLanguage(v)}
        >
          <TabsList variant="pill" size="sm" className="w-full">
            <TabsTrigger value="ko" className="flex-1">
              {t('language.ko')}
            </TabsTrigger>
            <TabsTrigger value="en" className="flex-1">
              {t('language.en')}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </section>

      <section>
        <SectionLabel>{t('currency.label')}</SectionLabel>
        <RadioList value={currency} onValueChange={v => setCurrency(v as CurrencyKey)}>
          {CURRENCY_OPTIONS.map(c => (
            <RadioListItem
              key={c.k}
              value={c.k}
              pill={<span className="num">{c.symbol}</span>}
              label={t(c.labelKey)}
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
