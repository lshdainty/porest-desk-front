import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatMonthDay } from '@/shared/lib/date'
import {
  Braces,
  Calendar,
  Download,
  Eye,
  FileText,
  Receipt,
  SquareCheckBig,
  Sheet,
  Tag,
  Target,
  Wallet,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/shared/ui/button'
import { Checkbox } from '@/shared/ui/checkbox'
import { Input } from '@/shared/ui/input'
import { Switch } from '@/shared/ui/switch'
import { downloadBlob } from '@/shared/lib/download'
import {
  downloadExport,
  fetchExportCounts,
  fetchExportPreview,
  type ExportDataType,
  type ExportFormat,
  type ExportPeriod,
  type ExportPreviewTable,
} from '@/features/export/api/exportApi'

// ─── 데이터 종류 / 형식 / 기간 정의 ─────────────────────────────

const DATA_TYPES: { v: ExportDataType; labelKey: string; Icon: React.ComponentType<{ size?: number }> }[] = [
  { v: 'EXPENSE', labelKey: 'section.dataType.EXPENSE', Icon: Receipt },
  { v: 'ASSET', labelKey: 'section.dataType.ASSET', Icon: Wallet },
  { v: 'BUDGET', labelKey: 'section.dataType.BUDGET', Icon: Target },
  { v: 'CATEGORY', labelKey: 'section.dataType.CATEGORY', Icon: Tag },
  { v: 'MEMO', labelKey: 'section.dataType.MEMO', Icon: FileText },
  { v: 'CALENDAR', labelKey: 'section.dataType.CALENDAR', Icon: Calendar },
  { v: 'TODO', labelKey: 'section.dataType.TODO', Icon: SquareCheckBig },
]
const ALL_TYPES: ExportDataType[] = DATA_TYPES.map(dt => dt.v)

const FORMATS: { v: ExportFormat; label: string; ext: string; descKey: string; Icon: React.ComponentType<{ size?: number }> }[] = [
  { v: 'CSV', label: 'CSV', ext: '.csv', descKey: 'section.format.csv.desc', Icon: FileText },
  { v: 'EXCEL', label: 'Excel', ext: '.xlsx', descKey: 'section.format.excel.desc', Icon: Sheet },
  { v: 'JSON', label: 'JSON', ext: '.json', descKey: 'section.format.json.desc', Icon: Braces },
]

const PERIODS: { v: ExportPeriod; labelKey: string }[] = [
  { v: 'THIS_MONTH', labelKey: 'section.period.thisMonth' },
  { v: 'LAST_MONTH', labelKey: 'section.period.lastMonth' },
  { v: 'LAST_3_MONTHS', labelKey: 'section.period.last3m' },
  { v: 'THIS_YEAR', labelKey: 'section.period.thisYear' },
  { v: 'CUSTOM', labelKey: 'section.period.custom' },
]

const SLUG_TO_EXT: Record<ExportFormat, string> = { CSV: 'csv', EXCEL: 'xlsx', JSON: 'json' }
const TYPE_SLUG: Record<ExportDataType, string> = {
  EXPENSE: 'expense', ASSET: 'asset', BUDGET: 'budget', CATEGORY: 'category',
  MEMO: 'memo', CALENDAR: 'calendar', TODO: 'todo',
}

// ─── 날짜 유틸 (백엔드 PeriodResolver 와 동일 규칙) ───────────────

const pad = (n: number) => String(n).padStart(2, '0')
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const krLabel = (s: string) => formatMonthDay(s)

interface Range { start: string; end: string }

function resolveRange(period: ExportPeriod, customFrom: string, customTo: string): Range {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const firstOf = (yy: number, mm: number) => new Date(yy, mm, 1)
  const lastOf = (yy: number, mm: number) => new Date(yy, mm + 1, 0)
  switch (period) {
    case 'THIS_MONTH': return { start: iso(firstOf(y, m)), end: iso(lastOf(y, m)) }
    case 'LAST_MONTH': return { start: iso(firstOf(y, m - 1)), end: iso(lastOf(y, m - 1)) }
    case 'LAST_3_MONTHS': return { start: iso(firstOf(y, m - 2)), end: iso(lastOf(y, m)) }
    case 'THIS_YEAR': return { start: iso(new Date(y, 0, 1)), end: iso(lastOf(y, m)) }
    case 'CUSTOM': return { start: customFrom, end: customTo }
  }
}

function buildFilename(format: ExportFormat, types: ExportDataType[], range: Range): string {
  const ext = SLUG_TO_EXT[format]
  const rangePart = `${range.start}_${range.end}`
  if (format !== 'EXCEL' && types.length > 1) return `porest-export-${rangePart}.zip`
  const namePart = types.length === 1 ? TYPE_SLUG[types[0]!] : 'export'
  return `porest-${namePart}-${rangePart}.${ext}`
}

// ─── 메인 섹션 ─────────────────────────────────────────────────

export function DataExportSection({ mobile }: { mobile: boolean }) {
  const { t } = useTranslation('export')
  const [format, setFormat] = useState<ExportFormat>('CSV')
  const [period, setPeriod] = useState<ExportPeriod>('THIS_MONTH')
  const [customFrom, setCustomFrom] = useState(iso(new Date(new Date().getFullYear(), new Date().getMonth(), 1)))
  const [customTo, setCustomTo] = useState(iso(new Date()))
  const [selected, setSelected] = useState<ExportDataType[]>(['EXPENSE', 'ASSET', 'BUDGET'])
  const [mask, setMask] = useState(false)

  const [counts, setCounts] = useState<Record<string, number>>({})
  const [downloading, setDownloading] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [preview, setPreview] = useState<ExportPreviewTable[] | null>(null)
  const [previewTab, setPreviewTab] = useState<string | null>(null)

  const range = useMemo(() => resolveRange(period, customFrom, customTo), [period, customFrom, customTo])
  const customInvalid = period === 'CUSTOM' && (!customFrom || !customTo || customFrom > customTo)

  const queryBody = useCallback((types: ExportDataType[]) => ({
    period,
    startDate: period === 'CUSTOM' ? customFrom : undefined,
    endDate: period === 'CUSTOM' ? customTo : undefined,
    types,
  }), [period, customFrom, customTo])

  // 기간 변경 시 7종 전체 건수 재조회 (디자인: 모든 행에 건수 표시).
  useEffect(() => {
    if (customInvalid) return
    let alive = true
    fetchExportCounts(queryBody(ALL_TYPES))
      .then(list => {
        if (!alive) return
        const map: Record<string, number> = {}
        list.forEach(c => { map[c.type] = c.count })
        setCounts(map)
      })
      .catch(() => { /* 전역 토스트가 처리 */ })
    return () => { alive = false }
  }, [queryBody, customInvalid])

  const toggleType = (v: ExportDataType) =>
    setSelected(prev => (prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]))

  const totalSelectedCount = selected.reduce((sum, ty) => sum + (counts[TYPE_SLUG[ty]] ?? 0), 0)

  const handlePreview = async () => {
    if (!selected.length || customInvalid) return
    setPreviewing(true)
    try {
      const tables = await fetchExportPreview(queryBody(selected))
      setPreview(tables)
      setPreviewTab(tables[0]?.type ?? null)
    } finally {
      setPreviewing(false)
    }
  }

  const handleExport = async () => {
    if (!selected.length || customInvalid) return
    setDownloading(true)
    try {
      const blob = await downloadExport({ ...queryBody(selected), format, mask })
      downloadBlob(blob, buildFilename(format, selected, range))
      toast.success(t('section.exportDone'))
    } finally {
      setDownloading(false)
    }
  }

  const activeTab = preview?.find(tb => tb.type === previewTab) ?? preview?.[0] ?? null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 1. 기간 선택 */}
      <SectionCard title={t('section.periodSelect')}>
        <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr 1fr' : 'repeat(5, 1fr)', gap: 8 }}>
          {PERIODS.map(p => {
            const active = period === p.v
            const r = resolveRange(p.v, customFrom, customTo)
            const sub = p.v === 'CUSTOM' ? t('section.customSelect') : `${krLabel(r.start)} — ${krLabel(r.end)}`
            return (
              <button key={p.v} type="button" onClick={() => setPeriod(p.v)} style={tileStyle(active)}>
                <div style={{ fontSize: 'var(--text-body-sm)', fontWeight: 700, color: active ? 'var(--fg-brand-strong)' : 'var(--fg-primary)' }}>
                  {t(p.labelKey)}
                </div>
                <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', marginTop: 3 }}>{sub}</div>
              </button>
            )
          })}
        </div>
        {period === 'CUSTOM' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, alignItems: 'center', marginTop: 10 }}>
            <Input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} />
            <span style={{ color: 'var(--fg-tertiary)' }}>~</span>
            <Input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} />
          </div>
        )}
        {customInvalid && (
          <div style={{ marginTop: 8, fontSize: 'var(--text-caption)', color: 'var(--status-danger)' }}>
            {t('section.dateError')}
          </div>
        )}
      </SectionCard>

      {/* 2. 데이터 종류 */}
      <SectionCard
        title={t('section.dataTypeTitle', { count: selected.length })}
        desc={t('section.dataTypeDesc')}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {DATA_TYPES.map((dt, idx) => {
            const active = selected.includes(dt.v)
            const IconComp = dt.Icon
            const cnt = counts[TYPE_SLUG[dt.v]]
            return (
              <label
                key={dt.v}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 4px',
                  borderTop: idx === 0 ? 'none' : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                }}
              >
                <Checkbox checked={active} onCheckedChange={() => toggleType(dt.v)} onClick={e => e.stopPropagation()} />
                <span style={iconBoxStyle}><IconComp size={16} /></span>
                <span style={{ flex: 1, fontSize: 'var(--text-body-sm)', fontWeight: 600, color: 'var(--fg-primary)' }}>{t(dt.labelKey)}</span>
                <span style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)' }}>
                  {cnt == null ? '…' : t('section.countGeon', { count: cnt.toLocaleString() })}
                </span>
              </label>
            )
          })}
        </div>
      </SectionCard>

      {/* 3. 파일 형식 */}
      <SectionCard title={t('fileFormat')}>
        <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: 8 }}>
          {FORMATS.map(f => {
            const active = format === f.v
            const IconComp = f.Icon
            return (
              <button key={f.v} type="button" onClick={() => setFormat(f.v)} style={tileStyle(active)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <IconComp size={16} />
                  <span style={{ fontSize: 'var(--text-body-sm)', fontWeight: 700, color: active ? 'var(--fg-brand-strong)' : 'var(--fg-primary)' }}>{f.label}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)' }}>{f.ext}</span>
                </div>
                <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', marginTop: 4 }}>{t(f.descKey)}</div>
              </button>
            )
          })}
        </div>
      </SectionCard>

      {/* 마스킹 + 액션 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
          justifyContent: 'space-between',
        }}
      >
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <Switch checked={mask} onCheckedChange={setMask} />
          <span style={{ fontSize: 'var(--text-body-sm)', color: 'var(--fg-secondary)' }}>{t('section.maskSensitive')}</span>
        </label>
        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
          <Button variant="outline" onClick={handlePreview} loading={previewing} disabled={!selected.length || customInvalid}>
            <Eye size={14} /> {t('preview')}
          </Button>
          <Button onClick={handleExport} loading={downloading} disabled={!selected.length || customInvalid}>
            <Download size={14} /> {t('export')}
          </Button>
        </div>
      </div>

      {/* 미리보기 결과 */}
      {preview && activeTab && (
        <SectionCard title={t('preview')}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {preview.map(tbl => {
              const on = (previewTab ?? preview[0]?.type) === tbl.type
              return (
                <button
                  key={tbl.type}
                  type="button"
                  onClick={() => setPreviewTab(tbl.type)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 'var(--radius-full)',
                    border: on ? '1px solid var(--border-brand)' : '1px solid var(--border-subtle)',
                    background: on ? 'var(--bg-brand-subtle)' : 'var(--bg-surface)',
                    color: on ? 'var(--fg-brand-strong)' : 'var(--fg-secondary)',
                    fontSize: 'var(--text-caption)',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {tbl.displayName} {tbl.totalCount.toLocaleString()}
                </button>
              )
            })}
          </div>
          <div style={{ overflowX: 'auto' }}>
            {activeTab.rows.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 'var(--text-body-sm)' }}>
                {t('section.noData')}
              </div>
            ) : (
              <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 'var(--text-caption)' }}>
                <thead>
                  <tr>
                    {activeTab.headers.map(h => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeTab.rows.map((row, ri) => (
                    <tr key={ri}>
                      {row.map((cell, ci) => (
                        <td key={ci} style={tdStyle}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div style={{ marginTop: 10, fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)' }}>
            {t('section.previewFooter', { rows: activeTab.rows.length, types: selected.length, total: totalSelectedCount.toLocaleString() })}
          </div>
        </SectionCard>
      )}
    </div>
  )
}

// ─── 보조 컴포넌트/스타일 ──────────────────────────────────────

function SectionCard({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        boxShadow: 'var(--shadow-sm)',
        borderRadius: 'var(--radius-card)',
        padding: 'var(--spacing-lg)',
      }}
    >
      <div style={{ fontSize: 'var(--text-body-md)', fontWeight: 700, color: 'var(--fg-primary)' }}>{title}</div>
      {desc && <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', marginTop: 2, marginBottom: 4 }}>{desc}</div>}
      <div style={{ marginTop: 12 }}>{children}</div>
    </div>
  )
}

const tileStyle = (active: boolean): React.CSSProperties => ({
  padding: 14,
  background: active ? 'var(--bg-brand-subtle)' : 'var(--bg-surface)',
  border: active ? '1px solid var(--border-brand)' : '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-lg)',
  cursor: 'pointer',
  textAlign: 'left',
  fontFamily: 'inherit',
})

const iconBoxStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 'var(--radius-md)',
  background: 'var(--bg-muted)',
  color: 'var(--fg-secondary)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '6px 10px',
  borderBottom: '1px solid var(--border-default)',
  color: 'var(--fg-secondary)',
  fontWeight: 700,
  whiteSpace: 'nowrap',
}

const tdStyle: React.CSSProperties = {
  padding: '6px 10px',
  borderBottom: '1px solid var(--border-subtle)',
  color: 'var(--fg-primary)',
  whiteSpace: 'nowrap',
  maxWidth: 220,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}
