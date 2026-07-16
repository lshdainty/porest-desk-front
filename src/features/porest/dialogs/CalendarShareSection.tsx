import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
import { ModalFooter } from '@/shared/ui/porest/modal-footer'
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

// 모바일 카드 다이어트 — 초대 코드 행 셸: 모바일은 플랫, 데스크톱은 Card (.m-subpage 정합).
function JoinShell({ mobile, children }: { mobile: boolean; children: React.ReactNode }) {
  return mobile
    ? <div style={{ padding: '4px 0' }}>{children}</div>
    : <Card><CardContent style={{ padding: 'var(--spacing-lg)' }}>{children}</CardContent></Card>
}

export function CalendarShareSection({ mobile }: { mobile: boolean }) {
  const { t } = useTranslation('calendar')
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
        toast.success(t('shareSection.toast.deleted'), { id: 'cal-delete-success' })
      },
    })
  }

  const managing = managingId != null ? list.find(c => c.rowId === managingId) ?? null : null

  return (
    <>
      {/* 설정 서브페이지 섹션 간격 spacing-2xl(32) 통일 — 기본 gap-4(16) override */}
      <ManagerShell className="!gap-[var(--spacing-2xl)]">
        {!mobile && (
          <ManagerHead
            title={t('shareSection.title')}
            description={t('shareSection.description')}
            actions={
              <Button size="sm" onClick={() => setCreating(true)}>
                <Plus size={14} strokeWidth={2.4} />{t('newCalendar')}
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
                <div style={{ fontSize: 'var(--text-label-sm)', fontWeight: '700', color: 'var(--fg-primary)' }}>
                  {t('shareSection.infoTitle')}
                </div>
                <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-secondary)', marginTop: 2, lineHeight: '1.5' }}>
                  {t('shareSection.infoDesc')}
                </div>
              </div>
              {mobile && (
                <Button size="sm" onClick={() => setCreating(true)}>
                  <Plus size={14} strokeWidth={2.4} />{t('newCalendar')}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <CalendarListSection
          title={`${t('shareSection.myCalendars')} · ${owned.length}`}
          calendars={owned}
          isLoading={isLoading}
          emptyText={t('shareSection.emptyOwned')}
          onManage={setManagingId}
          mobile={mobile}
        />

        <CalendarListSection
          title={`${t('shareSection.sharedCalendars')} · ${shared.length}`}
          calendars={shared}
          isLoading={false}
          emptyText={t('shareSection.emptyShared')}
          onManage={setManagingId}
          mobile={mobile}
        />

        {/* 초대 코드로 참여 — 앱 정합: 컴팩트 카드 + 참여 버튼(다이얼로그).
            모바일 카드 다이어트 — 셸 카드 벗기고 플랫 행. */}
        <JoinShell mobile={mobile}>
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
                <div style={{ fontSize: 'var(--text-label-sm)', fontWeight: '700', color: 'var(--fg-primary)' }}>
                  {t('joinByCode')}
                </div>
                <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-secondary)', marginTop: 2, lineHeight: '1.5' }}>
                  {t('shareSection.joinDesc')}
                </div>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setJoining(true)}>
                {t('join')}
              </Button>
            </div>
        </JoinShell>
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
                toast.success(t('shareSection.toast.created'), { id: 'cal-create-success' })
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
                toast.success(t('shareSection.toast.joined'), { id: 'cal-join-success' })
              },
              onError: () => toast.error(t('shareSection.toast.joinError'), { id: 'cal-join-err' }),
            })
          }
          submitting={joinMut.isPending}
          mobile={mobile}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title={t('deleteCalendar')}
          message={t('shareSection.deleteMessage', { name: `"${confirmDelete.calendarName}"` })}
          confirmLabel={t('shareSection.permanentDelete')}
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
  mobile = false,
}: {
  title: string
  calendars: UserCalendar[]
  isLoading: boolean
  emptyText: string
  onManage: (id: number) => void
  /** 모바일 카드 다이어트 — 리스트 셸 카드 벗김 (.m-subpage) */
  mobile?: boolean
}) {
  const list = isLoading ? (
    <ShareListSkeleton />
  ) : calendars.length === 0 ? (
    <div style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 'var(--text-label-sm)' }}>
      {emptyText}
    </div>
  ) : (
    calendars.map((cal, i) => (
      <CalendarRow key={cal.rowId} cal={cal} first={i === 0} onManage={onManage} />
    ))
  )
  return (
    <div>
      <div style={{ fontSize: 'var(--text-label-sm)', fontWeight: '700', color: 'var(--fg-primary)', padding: '4px 4px 10px' }}>
        {title}
      </div>
      {mobile ? (
        <div>{list}</div>
      ) : (
        <Card>
          <CardContent style={{ padding: 0 }}>{list}</CardContent>
        </Card>
      )}
    </div>
  )
}

