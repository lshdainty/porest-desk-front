import { apiClient } from '@/shared/api'
import type { ApiResponse } from '@/shared/types'
import type { Memo, MemoFormValues } from '@/entities/memo'

export interface MemoListParams {
  folderId?: number
  search?: string
}

// 서버 isPinned 는 YNType('Y'/'N' 문자열) — boolean 으로 정규화 (todoApi mapTodo 패턴).
// 'N' 문자열이 truthy 로 평가돼 전부 고정으로 분류되던 버그 fix.
const mapMemo = (m: Memo): Memo => ({
  ...m,
  isPinned: (m.isPinned as unknown) === 'Y' || m.isPinned === true,
})

export const memoApi = {
  createMemo: async (data: MemoFormValues): Promise<Memo> => {
    const resp: ApiResponse<Memo> = await apiClient.post('/v1/memo', data)
    return mapMemo(resp.data)
  },

  getMemos: async (params?: MemoListParams): Promise<Memo[]> => {
    const resp: ApiResponse<{ memos: Memo[] }> = await apiClient.get('/v1/memos', { params })
    return resp.data.memos.map(mapMemo)
  },

  getMemo: async (id: number): Promise<Memo> => {
    const resp: ApiResponse<Memo> = await apiClient.get(`/v1/memo/${id}`)
    return mapMemo(resp.data)
  },

  updateMemo: async (id: number, data: MemoFormValues): Promise<Memo> => {
    const resp: ApiResponse<Memo> = await apiClient.put(`/v1/memo/${id}`, data)
    return mapMemo(resp.data)
  },

  togglePin: async (id: number): Promise<Memo> => {
    const resp: ApiResponse<Memo> = await apiClient.patch(`/v1/memo/${id}/pin`)
    return mapMemo(resp.data)
  },

  deleteMemo: async (id: number): Promise<void> => {
    const resp: ApiResponse<void> = await apiClient.delete(`/v1/memo/${id}`)
    return resp.data
  },
}
