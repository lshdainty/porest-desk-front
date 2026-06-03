import { apiClient } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'
import type { SiblingGroupMember } from '@/entities/group'

// group UI 폐지(캘린더 공유 → user_calendar). DutchPay 형제 멤버 조회만 유지.
export const groupApi = {
  getSiblingMembers: async (): Promise<SiblingGroupMember[]> => {
    const resp: ApiResponse<{ members: SiblingGroupMember[] }> = await apiClient.get('/v1/groups/members')
    return resp.data.members
  },
}