function CalendarRow({ cal, first, onManage }: { cal: UserCalendar; first: boolean; onManage: (id: number) => void }) {
  const { t } = useTranslation('calendar')
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
              {t('default')}
            </Badge>
          )}
        </div>
        <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', marginTop: 2 }}>
          {cal.memberCount <= 1 ? t('shareSection.onlyMe') : t('shareSection.memberCount', { count: cal.memberCount })}
        </div>
      </div>
      {!cal.isOwner && (
        <Badge variant={ROLE_BADGE_VARIANT[cal.myRole]} style={{ flexShrink: 0 }}>
          {t(`role.${cal.myRole}`)}
        </Badge>
      )}
      {/* '관리' 버튼 제거 — 앱처럼 행 전체 탭(onClick)으로 진입, chevron 만 표시. */}
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
  const { t } = useTranslation('calendar')
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
      { onSuccess: () => toast.success(t('shareSection.toast.updated'), { id: 'cal-update' }) },
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
    toast.success(t('shareSection.toast.codeCopied'), { id: 'cal-code-copy' })
  }

  const handleRegenerate = () => {
    regenMut.mutate(calendar.rowId, {
      onSuccess: () => toast.success(t('shareSection.toast.codeRegenerated'), { id: 'cal-code-regen' }),
    })
  }

  const handleRemove = (member: CalendarMember) => {
    removeMut.mutate(
      { id: calendar.rowId, memberId: member.rowId },
      { onSuccess: () => toast.success(t('shareSection.toast.memberRemoved'), { id: 'cal-member-remove' }) },
    )
  }

  const handleChangeRole = (member: CalendarMember, permission: CalendarRole) => {
    roleMut.mutate(
      { id: calendar.rowId, memberId: member.rowId, permission },
      { onSuccess: () => toast.success(t('shareSection.toast.roleChanged'), { id: 'cal-role-change' }) },
    )
  }

  const Footer = (
    <>
      {isOwner && !calendar.isDefault && (
        <Button
          variant="ghost"
          flush="left"
          onClick={() => {
            onRequestDelete(calendar)
            onClose()
          }}
          style={{ color: 'var(--fg-expense)', marginRight: 'auto' }}
        >
          <Trash2 size={14} />{t('deleteCalendar')}
        </Button>
      )}
      <Button variant="ghost" onClick={onClose}>
        {t('close')}
      </Button>
    </>
  )

  return (
    <ModalShell title={`${calendar.calendarName} · ${t('shareSection.manageSuffix')}`} onClose={onClose} size="md" footer={Footer} mobile={mobile}>
      {isOwner && (
        <>
          {/* 이름 */}
          <Field style={{ marginBottom: 14 }}>
            <FieldLabel>{t('name')}</FieldLabel>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder={t('shareSection.namePlaceholder')} />
          </Field>

          {/* 색상 */}
          <Field style={{ marginBottom: 14 }}>
            <FieldLabel>{t('form.color')}</FieldLabel>
            <ColorSwatchGroup
              columns={5}
              value={color}
              onValueChange={setColor}
              options={CAT_PALETTE.map(p => ({ value: p.baseHex, bg: p.bg, fg: p.color }))}
            />
          </Field>

          {dirty && (
            <Button size="sm" onClick={handleSaveMeta} loading={updateMut.isPending} style={{ marginBottom: 18 }}>
              {t('shareSection.saveChanges')}
            </Button>
          )}

          {/* 초대 코드 */}
          <Field style={{ marginBottom: 18 }}>
            <FieldLabel>{t('inviteCode')}</FieldLabel>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Input value={calendar.inviteCode ?? ''} readOnly style={{ flex: 1, minWidth: 0 }} />
              <Button variant="outline" size="icon" aria-label={t('shareSection.copyCode')} onClick={() => handleCopyCode(calendar.inviteCode ?? '')}>
                <Copy size={14} />
              </Button>
              <Button variant="outline" size="icon" aria-label={t('shareSection.regenCode')} onClick={handleRegenerate} loading={regenMut.isPending}>
                {!regenMut.isPending && <RefreshCw size={14} />}
              </Button>
            </div>
            <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-tertiary)', marginTop: 6 }}>
              {t('shareSection.codeHint')}
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
        {t('shareSection.members')} · {members?.length ?? 0}
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
                  <div style={{ fontSize: 'var(--text-body-sm)', fontWeight: '600', color: 'var(--fg-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {member.userName}
                    {isSelf && <span style={{ color: 'var(--fg-tertiary)', fontWeight: '500' }}> {t('shareSection.you')}</span>}
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
                        <SelectItem value="EDIT">{t('role.EDIT')}</SelectItem>
                        <SelectItem value="READ">{t('role.READ')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" className="!text-[var(--fg-expense)]" aria-label={t('shareSection.removeMember')} onClick={() => handleRemove(member)} loading={removeMut.isPending}>
                      {!removeMut.isPending && <Trash2 size={14} />}
                    </Button>
                  </>
                ) : (
                  <Badge variant={ROLE_BADGE_VARIANT[member.permission]} style={{ flexShrink: 0 }}>
                    <RoleIcon size={11} strokeWidth={2.2} />
                    {t(`role.${member.permission}`)}
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
  const { t } = useTranslation('calendar')
  const [name, setName] = useState('')
  const [color, setColor] = useState('#2c70bf')
  const [touched, setTouched] = useState(false)

  const nameTrim = name.trim()
  const valid = nameTrim.length > 0
  const err = touched && !valid ? t('shareSection.nameRequired') : null

  const save = () => {
    setTouched(true)
    if (!valid) return
    onCreate({ calendarName: nameTrim, color }, onClose)
  }

  const Footer = (
    <ModalFooter
      onSave={save}
      saveLabel={t('shareSection.create')}
      saving={submitting}
      saveDisabled={touched && !valid}
      onCancel={onClose}
    />
  )

  return (
    <ModalShell title={t('newCalendar')} onClose={onClose} size="md" footer={Footer} mobile={mobile}>
      <Field style={{ marginBottom: 14 }}>
        <FieldLabel>{t('name')}</FieldLabel>
        <Input
          aria-invalid={!!err}
          value={name}
          onChange={e => {
            setName(e.target.value)
            setTouched(true)
          }}
          placeholder={t('shareSection.createNamePlaceholder')}
          autoFocus
        />
        {err && <div style={{ fontSize: 'var(--text-badge)', color: 'var(--fg-expense)', marginTop: 4 }}>{err}</div>}
      </Field>

      <Field>
        <FieldLabel>{t('form.color')}</FieldLabel>
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
  const { t } = useTranslation('calendar')
  const [code, setCode] = useState('')
  const valid = code.trim().length > 0
  const submit = () => {
    if (!valid) return
    onJoin(code.trim().toUpperCase(), onClose)
  }

  const Footer = (
    <ModalFooter
      onSave={submit}
      saveLabel={t('join')}
      saving={submitting}
      saveDisabled={!valid}
      saveIcon={<LogIn size={16} strokeWidth={2.2} />}
      onCancel={onClose}
    />
  )

  return (
    <ModalShell title={t('joinByCode')} onClose={onClose} size="md" footer={Footer} mobile={mobile}>
      <Field>
        <FieldLabel>{t('inviteCode')}</FieldLabel>
        <Input
          value={code}
          onChange={e => setCode(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') submit()
          }}
          placeholder={t('shareSection.joinCodePlaceholder')}
          autoFocus
        />
      </Field>
    </ModalShell>
  )
}
