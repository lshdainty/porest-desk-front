import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  Check,
  Download,
  FileSpreadsheet,
  Info,
  Loader2,
  Plus,
  UploadCloud,
  X,
} from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Switch } from '@/shared/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import {
  analyzeImport,
  executeImport,
  type ImportAnalyzeResult,
  type ImportExecuteResult,
  type ImportField,
  type ImportMapping,
  type ImportSource,
} from '@/features/import/api/importApi'

// ─── 소스 프리셋 / 매핑 필드 ───────────────────────────────────

const SOURCES: { v: ImportSource; nameKey: string; descKey: string }[] = [
  { v: 'POREST', nameKey: 'import.source.porest', descKey: 'import.source.porestDesc' },
  { v: 'EASYBUDGET', nameKey: 'import.source.easybudget', descKey: 'import.source.easybudgetDesc' },
  { v: 'BANKSALAD', nameKey: 'import.source.banksalad', descKey: 'import.source.banksaladDesc' },
  { v: 'TOSS', nameKey: 'import.source.toss', descKey: 'import.source.tossDesc' },
  { v: 'CUSTOM', nameKey: 'import.source.custom', descKey: 'import.source.customDesc' },
]

const MAP_FIELDS: { f: ImportField; labelKey: string; required?: boolean }[] = [
  { f: 'DATE', labelKey: 'import.field.date', required: true },
  { f: 'AMOUNT', labelKey: 'import.field.amount', required: true },
  { f: 'TYPE', labelKey: 'import.field.type' },
  { f: 'CATEGORY', labelKey: 'import.field.category' },
  { f: 'ASSET', labelKey: 'import.field.asset' },
  { f: 'MEMO', labelKey: 'import.field.memo' },
]

const NONE = 'none'
type Step = 'upload' | 'mapping' | 'done'

// ─── 메인 ──────────────────────────────────────────────────────

