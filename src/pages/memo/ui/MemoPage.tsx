import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Pin, Plus, Search, X, StickyNote, SearchX } from 'lucide-react'
import {
  useMemos,
  useCreateMemo,
  useUpdateMemo,
  useToggleMemoPin,
  useDeleteMemo,
} from '@/features/memo'
import type { Memo, MemoFormValues } from '@/entities/memo'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Textarea } from '@/shared/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { Switch } from '@/shared/ui/switch'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { Field, FieldLabel } from '@/shared/ui/field'
import { ColorSwatchGroup } from '@/shared/ui/color-swatch'
import { ModalShell } from '@/shared/ui/porest/dialogs'
import { ModalFooter } from '@/shared/ui/porest/modal-footer'
import { MANAGER_LAYOUT } from '@/shared/ui/porest/manager-layout'
import { MobileBackHeader } from '@/shared/ui/porest/mobile-back-header'
import { Skeleton as SkeletonBase } from '@/shared/ui/skeleton'
import { CAT_PALETTE } from '@/shared/lib/porest/chart-palette'

type OutletCtx = { onAddTx: () => void; mobile: boolean }

// 태그 select 옵션 7종 (양 플랫폼 공통 확정). 기본값 '개인'.
const TAG_OPTIONS = ['가계부', '자산', '업무', '개인', '건강', '결제', '고정비'] as const
const DEFAULT_TAG = '개인'
// 메모 색은 chart palette base hex 저장. null 이면 blue 취급.
const DEFAULT_COLOR = '#2c70bf' // blue

/*
 * MEMO_COLORS — base hex 키 맵 (양 플랫폼 공통 확정 규칙).
 * - swatch = chart 원색(alias var, 다크 자동 swap)
 * - bg     = color-mix(in oklab, <chart색> 틴트%, var(--bg-surface)) — 카드 배경
 * - fg     = color-mix(in oklab, <chart색> 믹스%, var(--fg-primary)) — 태그 라벨(테마 적응)
 * CAT_PALETTE 의 cssVar alias 를 재사용해 라이트/다크 자동 전환.
 */
type MemoTone = { key: string; baseHex: string; cssVar: string; bgPct: number; fgPct: number }

const MEMO_TONES: MemoTone[] = [
  { key: 'blue', baseHex: '#2c70bf', cssVar: '--color-cat-blue', bgPct: 12, fgPct: 72 },
  { key: 'green', baseHex: '#2d8060', cssVar: '--color-cat-green', bgPct: 14, fgPct: 70 },
  { key: 'pink', baseHex: '#b83b7a', cssVar: '--color-cat-pink', bgPct: 12, fgPct: 72 },
  { key: 'violet', baseHex: '#8b4dba', cssVar: '--color-cat-violet', bgPct: 12, fgPct: 72 },
  { key: 'red', baseHex: '#c73838', cssVar: '--color-cat-red', bgPct: 12, fgPct: 72 },
  { key: 'orange', baseHex: '#b36418', cssVar: '--color-cat-orange', bgPct: 13, fgPct: 70 },
  { key: 'indigo', baseHex: '#5e60c8', cssVar: '--color-cat-indigo', bgPct: 13, fgPct: 72 },
  { key: 'yellow', baseHex: '#8c7400', cssVar: '--color-cat-yellow', bgPct: 16, fgPct: 64 },
  { key: 'brown', baseHex: '#9a6536', cssVar: '--color-cat-brown', bgPct: 14, fgPct: 68 },
  { key: 'gray', baseHex: '#6b7484', cssVar: '--color-cat-gray', bgPct: 16, fgPct: 60 },
]

const TONE_BY_HEX = new Map(MEMO_TONES.map(t => [t.baseHex.toLowerCase(), t]))

type ResolvedTone = { swatch: string; bg: string; fg: string }

/** base hex → { swatch, bg, fg }. null/미지정/미정의 hex 는 blue fallback. */
function resolveTone(color: string | null | undefined): ResolvedTone {
  const tone = (color && TONE_BY_HEX.get(color.toLowerCase())) || MEMO_TONES[0]!
  const v = `var(${tone.cssVar})`
  return {
    swatch: v,
    bg: `color-mix(in oklab, ${v} ${tone.bgPct}%, var(--bg-surface))`,
    fg: `color-mix(in oklab, ${v} ${tone.fgPct}%, var(--fg-primary))`,
  }
}

