import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronRight, Plus, Tag, Trash2 } from 'lucide-react'
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
import type { EventLabel } from '@/entities/event-label'
import {
  useCreateEventLabel,
  useDeleteEventLabel,
  useEventLabels,
  useUpdateEventLabel,
} from '@/features/event-label'

type EditingState = EventLabel | { kind: 'new' } | null

// 모바일 카드 다이어트 — 리스트 셸: 모바일은 카드 없이, 데스크톱은 Card (.m-subpage 정합).
function ListShell({ mobile, children }: { mobile: boolean; children: React.ReactNode }) {
  return mobile ? <div>{children}</div> : <Card><CardContent style={{ padding: 0 }}>{children}</CardContent></Card>
}

export function CalendarLabelsSection({ mobile }: { mobile: boolean }) {
  const { t } = useTranslation('calendar')
  const { data: labels, isLoading } = useEventLabels()
  const createMut = useCreateEventLabel()
  const updateMut = useUpdateEventLabel()
  const deleteMut = useDeleteEventLabel()

  const [editing, setEditing] = useState<EditingState>(null)
  const [confirmDelete, setConfirmDelete] = useState<EventLabel | null>(null)

  const list = useMemo(() => labels ?? [], [labels])
  const submitting = createMut.isPending || updateMut.isPending

  const onSave = (values: { labelName: string; color: string }) => {
    if (editing && 'rowId' in editing) {
      updateMut.mutate(
        { id: editing.rowId, data: values },
        { onSuccess: () => setEditing(null) },
      )
    } else {
      createMut.mutate(values, { onSuccess: () => setEditing(null) })
    }
  }

  const onDelete = (label: EventLabel) => {
    deleteMut.mutate(label.rowId, { onSuccess: () => setConfirmDelete(null) })
  }

  return (
    <>
      {/* 설정 서브페이지 섹션 간격 spacing-2xl(32) 통일 — 기본 gap-4(16) override */}
      <ManagerShell className="!gap-[var(--spacing-2xl)]">
        {!mobile && (
          <ManagerHead
            title={t('labelsSection.title')}
            description={t('labelsSection.description')}
            actions={
              <Button size="sm" onClick={() => setEditing({ kind: 'new' })}>
                <Plus size={14} strokeWidth={2.4} />{t('newLabel')}
              </Button>
            }
          />
        )}

        {/* 안내 카드 */}
        {/* 앱 PCard brand 정합(사용자 결정) — subtle 채움 + border-brand 테두리 */}
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
                <Tag size={18} strokeWidth={1.9} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 'var(--text-label-sm)',
                    fontWeight: '700',
                    color: 'var(--fg-primary)',
                  }}
                >
                  {t('labelsSection.title')}
                </div>
                <div
                  style={{
                    fontSize: 'var(--text-caption)',
                    color: 'var(--fg-secondary)',
                    marginTop: 2,
                    lineHeight: '1.5',
                  }}
                >
                  {t('labelsSection.infoDesc')}
                </div>
              </div>
              {mobile && (
                <Button size="sm" onClick={() => setEditing({ kind: 'new' })}>
                  <Plus size={14} strokeWidth={2.4} />{t('newLabel')}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 전체 라벨 리스트 */}
        <div>
          <div
            style={{
              // 섹션 라벨 — 캘린더 관리·공유("내 캘린더 · N")와 동일: label-sm(13, 앱 bodySm)/700.
              fontSize: 'var(--text-label-sm)',
              fontWeight: '700',
              color: 'var(--fg-primary)',
            }}
          >
            {t('labelsSection.allLabels')} · {list.length}
          </div>
          {/* 모바일 카드 다이어트 — 리스트 셸 카드 벗김 (.m-subpage) */}
          <ListShell mobile={mobile}>
              {isLoading ? (
                <LabelListSkeleton />
              ) : list.length === 0 ? (
                <div
                  style={{
                    padding: '40px 16px',
                    textAlign: 'center',
                    color: 'var(--fg-tertiary)',
                  }}
                >
                  <Tag size={28} strokeWidth={1.6} style={{ opacity: 0.5 }} />
                  <div
                    style={{
                      fontSize: 'var(--text-body-sm)',
                      fontWeight: '600',
                      marginTop: 8,
                      color: 'var(--fg-primary)',
                    }}
                  >
                    {t('noLabels')}
                  </div>
                  <div style={{ fontSize: 'var(--text-caption)', marginTop: 4 }}>
                    {t('labelsSection.emptyHint', { label: `"${t('newLabel')}"` })}
                  </div>
                </div>
              ) : (
                list.map((label, i) => {
                  const palette = getPaletteByColor(label.color)
                  return (
                    <div
                      key={label.rowId}
                      onClick={() => setEditing(label)}
                      className="hover:bg-[var(--bg-muted)]"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        padding: '14px 8px',
                        borderTop: i === 0 ? 'none' : '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        transition:
                          'background var(--motion-duration-fast) var(--motion-ease-out)',
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
                          {label.labelName}
                        </div>
                      </div>
                      {/* 삭제+편집 진입 표시 — 한 묶음(행 gap 미적용, 앱 정합) */}
                      <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="!text-[var(--fg-expense)]"
                          aria-label={t('delete')}
                          onClick={(e) => {
                            e.stopPropagation()
                            setConfirmDelete(label)
                          }}
                        >
                          <Trash2 size={14} />
                        </Button>
                        <ChevronRight size={15} style={{ color: 'var(--fg-tertiary)' }} />
                      </div>
                    </div>
                  )
                })
              )}
          </ListShell>
        </div>
      </ManagerShell>

      {editing && (
        <LabelEditDialog
          label={editing && 'rowId' in editing ? editing : null}
          onClose={() => setEditing(null)}
          onSave={onSave}
          mobile={mobile}
          submitting={submitting}
        />
      )}
      {confirmDelete && (
        <ConfirmDialog
          title={t('labelsSection.deleteTitle')}
          message={t('labelsSection.deleteMessage', { name: `"${confirmDelete.labelName}"` })}
          confirmLabel={t('delete')}
          danger
          loading={deleteMut.isPending}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => onDelete(confirmDelete)}
        />
      )}
    </>
  )
}

