import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, Download, PieChart, Receipt, Target, Wallet } from 'lucide-react'
import { TX } from '@/shared/lib/porest/data'
import { ModalShell } from '@/shared/ui/porest/dialogs'
import { ModalFooter } from '@/shared/ui/porest/modal-footer'
import { Input } from '@/shared/ui/input'
import { Checkbox } from '@/shared/ui/checkbox'
import { Field, FieldLabel } from '@/shared/ui/field'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'

type FileFormat = 'csv' | 'xlsx' | 'pdf'
type Period = 'week' | 'month' | '3m' | 'year' | 'custom'
type IncludeKey = 'tx' | 'cat' | 'budget' | 'asset'

const FORMATS: { v: FileFormat; l: string; dKey: string }[] = [
  { v: 'csv', l: 'CSV', dKey: 'dialog.format.csv.d' },
  { v: 'xlsx', l: 'Excel', dKey: 'dialog.format.xlsx.d' },
  { v: 'pdf', l: 'PDF', dKey: 'dialog.format.pdf.d' },
]

const PERIODS: { v: Period; lKey: string }[] = [
  { v: 'week', lKey: 'dialog.period.week' },
  { v: 'month', lKey: 'dialog.period.month' },
  { v: '3m', lKey: 'dialog.period.quarter' },
  { v: 'year', lKey: 'dialog.period.year' },
  { v: 'custom', lKey: 'dialog.period.custom' },
]

const INCLUDES: { v: IncludeKey; lKey: string; dKey: string; Icon: React.ComponentType<{ size?: number }> }[] = [
  { v: 'tx', lKey: 'dialog.include.tx.l', dKey: 'dialog.include.tx.d', Icon: Receipt },
  { v: 'cat', lKey: 'dialog.include.cat.l', dKey: 'dialog.include.cat.d', Icon: PieChart },
  { v: 'budget', lKey: 'dialog.include.budget.l', dKey: 'dialog.include.budget.d', Icon: Target },
  { v: 'asset', lKey: 'dialog.include.asset.l', dKey: 'dialog.include.asset.d', Icon: Wallet },
]

export function ExportDialog({ onClose, mobile }: { onClose: () => void; mobile: boolean }) {
  const { t } = useTranslation('export')
  const [format, setFormat] = useState<FileFormat>('csv')
  const [period, setPeriod] = useState<Period>('month')
  const [includes, setIncludes] = useState<IncludeKey[]>(['tx', 'cat', 'budget'])
  const [customFrom, setCustomFrom] = useState('2026-01-01')
  const [customTo, setCustomTo] = useState('2026-04-20')

  const toggle = (v: IncludeKey) =>
    setIncludes(includes.includes(v) ? includes.filter(x => x !== v) : [...includes, v])

  const Footer = (
    <ModalFooter
      leftSlot={
        <span style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)' }}>
          {t('dialog.noticePre')} <b style={{ color: 'var(--fg-secondary)' }}>{TX.length}</b>{t('dialog.noticePost')}
        </span>
      }
      onCancel={onClose}
      onSave={onClose}
      saveLabel={t('dialog.exportAs', { format: format.toUpperCase() })}
      saveIcon={<Download size={16} />}
    />
  )

  return (
    <ModalShell title={t('dialog.title')} onClose={onClose} size="md" footer={Footer} mobile={mobile}>
      <Field style={{ marginBottom: 18 }}>
        <FieldLabel>{t('fileFormat')}</FieldLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {FORMATS.map(o => {
            const active = format === o.v
            return (
              <button
                key={o.v}
                type="button"
                onClick={() => setFormat(o.v)}
                style={{
                  padding: 14,
                  background: active ? 'var(--bg-brand-subtle)' : 'var(--bg-surface)',
                  border: active ? '1px solid var(--border-brand)' : '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'inherit',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span
                    style={{
                      fontWeight: '700',
                      fontSize: 'var(--text-body-sm)',
                      color: active ? 'var(--fg-brand-strong)' : 'var(--fg-primary)',
                    }}
                  >
                    {o.l}
                  </span>
                  {active && <CheckCircle2 size={14} style={{ color: 'var(--bg-brand)', marginLeft: 'auto' }} />}
                </div>
                <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)' }}>{t(o.dKey)}</div>
              </button>
            )
          })}
        </div>
      </Field>

      <Field style={{ marginBottom: 18 }}>
        <FieldLabel>{t('dialog.period')}</FieldLabel>
        <Tabs
          value={period}
          onValueChange={(v) => v && setPeriod(v as Period)}
        >
          <TabsList variant="pill" size="sm" className="w-full">
            {PERIODS.map(o => (
              <TabsTrigger key={o.v} value={o.v} className="flex-1">
                {t(o.lKey)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        {period === 'custom' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto 1fr',
              gap: 8,
              alignItems: 'center',
              marginTop: 10,
            }}
          >
            <Input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} />
            <span style={{ color: 'var(--fg-tertiary)' }}>~</span>
            <Input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} />
          </div>
        )}
      </Field>

      <Field>
        <FieldLabel>{t('dialog.includeLabel')}</FieldLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {INCLUDES.map(o => {
            const active = includes.includes(o.v)
            const IconComp = o.Icon
            return (
              <label
                key={o.v}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: 12,
                  borderRadius: 'var(--radius-tile)',
                  background: active ? 'var(--bg-brand-subtle)' : 'var(--bg-surface)',
                  border: active ? '1px solid var(--border-brand)' : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                }}
              >
                <Checkbox
                  checked={active}
                  onCheckedChange={() => toggle(o.v)}
                  onClick={(e) => e.stopPropagation()}
                />
                <span
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-muted)',
                    color: 'var(--fg-secondary)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <IconComp size={15} />
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 'var(--text-body-sm)', fontWeight: '600' }}>{t(o.lKey)}</div>
                  <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', marginTop: 1 }}>{t(o.dKey)}</div>
                </div>
              </label>
            )
          })}
        </div>
      </Field>
    </ModalShell>
  )
}
