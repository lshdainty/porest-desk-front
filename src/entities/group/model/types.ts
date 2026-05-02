export interface GroupTypeItem {
  rowId: number
  typeName: string
  color: string | null
  sortOrder: number
}

export interface GroupTypeFormValues {
  typeName: string
  color?: string
  sortOrder?: number
}

export type GroupRole = 'OWNER' | 'ADMIN' | 'MEMBER'

export interface GroupMember {
  rowId: number
  userRowId: number
  userName: string
  userEmail: string
  role: GroupRole
  joinedAt: string
}

export interface UserGroup {
  rowId: number
  groupName: string
  description: string | null
  groupTypeId: number | null
  groupTypeName: string | null
  groupTypeColor: string | null
  inviteCode: string
  memberCount: number
  createAt: string
}

export interface UserGroupDetail {
  rowId: number
  groupName: string
  description: string | null
  groupTypeId: number | null
  groupTypeName: string | null
  groupTypeColor: string | null
  inviteCode: string
  members: GroupMember[]
  createAt: string
}

export interface SiblingGroupMember {
  userRowId: number
  userName: string
  userEmail: string
  sharedGroupRowIds: number[]
}

export interface GroupFormValues {
  groupName: string
  description?: string
  groupTypeId?: number | null
}

export interface EventComment {
  rowId: number
  eventRowId: number
  userRowId: number
  userName: string
  parentRowId: number | null
  content: string
  createAt: string
  modifyAt: string
}

export interface EventCommentFormValues {
  parentRowId?: number | null
  content: string
}