/** modifyAt('YYYY-MM-DD HH:MM[:SS]' 또는 ISO) → 'MM/DD · HH:MM'. */
function formatStamp(iso: string): string {
  if (!iso) return ''
  // slice(5,16): 'MM-DD HH:MM' → '/' · ' '→' · '
  const s = iso.replace('T', ' ').slice(5, 16)
  if (s.length < 11) return s.replace('-', '/')
  return `${s.slice(0, 5).replace('-', '/')} · ${s.slice(6)}`
}

function SectionLabel({ icon, label }: { icon: 'pin' | 'note'; label: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 11,
        fontWeight: '700',
        color: 'var(--fg-tertiary)',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        marginBottom: 4,
      }}
    >
      {icon === 'pin' ? <Pin size={12} /> : <StickyNote size={12} />}
      {label}
    </div>
  )
}

/** MemoPage 진입 시 사용하는 useQuery 의 isLoading 집계. */
function useMemoPageData() {
  const memosQ = useMemos()
  return { isLoading: memosQ.isLoading }
}

export const MemoPage = () => {
  const { mobile } = useOutletContext<OutletCtx>()
  const { isLoading } = useMemoPageData()
  if (isLoading) return <MemoPageSkeleton mobile={mobile} />
  return <MemoPageInner mobile={mobile} />
}

