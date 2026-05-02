import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Plus,
  LogIn,
  Users,
  Crown,
  Shield,
  User,
  Copy,
  RefreshCw,
  Trash2,
  Pencil,
  ChevronRight,
  Settings,
} from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { ModalShell } from '@/shared/ui/porest/dialogs'
import { useIsMobile } from '@/shared/hooks'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { toast } from 'sonner'
import {
  useGroups,
  useGroup,
  useCreateGroup,
  useUpdateGroup,
  useDeleteGroup,
  useRegenerateInviteCode,
  useJoinGroup,
  useRemoveMember,
  useChangeMemberRole,
} from '@/features/group'
import { GroupForm } from './GroupForm'
import { GroupTypeManagementDialog } from './GroupTypeManagementDialog'
import { GroupScheduleTab } from './GroupScheduleTab'
import { GroupExpenseTab } from './GroupExpenseTab'
import type { GroupFormValues, UserGroup, GroupRole } from '@/entities/group'

const roleIcons: Record<GroupRole, typeof Crown> = {
  OWNER: Crown,
  ADMIN: Shield,
  MEMBER: User,
}

export const GroupFullWidget = () => {
  const { t } = useTranslation('group')
  const { t: tc } = useTranslation('common')
  const isMobile = useIsMobile()

  const { data: groups = [], isLoading } = useGroups()
  const createGroup = useCreateGroup()
  const updateGroup = useUpdateGroup()
  const deleteGroup = useDeleteGroup()
  const regenerateInviteCode = useRegenerateInviteCode()
  const joinGroup = useJoinGroup()
  const removeMember = useRemoveMember()
  const changeMemberRole = useChangeMemberRole()

  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showJoinDialog, setShowJoinDialog] = useState(false)
  const [showTypeManagement, setShowTypeManagement] = useState(false)
  const [editingGroup, setEditingGroup] = useState<UserGroup | null>(null)
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null)
  const [inviteCode, setInviteCode] = useState('')

  const { data: groupDetail } = useGroup(selectedGroupId ?? 0)

  const handleCreate = (data: GroupFormValues) => {
    createGroup.mutate(data, {
      onSuccess: () => {
        setShowCreateDialog(false)
        toast.success(t('createSuccess'))
      },
    })
  }

  const handleUpdate = (data: GroupFormValues) => {
    if (!editingGroup) return
    updateGroup.mutate(
      { id: editingGroup.rowId, data },
      {
        onSuccess: () => {
          setEditingGroup(null)
          toast.success(t('updateSuccess'))
        },
      }
    )
  }

  const handleDelete = () => {
    if (!deleteTargetId) return
    deleteGroup.mutate(deleteTargetId, {
      onSuccess: () => {
        setDeleteTargetId(null)
        if (selectedGroupId === deleteTargetId) setSelectedGroupId(null)
        toast.success(t('deleteSuccess'))
      },
    })
  }

  const handleJoin = () => {
    if (!inviteCode.trim()) return
    joinGroup.mutate(inviteCode.trim(), {
      onSuccess: () => {
        setShowJoinDialog(false)
        setInviteCode('')
        toast.success(t('joinSuccess'))
      },
      onError: () => {
        toast.error(t('joinError'))
      },
    })
  }

  const handleRegenerateCode = (groupId: number) => {
    regenerateInviteCode.mutate(groupId, {
      onSuccess: () => {
        toast.success(t('inviteCodeRegenerated'))
      },
    })
  }

  const handleCopyInviteCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      toast.success(t('inviteCodeCopied'))
    } catch {
      // fallback for non-secure contexts
      const textarea = document.createElement('textarea')
      textarea.value = code
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      toast.success(t('inviteCodeCopied'))
    }
  }

  const handleRemoveMember = (groupId: number, memberId: number) => {
    removeMember.mutate(
      { groupId, memberId },
      {
        onSuccess: () => {
          toast.success(t('memberRemoved'))
        },
      }
    )
  }

  const handleChangeRole = (groupId: number, memberId: number, role: GroupRole) => {
    changeMemberRole.mutate(
      { groupId, memberId, role },
      {
        onSuccess: () => {
          toast.success(t('roleChanged'))
        },
      }
    )
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  // Detail view
  if (selectedGroupId && groupDetail) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setSelectedGroupId(null)}>
            &larr; {t('backToList')}
          </Button>
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg">{groupDetail.groupName}</CardTitle>
              {groupDetail.description && (
                <p className="mt-1 text-sm text-muted-foreground">{groupDetail.description}</p>
              )}
            </div>
            <Badge
              variant="outline"
              style={groupDetail.groupTypeColor ? {
                borderColor: groupDetail.groupTypeColor,
                color: groupDetail.groupTypeColor,
              } : undefined}
            >
              {groupDetail.groupTypeName ?? t('noGroupType')}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 rounded-md bg-muted p-3">
              <span className="text-sm font-medium">{t('inviteCode')}:</span>
              <code className="truncate rounded bg-background px-2 py-0.5 text-sm font-mono">
                {groupDetail.inviteCode}
              </code>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => handleCopyInviteCode(groupDetail.inviteCode)}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => handleRegenerateCode(groupDetail.rowId)}
                loading={regenerateInviteCode.isPending}
              >
                {!regenerateInviteCode.isPending && <RefreshCw className="h-3.5 w-3.5" />}
              </Button>
            </div>

            <Tabs defaultValue="members">
              <TabsList className="w-full">
                <TabsTrigger value="members" className="flex-1">{t('tabs.members')}</TabsTrigger>
                <TabsTrigger value="schedule" className="flex-1">{t('tabs.schedule')}</TabsTrigger>
                <TabsTrigger value="expense" className="flex-1">{t('tabs.expense')}</TabsTrigger>
              </TabsList>

              <TabsContent value="members" className="mt-4">
                <div>
                  <h3 className="mb-2 font-medium">
                    {t('members')} ({groupDetail.members.length})
                  </h3>
                  <div className="space-y-2">
                    {groupDetail.members.map((member) => {
                      const RoleIcon = roleIcons[member.role]
                      return (
                        <div
                          key={member.rowId}
                          className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                              <RoleIcon className="h-4 w-4 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{member.userName}</p>
                              <p className="truncate text-xs text-muted-foreground">{member.userEmail}</p>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            {member.role !== 'OWNER' && (
                              <>
                                <Select
                                  value={member.role}
                                  onValueChange={(v) =>
                                    handleChangeRole(groupDetail.rowId, member.rowId, v as GroupRole)
                                  }
                                  disabled={changeMemberRole.isPending}
                                >
                                  <SelectTrigger className="h-7 w-24 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="ADMIN">{t('role.ADMIN')}</SelectItem>
                                    <SelectItem value="MEMBER">{t('role.MEMBER')}</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive"
                                  onClick={() => handleRemoveMember(groupDetail.rowId, member.rowId)}
                                  loading={removeMember.isPending}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            )}
                            {member.role === 'OWNER' && (
                              <Badge variant="secondary" className="text-xs">
                                {t('role.OWNER')}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="schedule" className="mt-4">
                <GroupScheduleTab groupId={groupDetail.rowId} />
              </TabsContent>

              <TabsContent value="expense" className="mt-4">
                <GroupExpenseTab groupId={groupDetail.rowId} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    )
  }

  // List view
  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* 고정: 액션 버튼 */}
      <div className="shrink-0">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            {t('addGroup')}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowJoinDialog(true)}>
            <LogIn className="mr-1.5 h-4 w-4" />
            {t('joinGroup')}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowTypeManagement(true)}>
            <Settings className="mr-1.5 h-4 w-4" />
            {t('groupTypeManagement')}
          </Button>
        </div>
      </div>

      {/* 스크롤: 그룹 카드 */}
      <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
        {groups.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <Users className="mx-auto mb-3 h-12 w-12 opacity-30" />
            <p>{t('empty')}</p>
            <p className="text-sm">{t('createFirst')}</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {groups.map((group) => (
              <Card
                key={group.rowId}
                className="cursor-pointer overflow-hidden transition-shadow hover:shadow-md"
                onClick={() => setSelectedGroupId(group.rowId)}
              >
                <CardContent className="flex items-center justify-between gap-2 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <h3 className="truncate font-medium">{group.groupName}</h3>
                      <Badge
                        variant="outline"
                        className="text-xs"
                        style={group.groupTypeColor ? {
                          borderColor: group.groupTypeColor,
                          color: group.groupTypeColor,
                        } : undefined}
                      >
                        {group.groupTypeName ?? t('noGroupType')}
                      </Badge>
                    </div>
                    {group.description && (
                      <p className="mt-0.5 truncate text-sm text-muted-foreground">
                        {group.description}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      <Users className="mr-1 inline h-3 w-3" />
                      {group.memberCount} {t('memberCount')}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingGroup(group)
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteTargetId(group.rowId)
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      {showCreateDialog && (
        <ModalShell title={t('addGroup')} onClose={() => setShowCreateDialog(false)} mobile={isMobile} size="sm">
          <GroupForm onSubmit={handleCreate} onCancel={() => setShowCreateDialog(false)} isSubmitting={createGroup.isPending} />
        </ModalShell>
      )}

      {/* Edit Dialog */}
      {editingGroup && (
        <ModalShell title={t('editGroup')} onClose={() => setEditingGroup(null)} mobile={isMobile} size="sm">
          <GroupForm
            initialData={editingGroup}
            onSubmit={handleUpdate}
            onCancel={() => setEditingGroup(null)}
            isSubmitting={updateGroup.isPending}
          />
        </ModalShell>
      )}

      {/* Join Dialog */}
      {showJoinDialog && (
        <ModalShell title={t('joinGroup')} onClose={() => setShowJoinDialog(false)} mobile={isMobile} size="sm">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('inviteCode')}</Label>
              <Input
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder={t('inviteCodePlaceholder')}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowJoinDialog(false)} disabled={joinGroup.isPending}>
                {tc('cancel')}
              </Button>
              <Button onClick={handleJoin} loading={joinGroup.isPending}>
                {t('join')}
              </Button>
            </div>
          </div>
        </ModalShell>
      )}

      {/* Delete Confirm Dialog */}
      <AlertDialog open={!!deleteTargetId} onOpenChange={() => setDeleteTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteConfirm.title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteConfirm.message')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tc('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              loading={deleteGroup.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {tc('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Group Type Management Dialog */}
      <GroupTypeManagementDialog
        open={showTypeManagement}
        onOpenChange={setShowTypeManagement}
      />
    </div>
  )
}
