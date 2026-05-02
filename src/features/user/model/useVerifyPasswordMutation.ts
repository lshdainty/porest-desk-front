import { useMutation } from '@tanstack/react-query'
import { userApi } from '../api/userApi'

export const useVerifyPasswordMutation = () => {
  return useMutation<void, Error, string>({
    mutationFn: (password: string) => userApi.verifyPassword(password),
  })
}
