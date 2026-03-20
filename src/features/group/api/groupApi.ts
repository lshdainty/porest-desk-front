import { apiClient } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'
import type { UserGroup, UserGroupDetail, GroupFormValues, GroupRole } from '@/entities/group'

export const groupApi = {
  createGroup: async (data: GroupFormValues): Promise<UserGroup> => {
    const resp: ApiResponse<UserGroup> = await apiClient.post('/v1/group', data)
    return resp.data
  },

  getGroups: async (): Promise<UserGroup[]> => {
    const resp: ApiResponse<{ groups: UserGroup[] }> = await apiClient.get('/v1/groups')
    return resp.data.groups
  },

  getGroup: async (id: number): Promise<UserGroupDetail> => {
    const resp: ApiResponse<UserGroupDetail> = await apiClient.get(`/v1/group/${id}`)
    return resp.data
  },

  updateGroup: async (id: number, data: GroupFormValues): Promise<UserGroup> => {
    const resp: ApiResponse<UserGroup> = await apiClient.put(`/v1/group/${id}`, data)
    return resp.data
  },

  deleteGroup: async (id: number): Promise<void> => {
    const resp: ApiResponse<void> = await apiClient.delete(`/v1/group/${id}`)
    return resp.data
  },

  regenerateInviteCode: async (id: number): Promise<string> => {
    const resp: ApiResponse<{ inviteCode: string }> = await apiClient.patch(
      `/v1/group/${id}/regenerate-invite-code`
    )
    return resp.data.inviteCode
  },

  joinGroup: async (inviteCode: string): Promise<UserGroupDetail> => {
    const resp: ApiResponse<UserGroupDetail> = await apiClient.post('/v1/group/join', { inviteCode })
    return resp.data
  },

  removeMember: async (groupId: number, memberId: number): Promise<void> => {
    const resp: ApiResponse<void> = await apiClient.delete(
      `/v1/group/${groupId}/member/${memberId}`
    )
    return resp.data
  },

  changeMemberRole: async (groupId: number, memberId: number, role: GroupRole): Promise<void> => {
    const resp: ApiResponse<void> = await apiClient.patch(
      `/v1/group/${groupId}/member/${memberId}/role`,
      { role }
    )
    return resp.data
  },

  getGroupEvents: (groupId: number, startDate: string, endDate: string) =>
    apiClient.get(`/v1/group/${groupId}/calendar/events`, { params: { startDate, endDate } }),

  getGroupExpenses: (groupId: number, params?: { categoryId?: number; expenseType?: string; startDate?: string; endDate?: string }) =>
    apiClient.get(`/v1/group/${groupId}/expenses`, { params }),
}
