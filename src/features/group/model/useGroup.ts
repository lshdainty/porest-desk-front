import { useQuery } from '@tanstack/react-query'
import { groupKeys } from '@/shared/config'
import { groupApi } from '../api/groupApi'

/// DutchPay 참가자 빠른추가 — 내가 속한 그룹들의 형제 멤버 풀.
export const useSiblingGroupMembers = () => {
  return useQuery({
    queryKey: groupKeys.siblingMembers(),
    queryFn: () => groupApi.getSiblingMembers(),
  })
}
