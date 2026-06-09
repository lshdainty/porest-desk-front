import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { userApi, type UserPreferences } from '../api/userApi'

const PREF_KEY = ['user', 'preferences'] as const

export const useUserPreferences = () => {
  return useQuery({
    queryKey: PREF_KEY,
    queryFn: () => userApi.getPreferences(),
    // 앱 등 다른 클라이언트에서 바꾼 값이 바로 보이도록 — 항상 신선도 0 + 포커스 복귀 시 재조회.
    staleTime: 0,
    refetchOnWindowFocus: true,
  })
}

export const useUpdateUserPreferences = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<UserPreferences>) => userApi.updatePreferences(data),
    onSuccess: (resp) => {
      qc.setQueryData(PREF_KEY, resp)
    },
  })
}
