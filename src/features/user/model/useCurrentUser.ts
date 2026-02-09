import { useQuery } from '@tanstack/react-query'
import { authApi } from '@/features/auth/api/authApi'
import type { LoginCheckResponse } from '@/entities/session'

export const useCurrentUser = () => {
  return useQuery<LoginCheckResponse>({
    queryKey: ['currentUser'],
    queryFn: () => authApi.loginCheck(),
    staleTime: 5 * 60 * 1000,
  })
}