const MemoPageInner = ({ mobile }: { mobile: boolean }) => {
  const { t } = useTranslation('memo')
  const { t: tc } = useTranslation('common')
  const memosQ = useMemos()
  const createMemo = useCreateMemo()
  const updateMemo = useUpdateMemo()
  const togglePin = useToggleMemoPin()
  const deleteMemo = useDeleteMemo()

  const memos: Memo[] = useMemo(() => memosQ.data ?? [], [memosQ.data])

  const [query, setQuery] = useState('')
  const [tagFilter, setTagFilter] = useState<string>('all')
  // editing: Memo(기존 편집) | { _new: true }(신규) | null(닫힘)
  const [editing, setEditing] = useState<Memo | { _new: true } | null>(null)

  // 태그 칩: '전체' + 데이터에 존재하는 태그(카운트는 항상 전체 기준).
  const tagCounts = useMemo(() => {
    const m = new Map<string, number>()
    for (const memo of memos) {
      const t = memo.tag || DEFAULT_TAG
      m.set(t, (m.get(t) ?? 0) + 1)
    }
    return m
  }, [memos])

  // 정렬·필터: 검색 + 태그 → 핀 우선 → modifyAt desc.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return memos
      .filter(m => {
        if (tagFilter !== 'all' && (m.tag || DEFAULT_TAG) !== tagFilter) return false
        if (q) {
          const hay = `${m.title}\n${m.content ?? ''}`.toLowerCase()
          if (!hay.includes(q)) return false
        }
        return true
      })
      .sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
        return (b.modifyAt || '').localeCompare(a.modifyAt || '')
      })
  }, [memos, query, tagFilter])

  const pinned = filtered.filter(m => m.isPinned)
  const others = filtered.filter(m => !m.isPinned)

  const onSave = (values: MemoFormValues, id?: number) => {
    if (id != null) updateMemo.mutate({ id, data: values }, { onSuccess: () => setEditing(null) })
    else createMemo.mutate(values, { onSuccess: () => setEditing(null) })
  }
  const onDelete = (id: number) => {
    deleteMemo.mutate(id, { onSuccess: () => setEditing(null) })
  }

  const AddBtn = (
    <Button size="sm" onClick={() => setEditing({ _new: true })}>
      <Plus size={14} /> {t('newMemo')}
    </Button>
  )

  // ── 검색 바 — 전 검색 input canonical 통일 (header/매니저 검색과 동일 Input search 톤)
  const SearchCard = (
    <div style={MANAGER_LAYOUT.searchWrapStyle}>
      <Search size={14} style={MANAGER_LAYOUT.searchIconStyle} />
      <Input
        search
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder={t('search')}
        aria-label={t('search')}
        className="w-full min-w-0 pl-9 pr-8"
      />
      {query && (
        <button
          type="button"
          onClick={() => setQuery('')}
          aria-label={t('clearSearch')}
          style={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 0,
            background: 'transparent',
            color: 'var(--fg-tertiary)',
            cursor: 'pointer',
            padding: 2,
          }}
        >
          <X size={14} />
        </button>
      )}
    </div>
  )

  // ── 태그 칩 (단일선택 리스트 필터 — Tabs pills sm) ──
  const TagChips = (
    <Tabs
      value={tagFilter}
      onValueChange={v => v && setTagFilter(v)}
      style={{ display: 'flex', flexWrap: 'wrap' }}
    >
      <TabsList variant="pills" size="sm" style={{ flexWrap: 'wrap', gap: 6 }}>
        <TabsTrigger variant="pills" size="sm" value="all">
          {t('all')}
          <span style={{ opacity: tagFilter === 'all' ? 0.85 : 0.55, marginLeft: 2 }}>
            {memos.length}
          </span>
        </TabsTrigger>
        {[...tagCounts.entries()].map(([tag, count]) => {
          const active = tagFilter === tag
          return (
            <TabsTrigger key={tag} variant="pills" size="sm" value={tag}>
              {tag}
              <span style={{ opacity: active ? 0.85 : 0.55, marginLeft: 2 }}>{count}</span>
            </TabsTrigger>
          )
        })}
      </TabsList>
    </Tabs>
  )

  // ── 메모 카드 ──
  const MemoCard = (m: Memo) => {
    const tone = resolveTone(m.color)
    const tag = m.tag || DEFAULT_TAG
    return (
      <Card
        key={m.rowId}
        onClick={() => setEditing(m)}
        className="group/memo cursor-pointer transition-[transform,box-shadow] duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-out)] hover:-translate-y-[2px] hover:shadow-[var(--shadow-md)]"
        style={{
          background: tone.bg,
          // 앱 그리드(mainAxisExtent 168)와 동일한 고정 높이 — 카드 높이 균일.
          height: 168,
          padding: 18,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              background: tone.swatch,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: 'var(--text-badge)',
              fontWeight: '600',
              color: tone.fg,
              letterSpacing: '0.02em',
              flex: 1,
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {tag}
          </span>
          {/* 핀 마크는 고정 메모에만 — 비고정 카드 노이즈 제거 (고정 설정은 편집 다이얼로그). */}
          {m.isPinned && (
            <button
              type="button"
              aria-label={t('unpin')}
              onClick={ev => {
                ev.stopPropagation()
                togglePin.mutate(m.rowId)
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 4,
                border: 0,
                background: 'transparent',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <Pin size={13} strokeWidth={2.5} style={{ color: tone.swatch }} />
            </button>
          )}
        </div>
        <div
          style={{
            fontSize: 15,
            fontWeight: '700',
            color: 'var(--fg-primary)',
            letterSpacing: '-0.015em',
            lineHeight: 1.3,
            // 앱(maxLines 1)과 동일 — 제목 1줄 ellipsis.
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {m.title}
        </div>
        {m.content && (
          <div
            style={{
              fontSize: 12.5,
              color: 'var(--fg-secondary)',
              lineHeight: 1.45,
              whiteSpace: 'pre-wrap',
              display: '-webkit-box',
              // 고정 높이 168 안에서 깔끔히 떨어지는 3줄 (앱 렌더링과 동일 분량).
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              flex: 1,
              minHeight: 0,
            }}
          >
            {m.content}
          </div>
        )}
        <div
          style={{ fontSize: 11, color: 'var(--fg-tertiary)', marginTop: 'auto' }}
        >
          {formatStamp(m.modifyAt)}
        </div>
      </Card>
    )
  }

  const grid = (items: Memo[]) => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: mobile
          ? 'repeat(2, 1fr)'
          : 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: 12,
      }}
    >
      {items.map(MemoCard)}
    </div>
  )

  // ── 빈 상태 (검색 결과 없음 vs 메모 없음) ──
  const Empty = (
    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 999,
          background: 'var(--bg-sunken)',
          color: 'var(--fg-tertiary)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 14,
        }}
      >
        {query ? <SearchX size={24} /> : <StickyNote size={24} />}
      </div>
      <div style={{ fontSize: 15, fontWeight: '700', color: 'var(--fg-primary)' }}>
        {query ? t('noResults') : t('noMemos')}
      </div>
      <div style={{ fontSize: 13, color: 'var(--fg-tertiary)', marginTop: 4 }}>
        {query
          ? t('noResultsHint')
          : t('noMemosHint')}
      </div>
      {!query && (
        <div style={{ marginTop: 16 }}>
          <Button size="sm" onClick={() => setEditing({ _new: true })}>
            <Plus size={14} /> {t('newMemo')}
          </Button>
        </div>
      )}
    </div>
  )

  const Body =
    filtered.length === 0 ? (
      Empty
    ) : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: mobile ? 14 : 16 }}>
        {pinned.length > 0 && (
          <section>
            {/* 앱과 동일 — 모바일에서도 개수 표시. */}
            <SectionLabel icon="pin" label={`${t('pin')} · ${pinned.length}`} />
            {grid(pinned)}
          </section>
        )}
        {others.length > 0 && (
          <section>
            {pinned.length > 0 && (
              <SectionLabel icon="note" label={`${t('allMemosSection')} · ${others.length}`} />
            )}
            {grid(others)}
          </section>
        )}
      </div>
    )

  const dialog =
    editing != null ? (
      <MemoEditDialog
        memo={'_new' in editing ? null : editing}
        mobile={mobile}
        onClose={() => setEditing(null)}
        onSave={onSave}
        onDelete={onDelete}
        submitting={createMemo.isPending || updateMemo.isPending}
        deleting={deleteMemo.isPending}
      />
    ) : null

  if (mobile) {
    return (
      <>
        <MobileBackHeader title={t('title')} />
        <div style={{ padding: '16px 16px 96px', position: 'relative' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {SearchCard}
          {/* 칩 행 우측 끝 + 추가 — PresetManager 정렬 토글 행의 accent 추가 버튼 패턴 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
            }}
          >
            {TagChips}
            <Button
              type="button"
              variant="accent"
              style={{ padding: '7px 12px', fontSize: 'var(--text-label-sm)', flexShrink: 0 }}
              onClick={() => setEditing({ _new: true })}
            >
              <Plus size={14} /> {tc('add')}
            </Button>
          </div>
          {Body}
        </div>
        {/* FAB 제거 — 칩 행 우측 + 추가 버튼이 새 메모 진입점 */}
        {dialog}
        </div>
      </>
    )
  }

  return (
    <div style={{ padding: 0 }}>
      <div className="page__head" style={{ padding: '24px 28px 12px', margin: 0, maxWidth: 1320 }}>
        <div>
          <h1>{t('title')}</h1>
          <div className="sub">{t('subtitle')}</div>
        </div>
        <div className="right">{AddBtn}</div>
      </div>
      <div
        style={{
          padding: '0 28px 24px',
          maxWidth: 1320,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '420px 1fr',
            gap: 16,
            alignItems: 'center',
          }}
        >
          {SearchCard}
          {TagChips}
        </div>
        {Body}
      </div>
      {dialog}
    </div>
  )
}

// ───────────────────────────── 편집 다이얼로그 ─────────────────────────────

function MemoEditDialog({
  memo,
  mobile,
  onClose,
  onSave,
  onDelete,
  submitting,
  deleting,
}: {
  memo: Memo | null
  mobile: boolean
  onClose: () => void
  onSave: (values: MemoFormValues, id?: number) => void
  onDelete: (id: number) => void
  submitting?: boolean
  deleting?: boolean
}) {
  const { t } = useTranslation('memo')
  const { t: tc } = useTranslation('common')
  const isNew = !memo
  const [title, setTitle] = useState(memo?.title ?? '')
  const [content, setContent] = useState(memo?.content ?? '')
  const [tag, setTag] = useState(memo?.tag || DEFAULT_TAG)
  const [pinned, setPinned] = useState(memo?.isPinned ?? false)
  const [color, setColor] = useState(memo?.color || DEFAULT_COLOR)
  const [error, setError] = useState(false)

  const save = () => {
    if (!title.trim()) {
      setError(true)
      return
    }
    onSave(
      {
        title: title.trim(),
        content,
        tag,
        color,
        folderRowId: null,
      },
      memo?.rowId,
    )
  }

  const Footer = (
    <ModalFooter
      onSave={save}
      saveLabel={tc('save')}
      saving={submitting}
      onCancel={onClose}
      onDelete={memo ? () => onDelete(memo.rowId) : undefined}
      deleting={deleting}
    />
  )

  return (
    <ModalShell
      title={isNew ? t('newMemo') : t('editMemo')}
      onClose={onClose}
      size="md"
      footer={Footer}
      mobile={mobile}
    >
      <Field style={{ marginBottom: 14 }}>
        <Input
          value={title}
          onChange={e => {
            setTitle(e.target.value)
            if (error) setError(false)
          }}
          placeholder={t('titlePlaceholder')}
          aria-invalid={error}
          autoFocus
        />
        {error && (
          <div
            style={{
              marginTop: 12,
              padding: '8px 12px',
              background: 'var(--status-danger-subtle)',
              color: 'var(--status-danger-fg)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 13,
            }}
          >
            {t('titleRequired')}
          </div>
        )}
      </Field>

      <Field style={{ marginBottom: 14 }}>
        <Textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder={t('contentPlaceholder')}
          rows={8}
        />
      </Field>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          marginBottom: 14,
        }}
      >
        <Field>
          <FieldLabel>{t('tagLabel')}</FieldLabel>
          <Select value={tag} onValueChange={setTag}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TAG_OPTIONS.map(opt => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel>{t('pin')}</FieldLabel>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              minHeight: 'var(--touch-min, 44px)',
              cursor: 'pointer',
            }}
          >
            <Switch checked={pinned} onCheckedChange={setPinned} />
            <span style={{ fontSize: 14, color: 'var(--fg-primary)' }}>{t('pinToTop')}</span>
          </label>
        </Field>
      </div>

      <Field>
        <FieldLabel>{t('colorLabel')}</FieldLabel>
        <ColorSwatchGroup
          columns={5}
          value={color}
          onValueChange={v => v && setColor(v)}
          options={CAT_PALETTE.map(p => ({
            value: p.baseHex,
            bg: p.bg,
            fg: p.color,
            label: `${t('colorLabel')} ${p.baseHex}`,
          }))}
        />
      </Field>
    </ModalShell>
  )
}

