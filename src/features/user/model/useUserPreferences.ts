import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { userApi, type UserPreferences } from '../api/userApi'

const PREF_KEY = ['user', 'preferences'] as const

export const useUserPreferences = () => {
  return useQuery({
    queryKey: PREF_KEY,
    queryFn: () => userApi.getPreferences(),
    staleTime: 5 * 60 * 1000,
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
