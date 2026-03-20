import { apiClient } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'
import type { GroupTypeItem, GroupTypeFormValues } from '@/entities/group'

export const groupTypeApi = {
  getGroupTypes: async (): Promise<GroupTypeItem[]> => {
    const resp: ApiResponse<{ groupTypes: GroupTypeItem[] }> = await apiClient.get('/v1/group-types')
    return resp.data.groupTypes
  },

  createGroupType: async (data: GroupTypeFormValues): Promise<GroupTypeItem> => {
    const resp: ApiResponse<GroupTypeItem> = await apiClient.post('/v1/group-type', data)
    return resp.data
  },

  updateGroupType: async (id: number, data: GroupTypeFormValues): Promise<GroupTypeItem> => {
    const resp: ApiResponse<GroupTypeItem> = await apiClient.put(`/v1/group-type/${id}`, data)
    return resp.data
  },

  deleteGroupType: async (id: number): Promise<void> => {
    const resp: ApiResponse<void> = await apiClient.delete(`/v1/group-type/${id}`)
    return resp.data
  },
}
