import { apiClient } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'
import type { EventLabel, EventLabelFormValues } from '@/entities/event-label'

export const eventLabelApi = {
  createLabel: async (data: EventLabelFormValues): Promise<EventLabel> => {
    const resp: ApiResponse<EventLabel> = await apiClient.post('/v1/calendar/label', data)
    return resp.data
  },

  getLabels: async (): Promise<EventLabel[]> => {
    const resp: ApiResponse<{ labels: EventLabel[] }> = await apiClient.get('/v1/calendar/labels')
    return resp.data.labels
  },

  updateLabel: async (id: number, data: EventLabelFormValues): Promise<EventLabel> => {
    const resp: ApiResponse<EventLabel> = await apiClient.put(`/v1/calendar/label/${id}`, data)
    return resp.data
  },

  deleteLabel: async (id: number): Promise<void> => {
    const resp: ApiResponse<void> = await apiClient.delete(`/v1/calendar/label/${id}`)
    return resp.data
  },
}
