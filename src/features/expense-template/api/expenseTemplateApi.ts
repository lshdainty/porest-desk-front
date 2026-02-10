import { apiClient } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'
import type { ExpenseTemplate, ExpenseTemplateFormValues, ExpenseTemplateUseValues } from '@/entities/expense-template'
import type { Expense } from '@/entities/expense'

export const expenseTemplateApi = {
  createTemplate: async (data: ExpenseTemplateFormValues): Promise<ExpenseTemplate> => {
    const resp: ApiResponse<ExpenseTemplate> = await apiClient.post('/v1/expense-template', data)
    return resp.data
  },

  getTemplates: async (): Promise<{ templates: ExpenseTemplate[] }> => {
    const resp: ApiResponse<{ templates: ExpenseTemplate[] }> = await apiClient.get('/v1/expense-templates')
    return resp.data
  },

  updateTemplate: async (id: number, data: ExpenseTemplateFormValues): Promise<ExpenseTemplate> => {
    const resp: ApiResponse<ExpenseTemplate> = await apiClient.put(`/v1/expense-template/${id}`, data)
    return resp.data
  },

  deleteTemplate: async (id: number): Promise<void> => {
    const resp: ApiResponse<void> = await apiClient.delete(`/v1/expense-template/${id}`)
    return resp.data
  },

  useTemplate: async (id: number, data: ExpenseTemplateUseValues): Promise<Expense> => {
    const resp: ApiResponse<Expense> = await apiClient.post(`/v1/expense-template/${id}/use`, data)
    return resp.data
  },
}
