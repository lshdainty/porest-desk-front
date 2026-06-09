// 공유 캘린더 멤버 권한 — 소유자 / 편집가능 / 읽기전용.
export type CalendarRole = 'OWNER' | 'EDIT' | 'READ'

export interface UserCalendar {
  rowId: number
  ownerRowId: number
  ownerName: string
  calendarName: string
  color: string
  sortOrder: number
  isDefault: boolean
  isVisible: boolean
  inviteCode: string | null
  isShared: boolean
  isOwner: boolean
  myRole: CalendarRole
  memberCount: number
}

export interface CalendarMember {
  rowId: number
  userRowId: number
  userName: string
  userEmail: string
  permission: CalendarRole
  joinedAt: string
}

export interface UserCalendarFormValues {
  calendarName: string
  color: string
}