export function DataImportSection({ mobile }: { mobile: boolean }) {
  const { t } = useTranslation('export')
  const [step, setStep] = useState<Step>('upload')
  const [source, setSource] = useState<ImportSource>('POREST')
  const [file, setFile] = useState<File | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<ImportAnalyzeResult | null>(null)
  const [mapping, setMapping] = useState<ImportMapping>({})
  const [dupSkip, setDupSkip] = useState(true)
  const [autoCat, setAutoCat] = useState(true)
  const [executing, setExecuting] = useState(false)
  const [result, setResult] = useState<ImportExecuteResult | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const pickFile = async (f: File) => {
    setFile(f)
    setAnalyzing(true)
    try {
      const res = await analyzeImport(f, source)
      setAnalysis(res)
      setMapping(res.suggestedMapping)
      setStep('mapping')
    } catch {
      /* 전역 토스트가 처리 */
    } finally {
      setAnalyzing(false)
    }
  }

  const setField = (field: ImportField, colStr: string) =>
    setMapping(prev => {
      const next = { ...prev }
      if (colStr === NONE) delete next[field]
      else next[field] = Number(colStr)
      return next
    })

  const canExecute =
    mapping.DATE != null && (mapping.AMOUNT != null || mapping.AMOUNT_OUT != null || mapping.AMOUNT_IN != null)

  const runImport = async () => {
    if (!file || !canExecute) return
    setExecuting(true)
    try {
      const res = await executeImport(file, { source, mapping, dupSkip, autoCat })
      setResult(res)
      setStep('done')
    } catch {
      /* 전역 토스트가 처리 */
    } finally {
      setExecuting(false)
    }
  }

  const reset = () => {
    setStep('upload')
    setFile(null)
    setAnalysis(null)
    setMapping({})
    setResult(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2xl)' }}>
      <Stepper step={step} t={t} mobile={mobile} />

      {step === 'upload' && (
        <>
          <SectionCard mobile={mobile} title={t('import.sourceTitle')} desc={t('import.sourceDesc')}>
            <Select value={source} onValueChange={v => setSource(v as ImportSource)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SOURCES.map(s => (
                  <SelectItem key={s.v} value={s.v}>
                    {t(s.nameKey)} · {t(s.descKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SectionCard>

          <SectionCard mobile={mobile} title={t('import.uploadTitle')} desc={t('import.uploadDesc')}>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={e => {
                const f = e.target.files?.[0]
                if (f) pickFile(f)
              }}
              style={{ display: 'none' }}
            />
            <div
              onClick={() => !analyzing && fileRef.current?.click()}
              onDragOver={e => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => {
                e.preventDefault()
                setDragOver(false)
                const f = e.dataTransfer.files?.[0]
                if (f) pickFile(f)
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                padding: mobile ? '28px 16px' : '36px 20px',
                cursor: analyzing ? 'default' : 'pointer',
                textAlign: 'center',
                background: dragOver ? 'var(--bg-brand-subtle)' : 'var(--bg-muted)',
                border: `1.5px dashed ${dragOver ? 'var(--border-brand)' : 'var(--border-default)'}`,
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <span
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 'var(--radius-full)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--bg-brand-subtle)',
                  color: 'var(--fg-brand-strong)',
                }}
              >
                {analyzing ? <Loader2 size={24} className="animate-spin" /> : <UploadCloud size={24} />}
              </span>
              <div>
                <div style={{ fontSize: 'var(--text-body-md)', fontWeight: 700, color: 'var(--fg-primary)' }}>
                  {analyzing ? t('import.analyzing') : t('import.dropTitle')}
                </div>
                <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', marginTop: 3 }}>
                  {t('import.dropHint')}
                </div>
              </div>
            </div>
          </SectionCard>

          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: '12px 16px',
              background: 'var(--bg-muted)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <Info size={15} color="var(--fg-tertiary)" style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-secondary)', lineHeight: 1.5 }}>
              {t('import.notice')}
            </span>
          </div>
        </>
      )}

      {step === 'mapping' && analysis && (
        <>
          <SectionCard mobile={mobile} title={t('import.fileTitle')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={fileIconStyle}>
                <FileSpreadsheet size={17} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 'var(--text-body-sm)', fontWeight: 600, color: 'var(--fg-primary)' }}>
                  {analysis.fileName}
                </div>
                <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', marginTop: 1 }}>
                  {t('import.rowsDetected', { total: analysis.totalRows, valid: analysis.validRows })}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={reset}>
                <X size={13} /> {t('import.change')}
              </Button>
            </div>
          </SectionCard>

          <SectionCard mobile={mobile} title={t('import.mapTitle')} desc={t('import.mapDesc')}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {MAP_FIELDS.map((mf, idx) => (
                <div
                  key={mf.f}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 0',
                    borderTop: idx === 0 ? 'none' : '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ width: mobile ? 92 : 130, flexShrink: 0 }}>
                    <span style={{ fontSize: 'var(--text-body-sm)', fontWeight: 600, color: 'var(--fg-primary)' }}>
                      {t(mf.labelKey)}
                    </span>
                    {mf.required && <span style={{ color: 'var(--status-danger)', marginLeft: 3 }}>*</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Select
                      value={mapping[mf.f] != null ? String(mapping[mf.f]) : NONE}
                      onValueChange={v => setField(mf.f, v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>{t('import.notMapped')}</SelectItem>
                        {analysis.columns.map(c => (
                          <SelectItem key={c.index} value={String(c.index)}>
                            {c.name || `#${c.index + 1}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title={t('preview')}
            desc={t('import.previewDesc', { dup: analysis.duplicateCount })}
          >
            <div style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 'var(--text-caption)', minWidth: 520 }}>
                <thead>
                  <tr>
                    {[t('import.field.date'), t('import.field.type'), t('import.field.category'), t('import.field.asset'), t('import.field.amount'), t('import.field.memo'), ''].map((h, i) => (
                      <th key={i} style={{ ...thStyle, textAlign: i === 4 ? 'right' : 'left' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {analysis.preview.map(r => (
                    <tr key={r.lineNo} style={{ opacity: r.error ? 0.4 : r.duplicate && dupSkip ? 0.5 : 1 }}>
                      <td style={tdStyle}>{r.date ? r.date.slice(0, 10) : '—'}</td>
                      <td style={tdStyle}>
                        {r.type ? (
                          <span style={typeBadge(r.type)}>
                            {r.type === 'INCOME' ? t('import.income') : t('import.expense')}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td style={tdStyle}>{r.category ?? '—'}</td>
                      <td style={tdStyle}>{r.asset ?? '—'}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>
                        {r.amount != null ? r.amount.toLocaleString() : '—'}
                      </td>
                      <td style={{ ...tdStyle, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {r.memo ?? ''}
                      </td>
                      <td style={tdStyle}>
                        {r.duplicate && (
                          <span style={{ fontSize: 'var(--text-badge)', fontWeight: 700, color: 'var(--color-chart-orange, var(--fg-tertiary))' }}>
                            {t('import.dupBadge')}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <SectionCard mobile={mobile} title={t('import.optionsTitle')}>
            <label style={optionRow}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 'var(--text-body-sm)', fontWeight: 600, color: 'var(--fg-primary)' }}>
                  {t('import.optDupSkip')}
                </div>
                <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', marginTop: 1 }}>
                  {t('import.optDupSkipDesc', { dup: analysis.duplicateCount })}
                </div>
              </div>
              <Switch checked={dupSkip} onCheckedChange={setDupSkip} />
            </label>
            <label style={{ ...optionRow, borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 'var(--text-body-sm)', fontWeight: 600, color: 'var(--fg-primary)' }}>
                  {t('import.optAutoCat')}
                </div>
                <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', marginTop: 1 }}>
                  {t('import.optAutoCatDesc')}
                </div>
              </div>
              <Switch checked={autoCat} onCheckedChange={setAutoCat} />
            </label>
          </SectionCard>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <Button variant="outline" onClick={reset}>
              <ArrowLeft size={14} /> {t('import.prev')}
            </Button>
            <Button onClick={runImport} loading={executing} disabled={!canExecute}>
              <Download size={14} />{' '}
              {t('import.doImport', { count: dupSkip ? analysis.validRows - analysis.duplicateCount : analysis.validRows })}
            </Button>
          </div>
        </>
      )}

      {step === 'done' && result && (
        <SectionCard mobile={mobile} title={t('import.doneTitle')}>
          <div style={{ padding: '24px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 14 }}>
            <span
              style={{
                width: 60,
                height: 60,
                borderRadius: 'var(--radius-full)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg-success-subtle, var(--bg-brand-subtle))',
                color: 'var(--status-success, var(--fg-brand-strong))',
              }}
            >
              <Check size={30} strokeWidth={2.6} />
            </span>
            <div>
              <div style={{ fontSize: 'var(--text-title-sm)', fontWeight: 800, color: 'var(--fg-primary)' }}>
                {t('import.doneCount', { count: result.imported })}
              </div>
              <div style={{ fontSize: 'var(--text-body-sm)', color: 'var(--fg-tertiary)', marginTop: 4 }}>
                {t('import.doneDetail', { skipped: result.skipped, failed: result.failed })}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={reset}>
              <Plus size={13} /> {t('import.another')}
            </Button>
          </div>
        </SectionCard>
      )}
    </div>
  )
}

// ─── 스텝 인디케이터 ───────────────────────────────────────────

function Stepper({ step, t, mobile }: { step: Step; t: (k: string) => string; mobile: boolean }) {
  const steps: { k: Step; label: string }[] = [
    { k: 'upload', label: t('import.stepUpload') },
    { k: 'mapping', label: t('import.stepMapping') },
    { k: 'done', label: t('import.stepDone') },
  ]
  const idx = steps.findIndex(s => s.k === step)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: mobile ? '2px 0 4px' : '0 0 4px' }}>
      {steps.map((s, i) => (
        <div key={s.k} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: i < steps.length - 1 ? 1 : 'unset' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: 'var(--radius-full)',
                flexShrink: 0,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'var(--text-badge)',
                fontWeight: 700,
                background: i <= idx ? 'var(--bg-brand)' : 'var(--bg-muted)',
                color: i <= idx ? 'var(--fg-on-brand)' : 'var(--fg-tertiary)',
              }}
            >
              {i < idx ? '✓' : i + 1}
            </span>
            <span
              style={{
                fontSize: 'var(--text-body-sm)',
                fontWeight: i === idx ? 700 : 500,
                color: i <= idx ? 'var(--fg-primary)' : 'var(--fg-tertiary)',
              }}
            >
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && <span style={{ flex: 1, height: 1, background: 'var(--border-subtle)', minWidth: 16 }} />}
        </div>
      ))}
    </div>
  )
}

// ─── 보조 컴포넌트/스타일 ──────────────────────────────────────

function SectionCard({ title, desc, children, mobile }: { title: string; desc?: string; children: React.ReactNode; mobile?: boolean }) {
  const inner = (
    <>
      <div style={{ fontSize: 'var(--text-body-md)', fontWeight: 700, color: 'var(--fg-primary)' }}>{title}</div>
      {desc && <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', marginTop: 2, marginBottom: 4 }}>{desc}</div>}
      {/* label↔content gap 0(사용자 결정) */}
      <div>{children}</div>
    </>
  )
  // 모바일 카드 다이어트(사용자 결정) — 셸 없이 [label+content] 플랫 묶음(내보내기 탭 정합).
  if (mobile) return <section>{inner}</section>
  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        boxShadow: 'var(--shadow-sm)',
        borderRadius: 'var(--radius-card)',
        padding: 'var(--spacing-lg)',
      }}
    >
      {inner}
    </div>
  )
}

const fileIconStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 'var(--radius-md)',
  background: 'var(--bg-muted)',
  color: 'var(--fg-secondary)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
}

const optionRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '12px 0',
  cursor: 'pointer',
}

const thStyle: React.CSSProperties = {
  padding: '6px 10px',
  borderBottom: '1px solid var(--border-default)',
  color: 'var(--fg-secondary)',
  fontWeight: 700,
  whiteSpace: 'nowrap',
}

const tdStyle: React.CSSProperties = {
  padding: '8px 10px',
  borderBottom: '1px solid var(--border-subtle)',
  color: 'var(--fg-primary)',
  whiteSpace: 'nowrap',
}

function typeBadge(type: string): React.CSSProperties {
  const income = type === 'INCOME'
  return {
    fontSize: 'var(--text-badge)',
    fontWeight: 700,
    padding: '1px 7px',
    borderRadius: 'var(--radius-full)',
    background: income ? 'var(--bg-brand-subtle)' : 'var(--bg-muted)',
    color: income ? 'var(--fg-brand-strong)' : 'var(--fg-secondary)',
  }
}
