import { apiClient } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'
import type { CalculatorHistory } from '@/entities/calculator'

export const calculatorApi = {
  saveHistory: async (data: { expression: string; result: string }): Promise<CalculatorHistory> => {
    const resp: ApiResponse<CalculatorHistory> = await apiClient.post('/v1/calculator/history', data)
    return resp.data
  },

  getHistories: async (): Promise<CalculatorHistory[]> => {
    const resp: ApiResponse<{ histories: CalculatorHistory[] }> = await apiClient.get('/v1/calculator/histories')
    return resp.data.histories
  },

  deleteAllHistories: async (): Promise<void> => {
    const resp: ApiResponse<void> = await apiClient.delete('/v1/calculator/histories')
    return resp.data
  },
}
