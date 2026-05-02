import { useState } from 'react'
import { CheckCircle2, Download, PieChart, Receipt, Target, Wallet } from 'lucide-react'
import { TX } from '@/shared/lib/porest/data'
import { ModalShell } from '@/shared/ui/porest/dialogs'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Field, FieldLabel } from '@/shared/ui/field'
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/toggle-group'

type FileFormat = 'csv' | 'xlsx' | 'pdf'
type Period = 'week' | 'month' | '3m' | 'year' | 'custom'
type IncludeKey = 'tx' | 'cat' | 'budget' | 'asset'

const FORMATS: { v: FileFormat; l: string; d: string }[] = [
  { v: 'csv', l: 'CSV', d: 'Excel·Google 시트' },
  { v: 'xlsx', l: 'Excel', d: 'xlsx 형식' },
  { v: 'pdf', l: 'PDF', d: '요약 보고서' },
]

const PERIODS: { v: Period; l: string }[] = [
  { v: 'week', l: '주간' },
  { v: 'month', l: '이번 달' },
  { v: '3m', l: '분기' },
  { v: 'year', l: '올해' },
  { v: 'custom', l: '직접 선택' },
]

const INCLUDES: { v: IncludeKey; l: string; d: string; Icon: React.ComponentType<{ size?: number }> }[] = [
  { v: 'tx', l: '거래 내역', d: '모든 수입·지출·이체', Icon: Receipt },
  { v: 'cat', l: '카테고리 요약', d: '카테고리별 합계와 비율', Icon: PieChart },
  { v: 'budget', l: '예산 진행 상황', d: '할당·사용·초과 현황', Icon: Target },
  { v: 'asset', l: '자산 스냅샷', d: '기간 말일 기준 잔액', Icon: Wallet },
]

export function ExportDialog({ onClose, mobile }: { onClose: () => void; mobile: boolean }) {
  const [format, setFormat] = useState<FileFormat>('csv')
  const [period, setPeriod] = useState<Period>('month')
  const [includes, setIncludes] = useState<IncludeKey[]>(['tx', 'cat', 'budget'])
  const [customFrom, setCustomFrom] = useState('2026-01-01')
  const [customTo, setCustomTo] = useState('2026-04-20')

  const toggle = (v: IncludeKey) =>
    setIncludes(includes.includes(v) ? includes.filter(x => x !== v) : [...includes, v])

  const Footer = (
    <>
      <span style={{ marginRight: 'auto', fontSize: 12, color: 'var(--fg-tertiary)' }}>
        약 <b style={{ color: 'var(--fg-secondary)' }}>{TX.length}건</b>의 거래가 내보내집니다.
      </span>
      <Button variant="ghost" onClick={onClose}>취소</Button>
      <Button onClick={onClose}>
        <Download size={14} /> {format.toUpperCase()} 내보내기
      </Button>
    </>
  )

  return (
    <ModalShell title="내보내기" onClose={onClose} size="md" footer={Footer} mobile={mobile}>
      <Field style={{ marginBottom: 18 }}>
        <FieldLabel>파일 형식</FieldLabel>
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
                  border: active ? '1px solid var(--mossy-500)' : '1px solid var(--border-subtle)',
                  borderRadius: 12,
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'inherit',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: 14,
                      color: active ? 'var(--fg-brand-strong)' : 'var(--fg-primary)',
                    }}
                  >
                    {o.l}
                  </span>
                  {active && <CheckCircle2 size={14} style={{ color: 'var(--mossy-600)', marginLeft: 'auto' }} />}
                </div>
                <div style={{ fontSize: 11, color: 'var(--fg-tertiary)' }}>{o.d}</div>
              </button>
            )
          })}
        </div>
      </Field>

      <Field style={{ marginBottom: 18 }}>
        <FieldLabel>기간</FieldLabel>
        <ToggleGroup
          type="single"
          variant="segmented"
          value={period}
          onValueChange={(v) => v && setPeriod(v as Period)}
        >
          {PERIODS.map(o => (
            <ToggleGroupItem key={o.v} value={o.v}>
              {o.l}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
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
        <FieldLabel>포함할 내용</FieldLabel>
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
                  borderRadius: 10,
                  background: active ? 'var(--bg-brand-subtle)' : 'var(--bg-surface)',
                  border: active ? '1px solid var(--mossy-500)' : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => toggle(o.v)}
                  style={{ width: 17, height: 17, accentColor: 'var(--mossy-600)' }}
                />
                <span
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: 'var(--pd-surface-subtle)',
                    color: 'var(--fg-secondary)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <IconComp size={15} />
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{o.l}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--fg-tertiary)', marginTop: 1 }}>{o.d}</div>
                </div>
              </label>
            )
          })}
        </div>
      </Field>
    </ModalShell>
  )
}
