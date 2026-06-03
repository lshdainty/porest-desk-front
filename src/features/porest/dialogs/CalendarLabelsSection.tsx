import { useMemo, useState } from 'react'
import { Plus, Tag, Trash2 } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { ColorSwatchGroup } from '@/shared/ui/color-swatch'
import { ConfirmDialog, ModalShell } from '@/shared/ui/porest/dialogs'
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

export function CalendarLabelsSection({ mobile }: { mobile: boolean }) {
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
      <ManagerShell>
        {!mobile && (
          <ManagerHead
            title="캘린더 라벨"
            description="모든 캘린더에서 공용으로 사용되는 라벨이에요. 일정 등록 시 선택할 수 있어요."
            actions={
              <Button size="sm" onClick={() => setEditing({ kind: 'new' })}>
                <Plus size={14} strokeWidth={2.4} />새 라벨
              </Button>
            }
          />
        )}

        {/* 안내 카드 */}
        <Card style={{ background: 'var(--bg-brand-subtle)' }}>
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
                    fontSize: 'var(--text-body-md)',
                    fontWeight: '700',
                    color: 'var(--fg-primary)',
                  }}
                >
                  캘린더 라벨
                </div>
                <div
                  style={{
                    fontSize: 'var(--text-caption)',
                    color: 'var(--fg-secondary)',
                    marginTop: 2,
                    lineHeight: '1.5',
                  }}
                >
                  일정에 라벨을 붙여 한눈에 분류할 수 있어요.
                </div>
              </div>
              {mobile && (
                <Button size="sm" onClick={() => setEditing({ kind: 'new' })}>
                  <Plus size={14} strokeWidth={2.4} />새 라벨
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 전체 라벨 리스트 */}
        <div>
          <div
            style={{
              fontSize: 'var(--text-body-md)',
              fontWeight: '700',
              color: 'var(--fg-primary)',
              padding: '4px 4px 10px',
            }}
          >
            전체 라벨 · {list.length}
          </div>
          <Card>
            <CardContent style={{ padding: 0 }}>
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
                    라벨이 없어요
                  </div>
                  <div style={{ fontSize: 'var(--text-caption)', marginTop: 4 }}>
                    "새 라벨" 버튼으로 만들어보세요
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
                        padding: '14px 16px',
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
                            fontSize: 'var(--text-body-md)',
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
                      <Button
                        variant="ghost"
                        size="icon"
                        className="!text-[var(--fg-expense)]"
                        aria-label="삭제"
                        onClick={(e) => {
                          e.stopPropagation()
                          setConfirmDelete(label)
                        }}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
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
          title="라벨 삭제"
          message={`"${confirmDelete.labelName}" 라벨을 삭제하시겠어요? 이 라벨이 지정된 일정은 라벨 없음 상태가 됩니다.`}
          confirmLabel="삭제"
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
            padding: '14px 16px',
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
        ? '라벨 이름을 입력해주세요.'
        : '이름은 12자 이내로 입력해 주세요.'
      : null

  const save = () => {
    setTouched(true)
    if (!valid) return
    onSave({ labelName: nameTrim, color: palette.baseHex })
  }

  const Footer = (
    <>
      <Button variant="ghost" onClick={onClose} disabled={submitting}>
        취소
      </Button>
      <Button onClick={save} disabled={touched && !valid} loading={submitting}>
        {isNew ? '추가' : '저장'}
      </Button>
    </>
  )

  return (
    <ModalShell
      title={isNew ? '새 라벨' : '라벨 편집'}
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
            미리보기
          </div>
          <div
            style={{
              fontSize: 'var(--text-body-lg)',
              fontWeight: '700',
              color: palette.color,
              letterSpacing: '-0.01em',
            }}
          >
            {nameTrim || '새 라벨'}
          </div>
        </div>
      </div>

      <Field style={{ marginBottom: 14 }}>
        <FieldLabel>이름</FieldLabel>
        <Input
          aria-invalid={!!err}
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setTouched(true)
          }}
          placeholder="예: 중요, 마감일, 회의"
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
        <FieldLabel>색상</FieldLabel>
        <ColorSwatchGroup
          columns={5}
          value={String(paletteIdx)}
          onValueChange={(v) => setPaletteIdx(Number(v))}
          options={CAT_PALETTE.map((p, i) => ({
            value: String(i),
            bg: p.bg,
            fg: p.color,
            label: `색상 ${i + 1}`,
          }))}
        />
      </Field>
    </ModalShell>
  )
}
