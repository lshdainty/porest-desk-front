import { useMemo, useState } from 'react'
import {
  Calendar,
  ChevronRight,
  Copy,
  Crown,
  Eye,
  Link,
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
import { ManagerHead, ManagerShell } from '@/shared/ui/porest/manager-layout'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { Skeleton as SkeletonBase } from '@/shared/ui/skeleton'
import { getPaletteByColor, CAT_PALETTE } from '@/shared/lib/porest/chart-palette'
import { ColorSwatchGroup } from '@/shared/ui/color-swatch'
import { useCurrentUser } from '@/features/user'
import {
  useCalendarMembers,
  useChangeCalendarMemberRole,
  useCreateUserCalendar,
  useDeleteUserCalendar,
  useJoinCalendar,
  useRegenerateCalendarInviteCode,
  useRemoveCalendarMember,
  useUpdateUserCalendar,
  useUserCalendars,
} from '@/features/user-calendar'
import type { CalendarMember, CalendarRole, UserCalendar } from '@/entities/user-calendar'

const ROLE_ICON: Record<CalendarRole, typeof Crown> = {
  OWNER: Crown,
  EDIT: Pencil,
  READ: Eye,
}

const ROLE_LABEL: Record<CalendarRole, string> = {
  OWNER: '소유자',
  EDIT: '편집 가능',
  READ: '읽기 전용',
}

// 권한 배지 — badge.md "같은 카테고리는 한 style(outline)" 규칙: 색만 분기.
const ROLE_BADGE_VARIANT: Record<CalendarRole, 'outline-info' | 'outline-success' | 'outline'> = {
  OWNER: 'outline-info',
  EDIT: 'outline-success',
  READ: 'outline',
}

// 멤버 아바타 — 권한 색 톤 (소유자 info / 편집 success / 읽기 neutral).
const ROLE_AVATAR: Record<CalendarRole, { bg: string; fg: string }> = {
  OWNER: { bg: 'color-mix(in srgb, var(--color-info) 14%, transparent)', fg: 'var(--color-info)' },
  EDIT: { bg: 'color-mix(in srgb, var(--color-success) 14%, transparent)', fg: 'var(--color-success)' },
  READ: { bg: 'var(--bg-sunken)', fg: 'var(--fg-tertiary)' },
}

export function CalendarShareSection({ mobile }: { mobile: boolean }) {
  const { data: calendars, isLoading } = useUserCalendars()
  const createMut = useCreateUserCalendar()
  const deleteMut = useDeleteUserCalendar()
  const joinMut = useJoinCalendar()

  const [managingId, setManagingId] = useState<number | null>(null)
  const [creating, setCreating] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<UserCalendar | null>(null)
  const [joining, setJoining] = useState(false)

  const list = useMemo(() => calendars ?? [], [calendars])
  const owned = useMemo(() => list.filter(c => c.isOwner), [list])
  const shared = useMemo(() => list.filter(c => !c.isOwner), [list])

  const handleDelete = (cal: UserCalendar) => {
    deleteMut.mutate(cal.rowId, {
      onSuccess: () => {
        setConfirmDelete(null)
        if (managingId === cal.rowId) setManagingId(null)
        toast.success('캘린더를 삭제했어요', { id: 'cal-delete-success' })
      },
    })
  }

  const managing = managingId != null ? list.find(c => c.rowId === managingId) ?? null : null

  return (
    <>
      <ManagerShell>
        {!mobile && (
          <ManagerHead
            title="캘린더 관리·공유"
            description="캘린더를 만들고 가족·친구를 초대해 일정을 함께 관리할 수 있어요."
            actions={
              <Button size="sm" onClick={() => setCreating(true)}>
                <Plus size={14} strokeWidth={2.4} />새 캘린더
              </Button>
            }
          />
        )}

        {/* 안내 카드 — 앱 정합: brand-subtle bg + brand 보더 */}
        <Card style={{ background: 'var(--bg-brand-subtle)', border: '1px solid var(--border-brand)' }}>
          <CardContent style={{ padding: 'var(--spacing-lg)' }}>
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
                <div style={{ fontSize: 'var(--text-body-md)', fontWeight: '700', color: 'var(--fg-primary)' }}>
                  가족·친구와 일정 공유
                </div>
                <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-secondary)', marginTop: 2, lineHeight: '1.5' }}>
                  캘린더를 만들고 멤버를 초대해 함께 일정을 관리해요.
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

        <CalendarListSection
          title={`내 캘린더 · ${owned.length}`}
          calendars={owned}
          isLoading={isLoading}
          emptyText="소유한 캘린더가 없어요"
          onManage={setManagingId}
        />

        <CalendarListSection
          title={`공유받은 캘린더 · ${shared.length}`}
          calendars={shared}
          isLoading={false}
          emptyText="공유받은 캘린더가 없어요"
          onManage={setManagingId}
        />

        {/* 초대 코드로 참여 — 앱 정합: 컴팩트 카드 + 참여 버튼(다이얼로그) */}
        <Card>
          <CardContent style={{ padding: 'var(--spacing-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-muted)',
                  color: 'var(--fg-secondary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Link size={18} strokeWidth={1.9} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 'var(--text-body-md)', fontWeight: '700', color: 'var(--fg-primary)' }}>
                  초대 코드로 참여
                </div>
                <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-secondary)', marginTop: 2, lineHeight: '1.5' }}>
                  공유받은 초대 코드를 입력해 캘린더에 참여하세요.
                </div>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setJoining(true)}>
                참여
              </Button>
            </div>
          </CardContent>
        </Card>
      </ManagerShell>

      {managing && (
        <CalendarManageDialog
          calendar={managing}
          onClose={() => setManagingId(null)}
          onRequestDelete={c => setConfirmDelete(c)}
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

      {joining && (
        <CalendarJoinDialog
          onClose={() => setJoining(false)}
          onJoin={(code, onDone) =>
            joinMut.mutate(code, {
              onSuccess: () => {
                onDone()
                toast.success('캘린더에 참여했어요', { id: 'cal-join-success' })
              },
              onError: () => toast.error('초대 코드를 확인해주세요', { id: 'cal-join-err' }),
            })
          }
          submitting={joinMut.isPending}
          mobile={mobile}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="캘린더 삭제"
          message={`"${confirmDelete.calendarName}" 캘린더를 삭제하시겠어요? 이 캘린더의 일정은 기본 캘린더로 이동하고, 모든 멤버의 접근 권한이 사라집니다.`}
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

function CalendarListSection({
  title,
  calendars,
  isLoading,
  emptyText,
  onManage,
}: {
  title: string
  calendars: UserCalendar[]
  isLoading: boolean
  emptyText: string
  onManage: (id: number) => void
}) {
  return (
    <div>
      <div style={{ fontSize: 'var(--text-body-md)', fontWeight: '700', color: 'var(--fg-primary)', padding: '4px 4px 10px' }}>
        {title}
      </div>
      <Card>
        <CardContent style={{ padding: 0 }}>
          {isLoading ? (
            <ShareListSkeleton />
          ) : calendars.length === 0 ? (
            <div style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 'var(--text-body-sm)' }}>
              {emptyText}
            </div>
          ) : (
            calendars.map((cal, i) => (
              <CalendarRow key={cal.rowId} cal={cal} first={i === 0} onManage={onManage} />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function CalendarRow({ cal, first, onManage }: { cal: UserCalendar; first: boolean; onManage: (id: number) => void }) {
  const pal = getPaletteByColor(cal.color)
  return (
    <div
      onClick={() => onManage(cal.rowId)}
      className="hover:bg-[var(--bg-muted)]"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        borderTop: first ? 'none' : '1px solid var(--border-subtle)',
        cursor: 'pointer',
        transition: 'background var(--motion-duration-fast) var(--motion-ease-out)',
      }}
    >
      <span
        style={{
          width: 36,
          height: 36,
          borderRadius: 'var(--radius-md)',
          background: pal.bg,
          color: pal.color,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Calendar size={18} strokeWidth={2} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              fontSize: 'var(--text-body-sm)',
              fontWeight: '600',
              lineHeight: 1.5,
              color: 'var(--fg-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {cal.calendarName}
          </span>
          {cal.isDefault && (
            // 공용 Badge(secondary) — pill·secondary 회색·8/2 패딩으로 앱 PBadge 정합.
            // font-bold(w700)로 앱 PBadge 굵기와 일치(badge.md SoT는 600 — 아래 노트 참고).
            <Badge variant="secondary" className="font-bold" style={{ flexShrink: 0 }}>
              기본
            </Badge>
          )}
        </div>
        <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', marginTop: 2 }}>
          {cal.memberCount <= 1 ? '나만 사용' : `멤버 ${cal.memberCount}명`}
        </div>
      </div>
      {!cal.isOwner && (
        <Badge variant={ROLE_BADGE_VARIANT[cal.myRole]} style={{ flexShrink: 0 }}>
          {ROLE_LABEL[cal.myRole]}
        </Badge>
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={e => {
          e.stopPropagation()
          onManage(cal.rowId)
        }}
      >
        관리
      </Button>
      <ChevronRight size={16} style={{ color: 'var(--fg-tertiary)', flexShrink: 0 }} />
    </div>
  )
}

function ShareListSkeleton() {
  return (
    <>
      {[0, 1].map(i => (
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

function CalendarManageDialog({
  calendar,
  onClose,
  onRequestDelete,
  mobile,
}: {
  calendar: UserCalendar
  onClose: () => void
  onRequestDelete: (cal: UserCalendar) => void
  mobile: boolean
}) {
  const { data: currentUser } = useCurrentUser()
  const { data: members, isLoading } = useCalendarMembers(calendar.rowId)
  const regenMut = useRegenerateCalendarInviteCode()
  const removeMut = useRemoveCalendarMember()
  const roleMut = useChangeCalendarMemberRole()
  const updateMut = useUpdateUserCalendar()

  const isOwner = calendar.isOwner
  const [name, setName] = useState(calendar.calendarName)
  const [color, setColor] = useState(calendar.color)
  const dirty = name.trim() !== calendar.calendarName || color !== calendar.color

  const handleSaveMeta = () => {
    if (!name.trim()) return
    updateMut.mutate(
      { id: calendar.rowId, data: { calendarName: name.trim(), color } },
      { onSuccess: () => toast.success('캘린더를 수정했어요', { id: 'cal-update' }) },
    )
  }

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = code
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    toast.success('초대 코드를 복사했어요', { id: 'cal-code-copy' })
  }

  const handleRegenerate = () => {
    regenMut.mutate(calendar.rowId, {
      onSuccess: () => toast.success('초대 코드를 새로 만들었어요', { id: 'cal-code-regen' }),
    })
  }

  const handleRemove = (member: CalendarMember) => {
    removeMut.mutate(
      { id: calendar.rowId, memberId: member.rowId },
      { onSuccess: () => toast.success('멤버를 제거했어요', { id: 'cal-member-remove' }) },
    )
  }

  const handleChangeRole = (member: CalendarMember, permission: CalendarRole) => {
    roleMut.mutate(
      { id: calendar.rowId, memberId: member.rowId, permission },
      { onSuccess: () => toast.success('권한을 변경했어요', { id: 'cal-role-change' }) },
    )
  }

  const Footer = (
    <>
      {isOwner && !calendar.isDefault && (
        <Button
          variant="ghost"
          onClick={() => {
            onRequestDelete(calendar)
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
    <ModalShell title={`${calendar.calendarName} · 관리`} onClose={onClose} size="md" footer={Footer} mobile={mobile}>
      {isOwner && (
        <>
          {/* 이름 */}
          <Field style={{ marginBottom: 14 }}>
            <FieldLabel>이름</FieldLabel>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="캘린더 이름" />
          </Field>

          {/* 색상 */}
          <Field style={{ marginBottom: 14 }}>
            <FieldLabel>색상</FieldLabel>
            <ColorSwatchGroup
              columns={5}
              value={color}
              onValueChange={setColor}
              options={CAT_PALETTE.map(p => ({ value: p.baseHex, bg: p.bg, fg: p.color }))}
            />
          </Field>

          {dirty && (
            <Button size="sm" onClick={handleSaveMeta} loading={updateMut.isPending} style={{ marginBottom: 18 }}>
              변경 저장
            </Button>
          )}

          {/* 초대 코드 */}
          <Field style={{ marginBottom: 18 }}>
            <FieldLabel>초대 코드</FieldLabel>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Input value={calendar.inviteCode ?? ''} readOnly style={{ flex: 1, minWidth: 0 }} />
              <Button variant="outline" size="icon" aria-label="초대 코드 복사" onClick={() => handleCopyCode(calendar.inviteCode ?? '')}>
                <Copy size={14} />
              </Button>
              <Button variant="outline" size="icon" aria-label="초대 코드 재생성" onClick={handleRegenerate} loading={regenMut.isPending}>
                {!regenMut.isPending && <RefreshCw size={14} />}
              </Button>
            </div>
            <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', marginTop: 6 }}>
              이 코드를 공유하면 다른 사람이 캘린더에 참여할 수 있어요.
            </div>
          </Field>
        </>
      )}

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
        멤버 · {members?.length ?? 0}
      </div>
      {isLoading || !members ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <SkeletonBase className="h-12 w-full rounded-md" />
          <SkeletonBase className="h-12 w-full rounded-md" />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {members.map((member, i) => {
            const RoleIcon = ROLE_ICON[member.permission]
            const isSelf = member.userRowId === currentUser?.rowId
            const canManage = isOwner && member.permission !== 'OWNER' && !isSelf
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
                    background: ROLE_AVATAR[member.permission].bg,
                    color: ROLE_AVATAR[member.permission].fg,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <RoleIcon size={16} strokeWidth={2} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 'var(--text-body-md)', fontWeight: '600', color: 'var(--fg-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {member.userName}
                    {isSelf && <span style={{ color: 'var(--fg-tertiary)', fontWeight: '500' }}> (나)</span>}
                  </div>
                  <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {member.userEmail}
                  </div>
                </div>
                {canManage ? (
                  <>
                    <Select value={member.permission} onValueChange={v => handleChangeRole(member, v as CalendarRole)} disabled={roleMut.isPending}>
                      <SelectTrigger className="h-8 w-28 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EDIT">{ROLE_LABEL.EDIT}</SelectItem>
                        <SelectItem value="READ">{ROLE_LABEL.READ}</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" className="!text-[var(--fg-expense)]" aria-label="멤버 제거" onClick={() => handleRemove(member)} loading={removeMut.isPending}>
                      {!removeMut.isPending && <Trash2 size={14} />}
                    </Button>
                  </>
                ) : (
                  <Badge variant={ROLE_BADGE_VARIANT[member.permission]} style={{ flexShrink: 0 }}>
                    <RoleIcon size={11} strokeWidth={2.2} />
                    {ROLE_LABEL[member.permission]}
                  </Badge>
                )}
              </div>
            )
          })}
        </div>
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
  onCreate: (values: { calendarName: string; color: string }, onDone: () => void) => void
  submitting?: boolean
  mobile: boolean
}) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('#2c70bf')
  const [touched, setTouched] = useState(false)

  const nameTrim = name.trim()
  const valid = nameTrim.length > 0
  const err = touched && !valid ? '캘린더 이름을 입력해주세요.' : null

  const save = () => {
    setTouched(true)
    if (!valid) return
    onCreate({ calendarName: nameTrim, color }, onClose)
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
    <ModalShell title="새 캘린더" onClose={onClose} size="md" footer={Footer} mobile={mobile}>
      <Field style={{ marginBottom: 14 }}>
        <FieldLabel>이름</FieldLabel>
        <Input
          aria-invalid={!!err}
          value={name}
          onChange={e => {
            setName(e.target.value)
            setTouched(true)
          }}
          placeholder="예: 가족, 업무, 운동 일정"
          autoFocus
        />
        {err && <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-expense)', marginTop: 4 }}>{err}</div>}
      </Field>

      <Field>
        <FieldLabel>색상</FieldLabel>
        <ColorSwatchGroup
          columns={5}
          value={color}
          onValueChange={setColor}
          options={CAT_PALETTE.map(p => ({ value: p.baseHex, bg: p.bg, fg: p.color }))}
        />
      </Field>
    </ModalShell>
  )
}

function CalendarJoinDialog({
  onClose,
  onJoin,
  submitting,
  mobile,
}: {
  onClose: () => void
  onJoin: (code: string, onDone: () => void) => void
  submitting?: boolean
  mobile: boolean
}) {
  const [code, setCode] = useState('')
  const valid = code.trim().length > 0
  const submit = () => {
    if (!valid) return
    onJoin(code.trim().toUpperCase(), onClose)
  }

  const Footer = (
    <>
      <Button variant="ghost" onClick={onClose} disabled={submitting}>
        취소
      </Button>
      <Button onClick={submit} disabled={!valid} loading={submitting}>
        <LogIn size={14} strokeWidth={2.2} />참여
      </Button>
    </>
  )

  return (
    <ModalShell title="초대 코드로 참여" onClose={onClose} size="md" footer={Footer} mobile={mobile}>
      <Field>
        <FieldLabel>초대 코드</FieldLabel>
        <Input
          value={code}
          onChange={e => setCode(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') submit()
          }}
          placeholder="공유받은 초대 코드를 입력하세요"
          autoFocus
        />
      </Field>
    </ModalShell>
  )
}
