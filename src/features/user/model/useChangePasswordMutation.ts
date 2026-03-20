import { useMutation } from '@tanstack/react-query'
import { userApi } from '../api/userApi'
import type { ChangePasswordReq } from '../api/userApi'

export const useChangePasswordMutation = () => {
  return useMutation<void, Error, ChangePasswordReq>({
    mutationFn: (data: ChangePasswordReq) => userApi.changePassword(data),
  })
}
