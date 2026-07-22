import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Tag, Tags, Trash2 } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { ColorSwatchGroup } from '@/shared/ui/color-swatch'
import { ConfirmDialog, ModalShell } from '@/shared/ui/porest/dialogs'
import { ModalFooter } from '@/shared/ui/porest/modal-footer'
import { Field, FieldLabel } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { ManagerHead, ManagerShell } from '@/shared/ui/porest/manager-layout'
import { Skeleton as SkeletonBase } from '@/shared/ui/skeleton'
import { CAT_PALETTE, getPaletteByColor } from '@/shared/lib/porest/chart-palette'
import type { TodoTag } from '@/entities/todo-tag'
import {
  useCreateTodoTag,
  useDeleteTodoTag,
  useTodoTags,
  useUpdateTodoTag,
} from '@/features/todo-tag'
import { useTodos } from '@/features/todo'

type EditingState = TodoTag | { kind: 'new' } | null

// 모바일 카드 다이어트 — 리스트 셸: 모바일은 카드 없이, 데스크톱은 Card (.m-subpage 정합).
function ListShell({ mobile, children }: { mobile: boolean; children: React.ReactNode }) {
  return mobile ? <div>{children}</div> : <Card><CardContent style={{ padding: 0 }}>{children}</CardContent></Card>
}

/**
 * 할일 태그 관리 — 이름 + 색(tone) + 사용 건수. 할일 필터·태그 분포에 사용.
 * 디자인 SoT: settings-todo-tags.jsx TodoTagManager (구조는 CalendarLabelsSection 미러).
 */
export function TodoTagManager({ mobile }: { mobile: boolean }) {
  const { t } = useTranslation('todo')
  const { t: tc } = useTranslation('common')
  const { data: tags, isLoading } = useTodoTags()
  const todosQ = useTodos()
  const createMut = useCreateTodoTag()
  const updateMut = useUpdateTodoTag()
  const deleteMut = useDeleteTodoTag()

  const [editing, setEditing] = useState<EditingState>(null)
  const [confirmDelete, setConfirmDelete] = useState<TodoTag | null>(null)

  const list = useMemo(() => tags ?? [], [tags])
  const submitting = createMut.isPending || updateMut.isPending

  // 사용 건수 — 할 일 category(라벨 문자열) 클라 집계.
  const countByName = useMemo(() => {
    const map = new Map<string, number>()
    for (const todo of todosQ.data ?? []) {
      if (!todo.category) continue
      map.set(todo.category, (map.get(todo.category) ?? 0) + 1)
    }
    return map
  }, [todosQ.data])

  const onSave = (values: { tagName: string; color: string }) => {
    if (editing && 'rowId' in editing) {
      updateMut.mutate({ id: editing.rowId, data: values }, { onSuccess: () => setEditing(null) })
    } else {
      createMut.mutate(values, { onSuccess: () => setEditing(null) })
    }
  }
  const onDelete = (tag: TodoTag) => {
    deleteMut.mutate(tag.rowId, { onSuccess: () => setConfirmDelete(null) })
  }

  return (
    <>
      <ManagerShell className="!gap-[var(--spacing-2xl)]">
        {!mobile && (
          <ManagerHead
            title={t('tags.title')}
            description={t('tags.desc')}
            actions={
              <Button size="sm" onClick={() => setEditing({ kind: 'new' })}>
                <Plus size={14} strokeWidth={2.4} />{t('tags.new')}
              </Button>
            }
          />
        )}

        {/* 안내 카드 — 앱 PCard brand 정합 */}
        <Card variant="brand">
          <CardContent>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-brand)',
                  color: 'var(--fg-on-brand)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Tags size={18} strokeWidth={1.9} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 'var(--text-label-sm)', fontWeight: '700', color: 'var(--fg-primary)' }}>
                  {t('tags.title')}
                </div>
                <div
                  style={{
                    fontSize: 'var(--text-caption)',
                    color: 'var(--fg-secondary)',
                    marginTop: 2,
                    lineHeight: '1.5',
                  }}
                >
                  {t('tags.desc')}
                </div>
              </div>
              {mobile && (
                <Button size="sm" onClick={() => setEditing({ kind: 'new' })}>
                  <Plus size={14} strokeWidth={2.4} />{t('tags.new')}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 태그 리스트 */}
        <div>
          <div style={{ fontSize: 'var(--text-label-sm)', fontWeight: '700', color: 'var(--fg-primary)' }}>
            {t('tags.title')} · {list.length}
          </div>
          <ListShell mobile={mobile}>
            {isLoading ? (
              <TagListSkeleton />
            ) : list.length === 0 ? (
              <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--fg-tertiary)' }}>
                <Tags size={28} strokeWidth={1.6} style={{ opacity: 0.5 }} />
                <div
                  style={{
                    fontSize: 'var(--text-body-sm)',
                    fontWeight: '600',
                    marginTop: 8,
                    color: 'var(--fg-primary)',
                  }}
                >
                  {t('tags.empty')}
                </div>
                <div style={{ fontSize: 'var(--text-caption)', marginTop: 4 }}>
                  {t('tags.emptyHint', { label: `"${t('tags.new')}"` })}
                </div>
              </div>
            ) : (
              list.map((tag, i) => {
                const palette = getPaletteByColor(tag.color)
                const count = countByName.get(tag.tagName) ?? 0
                return (
                  <div
                    key={tag.rowId}
                    onClick={() => setEditing(tag)}
                    className="hover:bg-[var(--bg-muted)]"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      padding: '14px 8px',
                      borderTop: i === 0 ? 'none' : '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      transition: 'background var(--motion-duration-fast) var(--motion-ease-out)',
                    }}
                  >
                    <span
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 'var(--radius-md)',
                        background: palette.bg,
                        color: palette.color,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Tag size={16} strokeWidth={2} />
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 'var(--text-body-sm)',
                          fontWeight: '600',
                          color: 'var(--fg-primary)',
                          letterSpacing: '-0.01em',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {tag.tagName}
                      </div>
                      <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', marginTop: 2 }}>
                        {t('tags.usage', { count })}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="!text-[var(--fg-expense)]"
                      aria-label={tc('delete')}
                      onClick={e => {
                        e.stopPropagation()
                        setConfirmDelete(tag)
                      }}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                )
              })
            )}
          </ListShell>
        </div>
      </ManagerShell>

      {editing && (
        <TagEditDialog
          tag={editing && 'rowId' in editing ? editing : null}
          onClose={() => setEditing(null)}
          onSave={onSave}
          mobile={mobile}
          submitting={submitting}
        />
      )}
      {confirmDelete && (
        <ConfirmDialog
          title={t('tags.deleteTitle', { name: confirmDelete.tagName })}
          message={t('tags.deleteMessage', { count: countByName.get(confirmDelete.tagName) ?? 0 })}
          confirmLabel={tc('delete')}
          danger
          loading={deleteMut.isPending}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => onDelete(confirmDelete)}
        />
      )}
    </>
  )
}

