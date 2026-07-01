import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { userApi, type UserPreferences } from '../api/userApi'

const PREF_KEY = ['user', 'preferences'] as const

export const useUserPreferences = () => {
  return useQuery({
    queryKey: PREF_KEY,
    queryFn: () => userApi.getPreferences(),
    // preferences 는 자주 안 바뀜 — 5분 신선도로 마운트/리마운트마다 재요청되던 폭주를 억제.
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
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
