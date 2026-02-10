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
} from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
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
import { useToast } from '@/shared/ui/use-toast'
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
import type { GroupFormValues, UserGroup, GroupRole } from '@/entities/group'

const roleIcons: Record<GroupRole, typeof Crown> = {
  OWNER: Crown,
  ADMIN: Shield,
  MEMBER: User,
}

export const GroupFullWidget = () => {
  const { t } = useTranslation('group')
  const { toast } = useToast()

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
  const [editingGroup, setEditingGroup] = useState<UserGroup | null>(null)
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null)
  const [inviteCode, setInviteCode] = useState('')

  const { data: groupDetail } = useGroup(selectedGroupId ?? 0)

  const handleCreate = (data: GroupFormValues) => {
    createGroup.mutate(data, {
      onSuccess: () => {
        setShowCreateDialog(false)
        toast({ description: t('createSuccess') })
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
          toast({ description: t('updateSuccess') })
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
        toast({ description: t('deleteSuccess') })
      },
    })
  }

  const handleJoin = () => {
    if (!inviteCode.trim()) return
    joinGroup.mutate(inviteCode.trim(), {
      onSuccess: () => {
        setShowJoinDialog(false)
        setInviteCode('')
        toast({ description: t('joinSuccess') })
      },
      onError: () => {
        toast({ description: t('joinError'), variant: 'destructive' })
      },
    })
  }

  const handleRegenerateCode = (groupId: number) => {
    regenerateInviteCode.mutate(groupId, {
      onSuccess: () => {
        toast({ description: t('inviteCodeRegenerated') })
      },
    })
  }

  const handleCopyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast({ description: t('inviteCodeCopied') })
  }

  const handleRemoveMember = (groupId: number, memberId: number) => {
    removeMember.mutate(
      { groupId, memberId },
      {
        onSuccess: () => {
          toast({ description: t('memberRemoved') })
        },
      }
    )
  }

  const handleChangeRole = (groupId: number, memberId: number, role: GroupRole) => {
    changeMemberRole.mutate(
      { groupId, memberId, role },
      {
        onSuccess: () => {
          toast({ description: t('roleChanged') })
        },
      }
    )
  }

  if (isLoading) {
    return <div className="p-4 text-center text-muted-foreground">{t('loading', { ns: 'common' })}</div>
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
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">{groupDetail.groupName}</CardTitle>
              {groupDetail.description && (
                <p className="mt-1 text-sm text-muted-foreground">{groupDetail.description}</p>
              )}
            </div>
            <Badge variant="outline">{t(`groupType.${groupDetail.groupType}`)}</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 rounded-md bg-muted p-3">
              <span className="text-sm font-medium">{t('inviteCode')}:</span>
              <code className="rounded bg-background px-2 py-0.5 text-sm font-mono">
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
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>

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
                      className="flex items-center justify-between rounded-md border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                          <RoleIcon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{member.userName}</p>
                          <p className="text-xs text-muted-foreground">{member.userEmail}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {member.role !== 'OWNER' && (
                          <>
                            <Select
                              value={member.role}
                              onValueChange={(v) =>
                                handleChangeRole(groupDetail.rowId, member.rowId, v as GroupRole)
                              }
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
          </CardContent>
        </Card>
      </div>
    )
  }

  // List view
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button size="sm" onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          {t('addGroup')}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setShowJoinDialog(true)}>
          <LogIn className="mr-1.5 h-4 w-4" />
          {t('joinGroup')}
        </Button>
      </div>

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
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => setSelectedGroupId(group.rowId)}
            >
              <CardContent className="flex items-center justify-between p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-medium">{group.groupName}</h3>
                    <Badge variant="outline" className="text-xs">
                      {t(`groupType.${group.groupType}`)}
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
                <div className="flex items-center gap-1">
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

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('addGroup')}</DialogTitle>
          </DialogHeader>
          <GroupForm onSubmit={handleCreate} onCancel={() => setShowCreateDialog(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingGroup} onOpenChange={() => setEditingGroup(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('editGroup')}</DialogTitle>
          </DialogHeader>
          <GroupForm
            initialData={editingGroup}
            onSubmit={handleUpdate}
            onCancel={() => setEditingGroup(null)}
          />
        </DialogContent>
      </Dialog>

      {/* Join Dialog */}
      <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('joinGroup')}</DialogTitle>
          </DialogHeader>
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
              <Button variant="outline" onClick={() => setShowJoinDialog(false)}>
                {t('cancel', { ns: 'common' })}
              </Button>
              <Button onClick={handleJoin}>{t('join')}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <AlertDialog open={!!deleteTargetId} onOpenChange={() => setDeleteTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteConfirm.title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteConfirm.message')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel', { ns: 'common' })}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>{t('delete', { ns: 'common' })}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