// ───────────────────────────── 로딩 스켈레톤 ─────────────────────────────

/** 메모 카드 1장 skeleton — 톤 dot + 태그 + 제목 + 본문 라인 (실카드 168 고정 높이 동일). */
function MemoCardSkeleton() {
  return (
    <Card style={{ height: 168, padding: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <SkeletonBase className="h-2 w-2 rounded-full" />
        <SkeletonBase className="h-3 w-12" />
      </div>
      <SkeletonBase className="h-4 w-4/5" />
      <SkeletonBase className="h-3.5 w-full" />
      <SkeletonBase className="h-3.5 w-11/12" />
      <SkeletonBase className="h-3.5 w-2/3" />
      <SkeletonBase className="h-3 w-20 mt-auto" />
    </Card>
  )
}

/** Memo 페이지 구조 일치 skeleton — 검색카드 + 태그칩 + 카드 grid. */
function MemoPageSkeleton({ mobile }: { mobile: boolean }) {
  const { t } = useTranslation('memo')
  const Chips = (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonBase key={i} className="h-7 w-16 rounded-full" />
      ))}
    </div>
  )
  const Grid = (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: mobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: 12,
      }}
    >
      {Array.from({ length: mobile ? 4 : 6 }).map((_, i) => (
        <MemoCardSkeleton key={i} />
      ))}
    </div>
  )

  if (mobile) {
    return (
      <>
        <MobileBackHeader title={t('title')} />
        <div style={{ padding: '16px 16px 96px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <SkeletonBase className="h-9 w-full rounded-md" />
            {Chips}
            {Grid}
          </div>
        </div>
      </>
    )
  }
  return (
    <div style={{ padding: 0 }}>
      <div className="page__head" style={{ padding: '24px 28px 12px', margin: 0, maxWidth: 1320 }}>
        <div>
          <SkeletonBase className="h-8 w-20 mb-2" />
          <SkeletonBase className="h-4 w-36" />
        </div>
        <div className="right">
          <SkeletonBase className="h-8 w-24 rounded-md" />
        </div>
      </div>
      <div
        style={{
          padding: '0 28px 24px',
          maxWidth: 1320,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 16, alignItems: 'center' }}>
          <SkeletonBase className="h-9 w-full rounded-md" />
          {Chips}
        </div>
        {Grid}
      </div>
    </div>
  )
}
