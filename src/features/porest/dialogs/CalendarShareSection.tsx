import { useMemo, useState } from 'react'
import {
  ChevronRight,
  Copy,
  Crown,
  Eye,
  LogIn,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { Card, CardContent } from '@/shared/ui/card'
import { ConfirmDialog, ModalShell } from '@/shared/ui/porest/dialogs'
import { Field, FieldLabel } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { Textarea } from '@/shared/ui/textarea'
import { ManagerHead, ManagerShell } from '@/shared/ui/porest/manager-layout'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { Skeleton as SkeletonBase } from '@/shared/ui/skeleton'
import { getPaletteByColor, CHART_PAIRS } from '@/shared/lib/porest/chart-palette'
import { useCurrentUser } from '@/features/user'
import {
  useChangeMemberRole,
  useCreateGroup,
  useDeleteGroup,
  useGroup,
  useGroups,
  useJoinGroup,
  useRegenerateInviteCode,
  useRemoveMember,
} from '@/features/group'
import type {
  GroupMember,
  GroupRole,
  UserGroup,
} from '@/entities/group'

const ROLE_ICON: Record<GroupRole, typeof Crown> = {
  OWNER: Crown,
  EDIT: Pencil,
  READ: Eye,
}

const ROLE_LABEL: Record<GroupRole, string> = {
  OWNER: '소유자',
  EDIT: '편집 가능',
  READ: '읽기 전용',
}

// 권한 배지 — badge.md "같은 카테고리는 한 style(outline)" 규칙: 색만 분기.
const ROLE_BADGE_VARIANT: Record<GroupRole, 'outline-info' | 'outline-success' | 'outline'> = {
  OWNER: 'outline-info',
  EDIT: 'outline-success',
  READ: 'outline',
}

// 멤버 아바타 — 권한 색 톤 (소유자 info / 편집 success / 읽기 neutral).
const ROLE_AVATAR: Record<GroupRole, { bg: string; fg: string }> = {
  OWNER: { bg: 'color-mix(in srgb, var(--color-info) 14%, transparent)', fg: 'var(--color-info)' },
  EDIT: { bg: 'color-mix(in srgb, var(--color-success) 14%, transparent)', fg: 'var(--color-success)' },
  READ: { bg: 'var(--bg-sunken)', fg: 'var(--fg-tertiary)' },
}

export function CalendarShareSection({ mobile }: { mobile: boolean }) {
  const { data: groups, isLoading } = useGroups()
  const createMut = useCreateGroup()
  const deleteMut = useDeleteGroup()
  const joinMut = useJoinGroup()

  const [managingId, setManagingId] = useState<number | null>(null)
  const [creating, setCreating] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<UserGroup | null>(null)
  const [inviteCode, setInviteCode] = useState('')

  const list = useMemo(() => groups ?? [], [groups])

  const handleJoin = () => {
    const code = inviteCode.trim()
    if (!code) return
    joinMut.mutate(code, {
      onSuccess: () => {
        setInviteCode('')
        toast.success('캘린더에 참여했어요', { id: 'cal-join-success' })
      },
    })
  }

  const handleDelete = (group: UserGroup) => {
    deleteMut.mutate(group.rowId, {
      onSuccess: () => {
        setConfirmDelete(null)
        if (managingId === group.rowId) setManagingId(null)
        toast.success('캘린더를 삭제했어요', { id: 'cal-delete-success' })
      },
    })
  }

  return (
    <>
      <ManagerShell>
        {!mobile && (
          <ManagerHead
            title="캘린더 관리·공유"
            description="여러 캘린더를 만들고 가족·친구를 초대해 일정을 함께 관리할 수 있어요."
            actions={
              <Button onClick={() => setCreating(true)}>
                <Plus size={14} strokeWidth={2.4} />새 캘린더
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
                <Users size={18} strokeWidth={1.9} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 'var(--text-body-md)',
                    fontWeight: '700',
                    color: 'var(--fg-primary)',
                  }}
                >
                  가족·친구와 일정 공유
                </div>
                <div
                  style={{
                    fontSize: 'var(--text-caption)',
                    color: 'var(--fg-secondary)',
                    marginTop: 2,
                    lineHeight: '1.5',
                  }}
                >
                  여러 캘린더를 만들고 멤버를 초대해 함께 일정을 관리해요.
                </div>
              </div>
              {mobile && (
                <Button size="sm" onClick={() => setCreating(true)}>
                  <Plus size={14} strokeWidth={2.4} />새 캘린더
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 내 공유 리스트 */}
        <div>
          <div
            style={{
              fontSize: 'var(--text-body-md)',
              fontWeight: '700',
              color: 'var(--fg-primary)',
              padding: '4px 4px 10px',
            }}
          >
            내 공유 · {list.length}
          </div>
          <Card>
            <CardContent style={{ padding: 0 }}>
              {isLoading ? (
                <ShareListSkeleton />
              ) : list.length === 0 ? (
                <div
                  style={{
                    padding: '40px 16px',
                    textAlign: 'center',
                    color: 'var(--fg-tertiary)',
                  }}
                >
                  <Users size={28} strokeWidth={1.6} style={{ opacity: 0.5 }} />
                  <div
                    style={{
                      fontSize: 'var(--text-body-sm)',
                      fontWeight: '600',
                      marginTop: 8,
                      color: 'var(--fg-primary)',
                    }}
                  >
                    공유 중인 캘린더가 없어요
                  </div>
                  <div style={{ fontSize: 'var(--text-caption)', marginTop: 4 }}>
                    "새 캘린더"를 만들거나 초대 코드로 참여해보세요
                  </div>
                </div>
              ) : (
                list.map((group, i) => {
                  const pal = getPaletteByColor(group.color ?? group.groupTypeColor)
                  return (
                  <div
                    key={group.rowId}
                    onClick={() => setManagingId(group.rowId)}
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
                        background: pal.bg,
                        color: pal.color,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Users size={16} strokeWidth={2} />
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
                        {group.groupName}
                      </div>
                      <div
                        style={{
                          fontSize: 'var(--text-caption)',
                          color: 'var(--fg-tertiary)',
                          marginTop: 2,
                        }}
                      >
                        멤버 {group.memberCount}명
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setManagingId(group.rowId)
                      }}
                    >
                      관리
                    </Button>
                    <ChevronRight
                      size={16}
                      style={{ color: 'var(--fg-tertiary)', flexShrink: 0 }}
                    />
                  </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* 초대 코드로 참여 */}
        <div>
          <div
            style={{
              fontSize: 'var(--text-body-md)',
              fontWeight: '700',
              color: 'var(--fg-primary)',
              padding: '4px 4px 10px',
            }}
          >
            초대 코드로 참여
          </div>
          <Card>
            <CardContent>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                <Field style={{ flex: 1, minWidth: 0 }}>
                  <FieldLabel>초대 코드</FieldLabel>
                  <Input
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleJoin()
                    }}
                    placeholder="공유받은 초대 코드를 입력하세요"
                  />
                </Field>
                <Button
                  onClick={handleJoin}
                  disabled={!inviteCode.trim()}
                  loading={joinMut.isPending}
                >
                  <LogIn size={14} strokeWidth={2.2} />참여
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </ManagerShell>

      {managingId != null && (
        <ShareManageDialog
          groupId={managingId}
          onClose={() => setManagingId(null)}
          onRequestDelete={(g) => {
            setConfirmDelete(g)
          }}
          mobile={mobile}
        />
      )}

      {creating && (
        <CalendarCreateDialog
          onClose={() => setCreating(false)}
          onCreate={(values, onDone) =>
            createMut.mutate(values, {
              onSuccess: () => {
                onDone()
                toast.success('캘린더를 만들었어요', { id: 'cal-create-success' })
              },
            })
          }
          submitting={createMut.isPending}
          mobile={mobile}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="캘린더 삭제"
          message={`"${confirmDelete.groupName}" 캘린더를 삭제하시겠어요? 모든 멤버에게서 접근 권한이 사라지고 이 캘린더의 공유 일정이 삭제됩니다.`}
          confirmLabel="영구 삭제"
          danger
          loading={deleteMut.isPending}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => handleDelete(confirmDelete)}
        />
      )}
    </>
  )
}

function ShareListSkeleton() {
  return (
    <>
      {[0, 1].map((i) => (
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
          <div style={{ flex: 1 }}>
            <SkeletonBase className="h-4 w-32 mb-1.5" />
            <SkeletonBase className="h-3 w-16" />
          </div>
        </div>
      ))}
    </>
  )
}

function ShareManageDialog({
  groupId,
  onClose,
  onRequestDelete,
  mobile,
}: {
  groupId: number
  onClose: () => void
  onRequestDelete: (group: UserGroup) => void
  mobile: boolean
}) {
  const { data: detail, isLoading } = useGroup(groupId)
  const { data: currentUser } = useCurrentUser()
  const regenMut = useRegenerateInviteCode()
  const removeMut = useRemoveMember()
  const roleMut = useChangeMemberRole()

  const myMember = detail?.members.find(
    (m) => m.userRowId === currentUser?.rowId,
  )
  const isOwner = myMember?.role === 'OWNER'

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      toast.success('초대 코드를 복사했어요', { id: 'cal-code-copy' })
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = code
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      toast.success('초대 코드를 복사했어요', { id: 'cal-code-copy' })
    }
  }

  const handleRegenerate = () => {
    regenMut.mutate(groupId, {
      onSuccess: () =>
        toast.success('초대 코드를 새로 만들었어요', { id: 'cal-code-regen' }),
    })
  }

  const handleRemove = (member: GroupMember) => {
    removeMut.mutate(
      { groupId, memberId: member.rowId },
      {
        onSuccess: () =>
          toast.success('멤버를 제거했어요', { id: 'cal-member-remove' }),
      },
    )
  }

  const handleChangeRole = (member: GroupMember, role: GroupRole) => {
    roleMut.mutate(
      { groupId, memberId: member.rowId, role },
      {
        onSuccess: () =>
          toast.success('권한을 변경했어요', { id: 'cal-role-change' }),
      },
    )
  }

  const Footer = (
    <>
      {isOwner && detail && (
        <Button
          variant="ghost"
          onClick={() => {
            onRequestDelete({
              rowId: detail.rowId,
              groupName: detail.groupName,
              description: detail.description,
              groupTypeId: detail.groupTypeId,
              groupTypeName: detail.groupTypeName,
              groupTypeColor: detail.groupTypeColor,
              color: detail.color,
              inviteCode: detail.inviteCode,
              memberCount: detail.members.length,
              createAt: detail.createAt,
            })
            onClose()
          }}
          style={{ color: 'var(--fg-expense)', marginRight: 'auto' }}
        >
          <Trash2 size={14} />캘린더 삭제
        </Button>
      )}
      <Button variant="ghost" onClick={onClose}>
        닫기
      </Button>
    </>
  )

  return (
    <ModalShell
      title={detail ? `${detail.groupName} · 멤버 관리` : '멤버 관리'}
      onClose={onClose}
      size="md"
      footer={Footer}
      mobile={mobile}
    >
      {isLoading || !detail ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <SkeletonBase className="h-16 w-full rounded-md" />
          <SkeletonBase className="h-12 w-full rounded-md" />
          <SkeletonBase className="h-12 w-full rounded-md" />
        </div>
      ) : (
        <>
          {/* 초대 코드 */}
          <Field style={{ marginBottom: 18 }}>
            <FieldLabel>초대 코드</FieldLabel>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Input value={detail.inviteCode} readOnly style={{ flex: 1, minWidth: 0 }} />
              <Button
                variant="outline"
                size="icon"
                aria-label="초대 코드 복사"
                onClick={() => handleCopyCode(detail.inviteCode)}
              >
                <Copy size={14} />
              </Button>
              {isOwner && (
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="초대 코드 재생성"
                  onClick={handleRegenerate}
                  loading={regenMut.isPending}
                >
                  {!regenMut.isPending && <RefreshCw size={14} />}
                </Button>
              )}
            </div>
            <div
              style={{
                fontSize: 'var(--text-badge)',
                color: 'var(--fg-tertiary)',
                marginTop: 6,
              }}
            >
              이 코드를 공유하면 다른 사람이 캘린더에 참여할 수 있어요.
            </div>
          </Field>

          {/* 멤버 리스트 */}
          <div
            style={{
              fontSize: 'var(--text-badge)',
              fontWeight: '700',
              color: 'var(--fg-tertiary)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginBottom: 8,
              paddingLeft: 4,
            }}
          >
            멤버 · {detail.members.length}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {detail.members.map((member, i) => {
              const RoleIcon = ROLE_ICON[member.role]
              const isSelf = member.userRowId === currentUser?.rowId
              const canManage = isOwner && member.role !== 'OWNER' && !isSelf
              return (
                <div
                  key={member.rowId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 4px',
                    borderTop: i === 0 ? 'none' : '1px solid var(--border-subtle)',
                  }}
                >
                  <span
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 'var(--radius-pill)',
                      background: ROLE_AVATAR[member.role].bg,
                      color: ROLE_AVATAR[member.role].fg,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <RoleIcon size={16} strokeWidth={2} />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 'var(--text-body-md)',
                        fontWeight: '600',
                        color: 'var(--fg-primary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {member.userName}
                      {isSelf && (
                        <span
                          style={{ color: 'var(--fg-tertiary)', fontWeight: '500' }}
                        >
                          {' '}
                          (나)
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: 'var(--text-caption)',
                        color: 'var(--fg-tertiary)',
                        marginTop: 2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {member.userEmail}
                    </div>
                  </div>
                  {canManage ? (
                    <>
                      <Select
                        value={member.role}
                        onValueChange={(v) =>
                          handleChangeRole(member, v as GroupRole)
                        }
                        disabled={roleMut.isPending}
                      >
                        <SelectTrigger className="h-8 w-28 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EDIT">{ROLE_LABEL.EDIT}</SelectItem>
                          <SelectItem value="READ">{ROLE_LABEL.READ}</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="!text-[var(--fg-expense)]"
                        aria-label="멤버 제거"
                        onClick={() => handleRemove(member)}
                        loading={removeMut.isPending}
                      >
                        {!removeMut.isPending && <Trash2 size={14} />}
                      </Button>
                    </>
                  ) : (
                    <Badge
                      variant={ROLE_BADGE_VARIANT[member.role]}
                      style={{ flexShrink: 0 }}
                    >
                      <RoleIcon size={11} strokeWidth={2.2} />
                      {ROLE_LABEL[member.role]}
                    </Badge>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </ModalShell>
  )
}

function CalendarCreateDialog({
  onClose,
  onCreate,
  submitting,
  mobile,
}: {
  onClose: () => void
  onCreate: (
    values: { groupName: string; description?: string; color?: string },
    onDone: () => void,
  ) => void
  submitting?: boolean
  mobile: boolean
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('#2c70bf') // 기본 blue (chart blue)
  const [touched, setTouched] = useState(false)

  const nameTrim = name.trim()
  const valid = nameTrim.length > 0
  const err = touched && !valid ? '캘린더 이름을 입력해주세요.' : null

  const save = () => {
    setTouched(true)
    if (!valid) return
    onCreate(
      {
        groupName: nameTrim,
        description: description.trim() || undefined,
        color,
      },
      onClose,
    )
  }

  const Footer = (
    <>
      <Button variant="ghost" onClick={onClose} disabled={submitting}>
        취소
      </Button>
      <Button onClick={save} disabled={touched && !valid} loading={submitting}>
        만들기
      </Button>
    </>
  )

  return (
    <ModalShell
      title="새 캘린더"
      onClose={onClose}
      size="md"
      footer={Footer}
      mobile={mobile}
    >
      <Field style={{ marginBottom: 14 }}>
        <FieldLabel>이름</FieldLabel>
        <Input
          aria-invalid={!!err}
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setTouched(true)
          }}
          placeholder="예: 가족, 업무, 운동 일정"
          autoFocus
        />
        {err && (
          <div
            style={{
              fontSize: 'var(--text-badge)',
              color: 'var(--fg-expense)',
              marginTop: 4,
            }}
          >
            {err}
          </div>
        )}
      </Field>

      <Field style={{ marginBottom: 14 }}>
        <FieldLabel>색상</FieldLabel>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingTop: 2 }}>
          {CHART_PAIRS.map((p) => {
            const selected = color === p.base
            return (
              <button
                key={p.key}
                type="button"
                aria-label={`색상 ${p.key}`}
                onClick={() => setColor(p.base)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 'var(--radius-pill)',
                  background: p.base,
                  border: 'none',
                  cursor: 'pointer',
                  flexShrink: 0,
                  outline: selected
                    ? '2px solid var(--fg-primary)'
                    : '2px solid transparent',
                  outlineOffset: 2,
                }}
              />
            )
          })}
        </div>
      </Field>

      <Field>
        <FieldLabel>
          설명
          <span style={{ color: 'var(--fg-tertiary)', fontWeight: '400', marginLeft: 4 }}>
            (선택)
          </span>
        </FieldLabel>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="이 캘린더에 대한 간단한 설명"
          rows={3}
        />
      </Field>
    </ModalShell>
  )
}