function TagListSkeleton() {
  return (
    <>
      {[0, 1, 2].map(i => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '14px 8px',
            borderTop: i === 0 ? 'none' : '1px solid var(--border-subtle)',
          }}
        >
          <SkeletonBase className="h-8 w-8 rounded-md shrink-0" />
          <div style={{ flex: 1 }}>
            <SkeletonBase className="h-4 w-24 mb-1.5" />
            <SkeletonBase className="h-3 w-32" />
          </div>
        </div>
      ))}
    </>
  )
}

function TagEditDialog({
  tag,
  onClose,
  onSave,
  mobile,
  submitting,
}: {
  tag: TodoTag | null
  onClose: () => void
  onSave: (values: { tagName: string; color: string }) => void
  mobile: boolean
  submitting?: boolean
}) {
  const { t } = useTranslation('todo')
  const { t: tc } = useTranslation('common')
  const isNew = !tag
  const [name, setName] = useState(tag?.tagName ?? '')
  const [paletteIdx, setPaletteIdx] = useState(() => {
    if (!tag?.color) return 0
    const idx = CAT_PALETTE.findIndex(p => p.baseHex === tag.color)
    return idx >= 0 ? idx : 0
  })
  const [touched, setTouched] = useState(false)

  const palette = CAT_PALETTE[paletteIdx]!
  const nameTrim = name.trim()
  const valid = nameTrim.length > 0 && nameTrim.length <= 12
  const err =
    touched && !valid
      ? nameTrim.length === 0
        ? t('tags.nameRequired')
        : t('tags.nameTooLong')
      : null

  const save = () => {
    setTouched(true)
    if (!valid) return
    onSave({ tagName: nameTrim, color: palette.baseHex })
  }

  const Footer = (
    <ModalFooter
      onSave={save}
      saveLabel={isNew ? t('tags.new') : tc('save')}
      saving={submitting}
      saveDisabled={touched && !valid}
      onCancel={onClose}
    />
  )

  return (
    <ModalShell
      title={isNew ? t('tags.new') : t('tags.editTitle')}
      onClose={onClose}
      size="md"
      footer={Footer}
      mobile={mobile}
    >
      {/* 미리보기 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: 14,
          background: palette.bg,
          borderRadius: 'var(--radius-tile)',
          marginBottom: 20,
        }}
      >
        <span
          style={{
            width: 40,
            height: 40,
            borderRadius: 'var(--radius-md)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            background: palette.color,
            color: 'var(--fg-on-brand)',
          }}
        >
          <Tag size={18} strokeWidth={2} />
        </span>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 'var(--text-badge)',
              color: palette.color,
              fontWeight: '600',
              letterSpacing: '0.02em',
            }}
          >
            {t('tags.preview')}
          </div>
          <div
            style={{
              fontSize: 'var(--text-body-lg)',
              fontWeight: '700',
              color: palette.color,
              letterSpacing: '-0.01em',
            }}
          >
            {nameTrim || t('tags.new')}
          </div>
        </div>
      </div>

      <Field style={{ marginBottom: 14 }}>
        <FieldLabel>{t('tags.name')}</FieldLabel>
        <Input
          aria-invalid={!!err}
          value={name}
          onChange={e => {
            setName(e.target.value)
            setTouched(true)
          }}
          placeholder={t('tags.namePlaceholder')}
          maxLength={14}
          autoFocus
        />
        <div
          style={{
            fontSize: 'var(--text-badge)',
            color: 'var(--fg-tertiary)',
            marginTop: 4,
            textAlign: 'right',
          }}
        >
          {err ? <span style={{ color: 'var(--fg-expense)' }}>{err}</span> : <span>{nameTrim.length}/12</span>}
        </div>
      </Field>

      <Field>
        <FieldLabel>{t('tags.color')}</FieldLabel>
        <ColorSwatchGroup
          columns={5}
          value={String(paletteIdx)}
          onValueChange={v => setPaletteIdx(Number(v))}
          options={CAT_PALETTE.map((p, i) => ({
            value: String(i),
            bg: p.bg,
            fg: p.color,
            label: t('tags.colorN', { n: i + 1 }),
          }))}
        />
      </Field>
    </ModalShell>
  )
}