function LabelListSkeleton() {
  return (
    <>
      {[0, 1, 2].map((i) => (
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
          <SkeletonBase className="h-4 w-32" />
        </div>
      ))}
    </>
  )
}

function LabelEditDialog({
  label,
  onClose,
  onSave,
  mobile,
  submitting,
}: {
  label: EventLabel | null
  onClose: () => void
  onSave: (values: { labelName: string; color: string }) => void
  mobile: boolean
  submitting?: boolean
}) {
  const { t } = useTranslation('calendar')
  const { t: tCommon } = useTranslation('common')
  const isNew = !label
  const [name, setName] = useState(label?.labelName ?? '')
  const [paletteIdx, setPaletteIdx] = useState(() => {
    if (!label?.color) return 0
    const idx = CAT_PALETTE.findIndex((p) => p.baseHex === label.color)
    return idx >= 0 ? idx : 0
  })
  const [touched, setTouched] = useState(false)

  const palette = CAT_PALETTE[paletteIdx]!
  const nameTrim = name.trim()
  const valid = nameTrim.length > 0 && nameTrim.length <= 12
  const err =
    touched && !valid
      ? nameTrim.length === 0
        ? t('labelsSection.nameRequired')
        : t('labelsSection.nameTooLong')
      : null

  const save = () => {
    setTouched(true)
    if (!valid) return
    onSave({ labelName: nameTrim, color: palette.baseHex })
  }

  const Footer = (
    <ModalFooter
      onSave={save}
      saveLabel={isNew ? t('add') : tCommon('save')}
      saving={submitting}
      saveDisabled={touched && !valid}
      onCancel={onClose}
    />
  )

  return (
    <ModalShell
      title={isNew ? t('newLabel') : t('editLabel')}
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
            {t('preview')}
          </div>
          <div
            style={{
              fontSize: 'var(--text-body-lg)',
              fontWeight: '700',
              color: palette.color,
              letterSpacing: '-0.01em',
            }}
          >
            {nameTrim || t('newLabel')}
          </div>
        </div>
      </div>

      <Field style={{ marginBottom: 14 }}>
        <FieldLabel>{t('name')}</FieldLabel>
        <Input
          aria-invalid={!!err}
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setTouched(true)
          }}
          placeholder={t('labelsSection.namePlaceholder')}
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
          {err ? (
            <span style={{ color: 'var(--fg-expense)' }}>{err}</span>
          ) : (
            <span>{nameTrim.length}/12</span>
          )}
        </div>
      </Field>

      <Field>
        <FieldLabel>{t('form.color')}</FieldLabel>
        <ColorSwatchGroup
          columns={5}
          value={String(paletteIdx)}
          onValueChange={(v) => setPaletteIdx(Number(v))}
          options={CAT_PALETTE.map((p, i) => ({
            value: String(i),
            bg: p.bg,
            fg: p.color,
            label: t('labelsSection.colorN', { n: i + 1 }),
          }))}
        />
      </Field>
    </ModalShell>
  )
}
