export type GroupType = 'FAMILY' | 'COUPLE' | 'FRIENDS' | 'CUSTOM'

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
  groupType: GroupType
  inviteCode: string
  memberCount: number
  createAt: string
}

export interface UserGroupDetail {
  rowId: number
  groupName: string
  description: string | null
  groupType: GroupType
  inviteCode: string
  members: GroupMember[]
  createAt: string
}

export interface GroupFormValues {
  groupName: string
  description?: string
  groupType: GroupType
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
